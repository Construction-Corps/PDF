"use client";

import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { GoogleMap, Marker, InfoWindow, OverlayView } from '@react-google-maps/api';
import JobTile from '../components/JobTile';
import {
    MapContainer,
    TopBar,
    ContentWrapper,
    JobsList,
    MapDiv,
    Legend,
    LegendRow,
    MapStyles
} from './JobMap.styles';
import { fetchJobTread } from '../../utils/JobTreadApi';
import { ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import Image from 'next/image';
import JobStatusFilter from '../components/JobStatusFilter';

const RefreshButton = styled.button`
  position: absolute;
  top: 10px;
  right: 55px;
  background: white;
  font-size: 18px;
  border: 2px solid rgba(0, 0, 0, 0.0);
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
  border-radius: 2px;
  cursor: pointer;
  padding: 8px 8px;
  z-index: 1;
  
  &:hover {
    background: #f4f4f4;
  }
`;

const Watermark = styled.div`
  position: absolute;
  top: 60px;
  left: 35px;
//   transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  user-select: none;
  opacity: 0.2;
  
  img {
    width: auto;
    height: 100px;
  }
`;

const JobMap = () => {
    const [showJobs, setShowJobs] = useState(false);
    const [markers, setMarkers] = useState(new Map());
    const [activeFilters, setActiveFilters] = useState(new Set());
    const [jobs, setJobs] = useState([]);
    const [currentInfoWindow, setCurrentInfoWindow] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Add these new states for the map
    const [map, setMap] = useState(null);
    const [bounds, setBounds] = useState(null);
    
    const estimatorColors = {
        'Jake': '#FF4444',
        'Jonathan': '#33B679',
        'Dan': '#7986CB',
        'Jim': '#FFB300',
        'Russ': '#8E24AA',
        'Matt': '#0288D1',
        'Pablo': '#26A69A',
        'Other': '#757575'
    };
    
    // We're no longer setting initial value here, it will come from JobStatusFilter via localStorage
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const mapOptions = {
        zoom: 11,
        disableAutoPan: true,
        center: { lat: 27.8959, lng: -82.7001 },
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }]
            }
        ]
    };
    
    const fetchJobs = async () => {
        if (!isClient || !map || selectedStatuses.length === 0) return;
        
        setIsLoading(true);
        
        const jobsQuery = {
            "organization": {
                "id": {},
                "jobs": {
                    "nextPage": {},
                    $:{
                        "size": 75,
                        "with": {
                            "cf": {
                                "_": "customFieldValues",
                                "$": {
                                    "where": [
                                        ["customField", "id"],
                                        "22NwzQcjYUA4"
                                    ]
                                },
                                "values": {
                                    "$": {
                                        "field": "value"
                                    }
                                }
                            }
                        },
                        "where": {
                            "and": [
                                ["closedOn","=",null],
                                {
                                    "or": selectedStatuses.map(status => 
                                        [["cf", "values"], "=", status]
                                    )
                                }
                            ]
                        }
                    },
                    "nodes": {
                        "id": {},
                        "name": {},
                        "location": {
                            "city": {},
                            "street": {},
                            "state": {},
                            "postalCode": {},
                            "id": {}
                        },
                        "createdAt": {},
                        "customFieldValues": {
                            "nodes": {
                                "value": {},
                                "customField": {
                                    "name": {}
                                }
                            }
                        }
                    }
                }
            }
        };
        
        try {
            const data = await fetchJobTread(jobsQuery);
            const jobsList = data.organization?.jobs?.nodes;
            if (!jobsList?.length) {
                console.log("No jobs found");
                setJobs([]);
                setMarkers(new Map());
                setIsLoading(false);
                return;
            }
            
            setJobs(jobsList);
            
            const newMarkers = new Map();
            const newBounds = new google.maps.LatLngBounds();
            let markersCount = 0;
            
            jobsList.forEach(job => {
                const estimator = job.customFieldValues.nodes.find(node => 
                    node.customField.name === "Estimator"
                )?.value || 'Other';
                
                const address = `${job.location.street}, ${job.location.city}, ${job.location.state} ${job.location.postalCode}`;
                const geocoder = new google.maps.Geocoder();
                
                geocoder.geocode({ address }, (results, status) => {
                    if (status === "OK") {
                        const position = results[0].geometry.location;
                        newBounds.extend(position);
                        markersCount++;
                        
                        newMarkers.set(job.id, { 
                            position: { lat: position.lat(), lng: position.lng() },
                            estimator,
                            job 
                        });
                        
                        if (markersCount === jobsList.length) {
                            setMarkers(newMarkers);
                            setBounds(newBounds);
                            
                            // Add a slight delay before fitting bounds to ensure smooth transition
                            if (newBounds.isEmpty()) return;
                            
                            setTimeout(() => {
                                map.fitBounds(newBounds);
                                setTimeout(() => {
                                    if (map.getZoom() > 14) {
                                        map.setZoom(14);
                                    }
                                }, 100);
                                setIsLoading(false);
                            }, 500);
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setIsLoading(false);
        }
    };
    
    // Fetch jobs when selectedStatuses changes or map is loaded
    useEffect(() => {
        if (selectedStatuses.length > 0 && map) {
            fetchJobs();
        }
    }, [selectedStatuses, map]);
    
    const handleFilterClick = (name) => {
        const newFilters = new Set(activeFilters);
        if (newFilters.has(name)) {
            newFilters.delete(name);
        } else {
            newFilters.add(name);
        }
        setActiveFilters(newFilters);
        
        if (newFilters.size === 0) {
            // Show all markers when no filters are active
            // (No need to do anything since rendering logic uses activeFilters)
        }
    };
    
    const handleRefresh = () => {
        // Just reload the data without clearing everything
        fetchJobs();
    };
    
    const handleStatusChange = (newStatuses) => {
        setSelectedStatuses(newStatuses);
        // Don't call fetchJobs() here - it will be triggered by the useEffect
    };
    
    // Don't render the map container until we're on the client
    if (!isClient) return null;
    
    return (
        <MapContainer>
            <MapStyles />
            <TopBar>
                <Switch
                    checked={showJobs}
                    onChange={setShowJobs}
                    checkedChildren="Hide Job List"
                    unCheckedChildren="Show Job List"
                />
            </TopBar>
            
            <ContentWrapper>
                <JobStatusFilter onStatusChange={handleStatusChange} />
                
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255,255,255,0.8)',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        zIndex: 100
                    }}>
                        Loading...
                    </div>
                )}
                
                {showJobs && (
                    <JobsList visible={showJobs} id="jobsList">
                        {jobs.map(job => (
                            <div 
                                key={job.id}
                                onClick={() => {
                                    const markerInfo = markers.get(job.id);
                                    if (markerInfo) {
                                        setSelectedJob({...job, position: markerInfo.position});
                                    }
                                }}
                            >
                                <JobTile job={job} />
                            </div>
                        ))}
                    </JobsList>
                )}
                
                <MapDiv>
                    <RefreshButton onClick={handleRefresh}>
                        <ReloadOutlined />
                    </RefreshButton>
                    <Watermark>
                        <Image 
                            src="/images/cc-logo.png"
                            alt="Construction Corpos"
                            width={800}
                            height={400}
                            priority
                        />
                    </Watermark>
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        options={{
                            ...mapOptions,
                            scrollwheel: true
                        }}
                        onLoad={setMap}
                    >
                        {Array.from(markers.values()).map(({ position, estimator, job }) => (
                            <React.Fragment key={job.id}>
                                <Marker
                                    position={position}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        fillColor: estimatorColors[estimator] || estimatorColors['Other'],
                                        fillOpacity: 1,
                                        strokeWeight: 1,
                                        strokeColor: '#FFFFFF',
                                        scale: 10
                                    }}
                                    onClick={() => setSelectedJob({ ...job, position })}
                                    visible={activeFilters.size === 0 || activeFilters.has(estimator)}
                                    label={{
                                        text: job.name,
                                        className: 'marker-label',
                                        color: 'black',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </React.Fragment>
                        ))}
                        
                        {selectedJob && (
                            <InfoWindow
                                position={selectedJob.position}
                                onCloseClick={() => setSelectedJob(null)}
                            >
                                <div>
                                    <JobTile job={selectedJob} type="map" />
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </MapDiv>
                
                <Legend>
                    {Object.entries(estimatorColors).map(([name, color]) => (
                        <LegendRow
                            key={name}
                            active={activeFilters.has(name)}
                            onClick={() => handleFilterClick(name)}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: color,
                                    borderRadius: '50%',
                                    marginRight: '5px',
                                    verticalAlign: 'middle',
                                }}
                            />
                            {name}
                        </LegendRow>
                    ))}
                </Legend>
            </ContentWrapper>
        </MapContainer>
    );
};

export default JobMap;

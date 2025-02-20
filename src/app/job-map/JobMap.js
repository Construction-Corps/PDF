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

const JobMap = () => {
    const [showJobs, setShowJobs] = useState(false);
    const [markers] = useState(new Map());
    const [activeFilters, setActiveFilters] = useState(new Set());
    const [jobs, setJobs] = useState([]);
    const [currentInfoWindow, setCurrentInfoWindow] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    
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
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const mapOptions = {
        zoom: 11,
        disableAutoPan: true,  // Add this to prevent automatic panning
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
    
    useEffect(() => {
        if (!isClient || !map) return;
        
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
                                    "or": [
                                        [["cf", "values"], "=", "Job Started"],
                                        [["cf", "values"], "=", "Job Mid Way"],
                                        [["cf", "values"], "=", "Job Complete"],
                                        [["cf", "values"], "=", "Design Sold"],
                                        [["cf", "values"], "=", "SELL THE PROJECT!!!"],
                                        [["cf", "values"], "=", "At Cost"],
                                        [["cf", "values"], "=", "Pre-Production"]
                                    ]
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
        
        fetchJobTread(jobsQuery)
        .then(data => {
            const jobsList = data.organization?.jobs?.nodes;
            if (!jobsList?.length) {
                console.log("No jobs found");
                return;
            }
            
            setJobs(jobsList);
            
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
                        
                        markers.set(job.id, { 
                            position: { lat: position.lat(), lng: position.lng() },
                            estimator,
                            job 
                        });
                        
                        if (markersCount === jobsList.length) {
                            setBounds(newBounds);
                            // Add a slight delay before fitting bounds to ensure smooth transition
                            setTimeout(() => {
                                map.fitBounds(newBounds);
                                setTimeout(() => {
                                    map.setZoom(map.getZoom() );
                                }, 100);
                            }, 500);
                        }
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error fetching jobs:", error);
        });
    }, [isClient, map]);
    
    const handleFilterClick = (name) => {
        const newFilters = new Set(activeFilters);
        if (newFilters.has(name)) {
            newFilters.delete(name);
        } else {
            newFilters.add(name);
        }
        setActiveFilters(newFilters);
        
        if (newFilters.size === 0) {
            markers.forEach((markerInfo) => {
                markerInfo.marker.setVisible(true);
            });
        } else {
            markers.forEach((markerInfo) => {
                markerInfo.marker.setVisible(newFilters.has(markerInfo.estimator));
            });
        }
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
        {showJobs && (
            <JobsList visible={showJobs} id="jobsList">
            {jobs.map(job => (
                <div 
                key={job.id}
                onClick={() => {
                    const markerInfo = markers.get(job.id);
                    if (markerInfo) {
                        google.maps.event.trigger(markerInfo.marker, 'click');
                    }
                }}
                >
                <JobTile job={job} />
                </div>
            ))}
            </JobsList>
        )}
        
        <MapDiv>
        <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
            ...mapOptions,
            // Add these options to reduce label flicker
            //   gestureHandling: 'cooperative',
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

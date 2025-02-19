"use client";

import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';
import styled from 'styled-components';
import JobTile from '../components/JobTile';

// Styled components to replace the CSS
const MapContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  background: white;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  position: relative;
`;

const JobsList = styled.div`
  position: absolute;
  left: ${props => props.visible ? '0' : '-400px'};
  top: 0;
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  transition: left 0.3s ease;
  z-index: 900;
  overflow-y: auto;
  padding: 20px;

  > div {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const MapDiv = styled.div`
  flex: 1;
  width: 100%;
`;

const Legend = styled.div`
  position: fixed;
  bottom: 50px;
  right: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 800;
`;

const LegendRow = styled.div`
  margin-bottom: 5px;
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  background-color: ${props => props.active ? 'rgba(0,0,0,0.1)' : 'transparent'};
`;

const JobMap = () => {
  const [showJobs, setShowJobs] = useState(false);
  const [markers] = useState(new Map());
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  const [currentInfoWindow, setCurrentInfoWindow] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Define constants from the original code
  const proxyEndpoint = "https://be.humanagement.io/actions/api/jobtread-proxy/";
  const grantKey = "22SkCV5JXCtY6eKk5w2ZWBsyhpBBrr6Lea";
  const organizationId = "22NwWhUAf6VB";

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

  useEffect(() => {
    if (!isClient) return;

    let currentInfoWindow = null;

    const query = {
      // ... keeping the exact same query object from the original code ...
      "query": {
        "$": { "grantKey": grantKey },
        "organization": {
          "$": { "id": organizationId },
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
                    [
                    "customField",
                    "id"
                    ],
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
                  [["cf", "values"], "=", "At Cost"]                                  
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
      }
    };

    // Initialize map with the same custom styles
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 4,
      center: { lat: 39.8283, lng: -98.5795 },
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
    });

    fetch(proxyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    })
    .then(response => response.json())
    .then(data => {
      const jobsList = data.organization?.jobs?.nodes;
      if (!jobsList?.length) {
        console.log("No jobs found");
        return;
      }

      setJobs(jobsList); // Store jobs in state
      
      const bounds = new google.maps.LatLngBounds();
      let markersCount = 0;

      jobsList.forEach(job => {
        const estimator = job.customFieldValues.nodes.find(node => 
          node.customField.name === "Estimator"
        )?.value || 'Other';

        const address = `${job.location.street}, ${job.location.city}, ${job.location.state} ${job.location.postalCode}`;
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK") {
            const marker = new google.maps.Marker({
              map,
              position: results[0].geometry.location,
              title: job.name,
              label: {
                text: job.name,
                fontSize: "8px",
                background: "white",
                class: "marker-label"

              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: estimatorColors[estimator] || estimatorColors['Other'],
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#FFFFFF',
                scale: 10,
                labelOrigin: new google.maps.Point(0, -2)
              }
            });

            bounds.extend(results[0].geometry.location);
            markersCount++;

            if (markersCount === jobsList.length) {
              map.fitBounds(bounds);
              setTimeout(() => {
                map.setZoom(map.getZoom() + .5);
              }, 100);
            }

            const infoWindow = new google.maps.InfoWindow({
              content: `<div class="info-window"> <JobTile job={job} type="map" /></div>`
            });

            marker.addListener("click", () => {
              if (currentInfoWindow) {
                currentInfoWindow.close();
              }
              infoWindow.open(map, marker);
              setCurrentInfoWindow(infoWindow);
            });

            markers.set(job.id, { marker, estimator });
          }
        });
      });
    })
    .catch(error => {
      console.error("Error fetching jobs:", error);
      document.getElementById("jobsList").textContent = "Error loading jobs.";
    });
  }, [isClient]);

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
      <TopBar>
        <Switch
          checked={showJobs}
          onChange={setShowJobs}
          checkedChildren="Hide Job List"
          unCheckedChildren="Show Job List"
        />
      </TopBar>

      <ContentWrapper>
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
        
        <MapDiv id="map" />

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

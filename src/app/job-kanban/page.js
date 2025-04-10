'use client'

import { Layout, Card, Button, Spin, message } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { fetchJobTread, updateJobTread } from '../../utils/JobTreadApi'
import JobTile from '../components/JobTile'
import JobStatusFilter from '../components/JobStatusFilter'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Link from 'next/link'
import ThemeSwitch from '../components/ThemeSwitch'
import { CaretDownOutlined, CaretRightOutlined, ExportOutlined } from '@ant-design/icons'
import { useSearchParams } from 'next/navigation'

const { Content } = Layout

// Styled components for the kanban board
const KanbanContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const BoardContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 20px 0;
  min-height: calc(100vh - 200px);
`

const Column = styled.div`
  background: var(--column-background, #f5f5f5);
  border-radius: 8px;
  min-width: 300px;
  width: 300px;
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
`

const ColumnHeader = styled.div`
  padding: 16px;
  font-weight: bold;
  background: var(--column-header, #e0e0e0);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ColumnContent = styled.div`
  padding: 8px;
  flex-grow: 1;
  overflow-y: auto;
`

const JobCard = styled.div`
  margin-bottom: 12px;
  border-radius: 4px;
  background: var(--card-background, white);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 12px;
`

const JobCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.isExpanded ? '12px' : '0'};
  cursor: pointer;
`

const JobCardContent = styled.div`
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${props => props.isExpanded ? '1000px' : '0'};
`

const JobCardTitle = styled.div`
  font-weight: bold;
  font-size: 14px;
`

const JobCardActions = styled.div`
  display: flex;
  gap: 8px;
`

// Add a function to generate lane colors
const generateLaneColors = (columnCount, columnNames) => {
  const colors = {};
  
  // Set Unassigned to light grey
  if (columnNames.includes("Unassigned")) {
    colors["Unassigned"] = {
      header: 'var(--column-header, #e0e0e0)',
      background: 'var(--column-background, #f5f5f5)'
    };
  }
  
  // Calculate colors for the remaining columns
  const remainingColumns = columnNames.filter(name => name !== "Unassigned");
  
  // Generate evenly spaced hues for remaining columns
  remainingColumns.forEach((columnName, index) => {
    // Calculate hue (0-360) based on position and total columns
    const hue = Math.floor(index * (360 / remainingColumns.length));
    
    // Use light pastels (high lightness, low saturation)
    colors[columnName] = {
      header: `hsl(${hue}, 40%, 85%)`,
      background: `hsl(${hue}, 25%, 95%)`
    };
  });
  
  return colors;
};

export default function JobKanbanPage() {
  const searchParams = useSearchParams();
  const fieldId = searchParams.get('fieldId') || "22NwzQcjYUA4"; // Default to original ID if not provided
  const [fieldName, setFieldName] = useState("Job Stage");
  const [columns, setColumns] = useState({});
  const [stageOptions, setStageOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [expandedJobIds, setExpandedJobIds] = useState(new Set());
  const [jobDetails, setJobDetails] = useState({});
  const [filterParams, setFilterParams] = useState({
    statuses: [],
    estimators: [],
    managers: [],
    search: "",
  });
  const [columnColors, setColumnColors] = useState({});

  // Handle combined filter changes from JobStatusFilter
  const handleFiltersChange = useCallback((filters) => {
    setFilterParams(filters);
  }, []);

  // Fetch field name and options when fieldId changes
  useEffect(() => {
    const fetchFieldInfo = async () => {
      try {
        const fieldQuery = {
          "organization": {
            "$": {
              "id": "22NwWhUAf6VB"
            },
            "id": {},
            "customFields": {
              "nodes": {
                "id": {},
                "name": {},
                "options": {}
              },
              "$": {
                "where": {
                  "or": [
                    ["id", "=", fieldId],
                  ]
                }
              }
            }
          }
        };
        
        const data = await fetchJobTread(fieldQuery);


        if (data?.organization?.customFields?.nodes[0]) {
          // Set field name
          if (data.organization.customFields.nodes[0].name) {
            setFieldName(data.organization.customFields.nodes[0].name);
          }
          
          // Set lane options
          if (data.organization.customFields.nodes[0].options) {
            const options = data.organization.customFields.nodes[0].options;
            setStageOptions(options);
          }
        }
      } catch (error) {
        console.error("Error fetching field info:", error);
      }
    };
    
    fetchFieldInfo();
    // Reset columns when field ID changes
    setColumns({});
  }, [fieldId]);

  // Fetch jobs based on filter parameters
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const jobsQuery = {
        "organization": {
          "id": {},
          "jobs": {
            $:{
              "size": 75,
              "with": {
                "cf": {
                  "_": "customFieldValues",
                  "$": {
                    "where": [
                      ["customField", "id"],
                      fieldId
                    ]
                  },
                  "values": {
                    "$": {
                      "field": "value"
                    }
                  }
                },
                cf2: {
                  "_": "customFieldValues",
                  "$": {
                    "where": [["customField", "id"], "=", "22NwWybgjBTW"]
                  },
                  "values": {
                    "$": {
                      "field": "value"
                    }
                  }
                },
                cf3: {
                  "_": "customFieldValues",
                  "$": {
                    "where": [["customField", "id"], "=", "22P2ZNybRiyG"]
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
                  ...(filterParams.search ? [["name", "like", `%${filterParams.search}%`]] : []),
                  
                  ...(filterParams.statuses.length > 0 ? [{
                    "or": filterParams.statuses.map(status => 
                      [["cf", "values"], "=", status]
                    )
                  }] : []),
                  
                  ...(filterParams.estimators.length > 0 ? [{
                    "or": filterParams.estimators.map(estimator => 
                      [["cf2", "values"], "=", estimator]
                    )
                  }] : []),
                  ...(filterParams.managers.length > 0 ? [{
                    "or": filterParams.managers.map(manager => 
                      [["cf3", "values"], "=", manager]
                    )
                  }] : [])
                ],
              }
            },
            "nodes": {
              "id": {},
              "name": {},
              "createdAt": {},
              "location": {
                "city": {},
                "street": {},
                "state": {},
                "postalCode": {},
                "id": {}
              },
              "customFieldValues": {
                "nodes": {
                  "value": {},
                  "customField": {
                    "id": {},
                    "name": {}
                  }
                }
              }
            }
          }
        }
      };

      const data = await fetchJobTread(jobsQuery);
      
      if (data?.organization?.jobs?.nodes) {
        setJobs(data.organization.jobs.nodes);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [filterParams, fieldId]);

  // Function to fetch job details for expanded view
  const fetchJobDetails = useCallback(async (jobId) => {
    if (jobDetails[jobId]) return; // Already fetched
    
    try {
      const detailsQuery = {
        "job": {
          "$": {
            "id": jobId
          },
          "id": {},
          "createdAt": {},
          "comments": {
            "nodes": {
              "id": {},
              "message": {},
              "name": {},
              "createdAt": {},
              "createdByUser": {
                "name": {}
              }
            }
          },
          "dailyLogs": {
            "nodes": {
              "id": {},
              "notes": {},
              "date": {},
              "user": {
                "name": {}
              }
            }
          },
          "tasks": {
            "nodes": {
              "id": {},
              "description": {},
              "completed": {},
              "progress": {},
              "name": {},
              "endDate": {},
              "startDate": {},
              "createdAt": {},
            }
          },
          "documents": {
            "nodes": {
              "id": {},
              "price": {},
              "signedAt": {},
              "issueDate": {},
              "amountPaid": {},
              "balance": {},
              "status": {},
              "fullName": {},
              "type": {}
            }
          }
        }
      };
      
      const response = await fetchJobTread(detailsQuery);
      if (response.job) {
        setJobDetails(prev => ({
          ...prev,
          [jobId]: response.job
        }));
      }
    } catch (error) {
      console.error("Error loading job details:", error);
      message.error("Failed to load job details");
    }
  }, [jobDetails]);

  // Toggle expanded job
  const toggleExpandJob = useCallback((jobId) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
        // Fetch details if expanding and not already loaded
        if (!jobDetails[jobId]) {
          fetchJobDetails(jobId);
        }
      }
      return newSet;
    });
  }, [fetchJobDetails, jobDetails]);

  // Organize jobs into columns by stage
  useEffect(() => {
    if (stageOptions.length === 0 || jobs.length === 0) return;

    const newColumns = {};
    let unassignedJobs = [];
    
    // Initialize columns with empty job arrays
    stageOptions.forEach(stage => {
      newColumns[stage] = [];
    });
    
    // Add jobs to appropriate columns
    jobs.forEach(job => {
      const stageCfv = job.customFieldValues.nodes.find(
        node => node.customField.id === fieldId
      );
      
      if (!stageCfv || !stageCfv.value) {
        // Job has no value for this field - add to unassigned
        unassignedJobs.push(job);
      } else {
        const stage = stageCfv.value;
        if (newColumns[stage]) {
          newColumns[stage].push(job);
        } else if (stage !== 'Not Set') {
          // For any stage not in our options, create a new column
          newColumns[stage] = [job];
        }
      }
    });
    
    // Add Unassigned column if there are unassigned jobs
    if (unassignedJobs.length > 0) {
      // Reorder columns to have Unassigned first
      const orderedColumns = { "Unassigned": unassignedJobs };
      // Add all other columns
      Object.entries(newColumns).forEach(([key, value]) => {
        orderedColumns[key] = value;
      });
      setColumns(orderedColumns);
    } else {
      setColumns(newColumns);
    }
  }, [stageOptions, jobs, fieldId]);

  // Fetch jobs when filters change
  useEffect(() => {
    if (stageOptions.length > 0) {
      fetchJobs();
    }
  }, [fetchJobs, stageOptions]);

  // Update job's stage in JobTread API
  const updateJobStage = async (jobId, stage) => {
    try {
      const query = {
        "updateJob": {
          "$": {
            "id": jobId,
            "customFieldValues": {
              // If stage is "Unassigned", set to null to clear the value
              [fieldId]: stage === "Unassigned" ? null : stage
            }
          }
        }
      };

      const result = await updateJobTread(query);
      return result?.updateJob?.job;
    } catch (error) {
      console.error("Error updating job stage:", error);
      throw error;
    }
  };

  // Handle drag end event
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside any droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Don't allow drops outside of defined columns
    if (!columns[destination.droppableId]) return;
    
    try {
      // Optimistic UI update
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const job = sourceColumn.find(job => job.id === draggableId);
      
      const newSourceColumn = [...sourceColumn];
      newSourceColumn.splice(source.index, 1);
      
      const newDestColumn = [...destColumn];
      newDestColumn.splice(destination.index, 0, job);
      
      setColumns({
        ...columns,
        [source.droppableId]: newSourceColumn,
        [destination.droppableId]: newDestColumn
      });

      // Update job stage in API
      const updatedJob = await updateJobStage(draggableId, destination.droppableId);
      
      // If API update successful, update job in state
      if (updatedJob) {
        setJobs(prevJobs => 
          prevJobs.map(prevJob => 
            prevJob.id === draggableId ? updatedJob : prevJob
          )
        );
        message.success(`Job moved to ${destination.droppableId}`);
      }
    } catch (error) {
      // On error, revert to previous state
      message.error("Failed to update job stage");
      fetchJobs(); // Reload jobs to get correct state
    }
  };

  // Update column colors when columns change
  useEffect(() => {
    if (Object.keys(columns).length > 0) {
      setColumnColors(generateLaneColors(Object.keys(columns).length, Object.keys(columns)));
    }
  }, [columns]);

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ padding: '20px', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="ml-5" style={{ color: 'var(--foreground)' }}>{fieldName} Kanban Board</h1>
          
        </div>

        <JobStatusFilter 
          onFiltersChange={handleFiltersChange}
          onFieldOptionsLoaded={()=>{}}
          fieldId={fieldId}
        />

        <KanbanContainer>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <BoardContainer>
                {Object.keys(columns).map(columnId => {
                  const columnColor = columnColors[columnId] || {
                    header: 'var(--column-header, #e0e0e0)',
                    background: 'var(--column-background, #f5f5f5)'
                  };
                  
                  return (
                    <Column key={columnId} style={{ background: columnColor.background }}>
                      <ColumnHeader style={{ background: columnColor.header }}>
                        {columnId}
                        <span>{columns[columnId].length}</span>
                      </ColumnHeader>
                      <Droppable droppableId={columnId}>
                        {(provided) => (
                          <ColumnContent
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {columns[columnId].map((job, index) => {
                              const isExpanded = expandedJobIds.has(job.id);
                              const hasDetails = !!jobDetails[job.id];
                              
                              // Get job info for display in the collapsed view
                              const estimator = job.customFieldValues.nodes.find(node => 
                                node.customField.name === "Estimator"
                              )?.value || 'Not Assigned';
                              
                              const productionManager = job.customFieldValues.nodes.find(node => 
                                node.customField.name === "Production Manager"
                              )?.value || 'Not Assigned';
                              
                              const address = job.location ? 
                                `${job.location.city}, ${job.location.state}` : 
                                'No address';
                              
                              return (
                                <Draggable
                                  key={job.id}
                                  draggableId={job.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <JobCard
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.8 : 1
                                      }}
                                    >
                                      <JobCardHeader 
                                        isExpanded={isExpanded}
                                        onClick={() => toggleExpandJob(job.id)}
                                        {...provided.dragHandleProps}
                                      >
                                        <JobCardTitle>{job.name}</JobCardTitle>
                                        <JobCardActions onClick={e => e.stopPropagation()}>
                                          <Button 
                                            type="text" 
                                            size="small"
                                            icon={<ExportOutlined />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://app.jobtread.com/jobs/${job.id}`, '_blank');
                                            }}
                                          />
                                          {isExpanded ? 
                                            <CaretDownOutlined /> : 
                                            <CaretRightOutlined />
                                          }
                                        </JobCardActions>
                                      </JobCardHeader>
                                      
                                      <div 
                                        style={{ marginBottom: isExpanded ? 12 : 0 }}
                                        {...provided.dragHandleProps}
                                      >
                                        <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.65)' }}>
                                          {estimator} | {address}
                                        </div>
                                      </div>
                                      
                                      <JobCardContent isExpanded={isExpanded}>
                                        {isExpanded && !hasDetails && (
                                          <div style={{ padding: '10px 0', textAlign: 'center' }}>
                                            <Spin size="small" /> Loading details...
                                          </div>
                                        )}
                                        
                                        {isExpanded && hasDetails && (
                                          <JobTile 
                                            job={{
                                              ...job,
                                              ...jobDetails[job.id]
                                            }} 
                                            inlineStyle={true}
                                          />
                                        )}
                                      </JobCardContent>
                                    </JobCard>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </ColumnContent>
                        )}
                      </Droppable>
                    </Column>
                  );
                })}
              </BoardContainer>
            </DragDropContext>
          )}
        </KanbanContainer>
      </Content>
    </Layout>
  )
} 
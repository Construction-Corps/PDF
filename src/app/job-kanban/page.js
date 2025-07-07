'use client'

import { Layout, Card, Button, Spin, message, Checkbox, Input } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { fetchJobTread, updateJobTread } from '../../utils/JobTreadApi'
import JobTile from '../components/JobTile'
import JobStatusFilter from '../components/JobStatusFilter'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import ThemeSwitch from '../components/ThemeSwitch'
import { CaretDownOutlined, CaretRightOutlined, ExportOutlined, HolderOutlined } from '@ant-design/icons'
import { useSearchParams } from 'next/navigation'
import { isTwoCNChar } from 'antd/es/button'
import { useAuth } from '../../contexts/AuthContext'

const { Content } = Layout

// Styled components for the kanban board
const KanbanContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const BoardContainer = styled.div`
  display: flex;
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
  const [loadingJobDetails, setLoadingJobDetails] = useState(new Set());
  const [filterParams, setFilterParams] = useState({
    search: "",
    sort: {
      field: "createdAt",
      order: "desc"
    },
  });
  const [columnColors, setColumnColors] = useState({});
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [editingTask, setEditingTask] = useState({ id: null, value: '' });
  const { user, userPermissions, loading: authLoading } = useAuth();

  // Handle filters change from JobStatusFilter
  const handleFiltersChange = useCallback((filters) => {
    console.log("Filters changed:", filters);
    setFilterParams(filters);
  }, []);

  // Handle field options loaded
  const handleFieldOptionsLoaded = useCallback((options) => {
    console.log("Field options loaded:", options);

    // Find our kanban field in the data
    const kanbanField = options.fieldsData?.find(f => f.id === fieldId);
    if (kanbanField) {
      setFieldName(kanbanField.name);
      setStageOptions(kanbanField.options || []);
    }

    // Also set column colors
    if (kanbanField?.options) {
      setColumnColors(generateLaneColors(kanbanField.options.length, kanbanField.options));
    }
  }, [fieldId]);

  console.log("[JobKanbanPage] user", user);
  console.log("[JobKanbanPage] userPermissions", userPermissions);

  // Check if user has "Ext Design" role
  const hasExtDesignRole = user?.profile?.roles?.some(role => role.name === "Ext Design");
  console.log("[JobKanbanPage] hasExtDesignRole", hasExtDesignRole);
  // console.log("[JobKanbanPage] user.profile?.roles", user?.profile?.roles);

  // Utility function to ensure no job appears in multiple columns
  const deduplicateColumns = useCallback((columnsToCheck) => {
    const seenJobIds = new Set();
    const deduplicatedColumns = {};
    
    // Process columns in order and remove duplicates
    Object.entries(columnsToCheck).forEach(([columnId, jobs]) => {
      deduplicatedColumns[columnId] = jobs.filter(job => {
        if (seenJobIds.has(job.id)) {
          console.warn(`Duplicate job found: ${job.id} in column ${columnId}, removing duplicate`);
          return false;
        }
        seenJobIds.add(job.id);
        return true;
      });
    });
    
    return deduplicatedColumns;
  }, []);

  // Fetch jobs based on filter parameters
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Collect all fields that need to be included in the query
      const withObject = {};
      const whereConditions = [
        ["closedOn", "=", null],
        ...(filterParams.search ? [["name", "like", `%${filterParams.search}%`]] : []),
      ];

      // Always include the field for the kanban board


      // Add all other fields from filterParams that have IDs as keys
      Object.keys(filterParams).forEach(key => {
        // Skip non-field properties
        if (key === 'search' || key === 'sort') {
          return;
        }

        // If this looks like a field ID
        if (key.startsWith('22') && Array.isArray(filterParams[key]) && filterParams[key].length > 0) {
          // Skip the kanban field, it's already included
          // if (key === fieldId) {
          //   return;
          // }

          // Create alias for this field
          const alias = `cf_${key.substring(key.length - 5)}`;

          // Add to the with object
          withObject[alias] = {
            "_": "customFieldValues",
            "$": {
              "where": [
                ["customField", "id"],
                key
              ]
            },
            "values": {
              "$": {
                "field": "value"
              }
            }
          };

          // Add to where conditions
          whereConditions.push({
            "or": filterParams[key].map(value =>
              [[alias, "values"], "=", value]
            )
          });
        }
      });

      const jobsQuery = {
        "organization": {
          "id": {},
          "jobs": {
            "nextPage": {},
            $:{
              "page": "",
              "size": 50,
              "sortBy": [
                {
                  "field": filterParams.sort?.field || "createdAt",
                  "order": filterParams.sort?.order || "desc"
                }
              ],
              "with": withObject,
              "where": {
                "and": whereConditions
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
              },
              "tasks": {
                "$": {
                  "where": {
                    "and": [
                      [
                        "isToDo",
                        "=",
                        "true"
                      ]
                    ]
                  },
                  "size": "5",
                                     "sortBy": [
                     {
                       "field": "createdAt",
                       "order": "asc"
                     }
                   ]
                },
              
              "nodes": {
                "id": {},
                "name": {},
                "progress": {},
                // "isToDo": {},
                "createdAt": {},
                // "progress": {}
              }
            }
          }
        }
      }
    };

    const data = await fetchJobTread(jobsQuery);

    if (data?.organization?.jobs?.nodes) {
      // Deduplicate jobs by ID to prevent duplicate jobs in state
      const jobsArray = data.organization.jobs.nodes;
      const seenJobIds = new Set();
      const deduplicatedJobs = jobsArray.filter(job => {
        if (seenJobIds.has(job.id)) {
          console.warn(`Duplicate job found in API response: ${job.id}, removing duplicate`);
          return false;
        }
        seenJobIds.add(job.id);
        return true;
      });
      
      setJobs(deduplicatedJobs);
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
  if (jobDetails[jobId] || loadingJobDetails.has(jobId)) return;

  setLoadingJobDetails(prev => new Set(prev).add(jobId));

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
    } else {
      console.warn("Job details not found or invalid response for ID:", jobId);
      message.warn("Could not load details for this job.");
      setExpandedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  } catch (error) {
    console.error("Error loading job details:", error);
    message.error("Failed to load job details");
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  } finally {
    setLoadingJobDetails(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  }
}, [jobDetails, loadingJobDetails]);

// Toggle expanded job
const toggleExpandJob = useCallback((jobId) => {
  setExpandedJobIds(prev => {
    const newSet = new Set(prev);
    const isCurrentlyExpanded = newSet.has(jobId);

    if (isCurrentlyExpanded) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
      if (!jobDetails[jobId] && !loadingJobDetails.has(jobId)) {
        fetchJobDetails(jobId);
      }
    }
    return newSet;
  });
}, [fetchJobDetails, jobDetails, loadingJobDetails]);

// Organize jobs into columns by stage
useEffect(() => {
  if (stageOptions.length === 0 || jobs.length === 0) return;

  const newColumns = {};
  let unassignedJobs = [];

  // Check if filter has selections for this fieldId
  const hasFieldSelections = filterParams[fieldId] && filterParams[fieldId].length > 0;
  console.log("[JobKanbanPage] fieldName", fieldName);
  console.log("[JobKanbanPage] filterParams", filterParams);

  // Use selected options if available, otherwise use all stageOptions
  const displayOptions = hasFieldSelections ? filterParams[fieldId] : stageOptions;

  // Initialize columns with empty job arrays
  displayOptions.forEach(stage => {
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
      } else if (!hasFieldSelections && stage !== 'Not Set') {
        // For any stage not in our options (but only if we're showing all stages)
        // create a new column
        newColumns[stage] = [job];
      }
    }
  });

  // Add Unassigned column if there are unassigned jobs
  let finalColumns;
  if (unassignedJobs.length > 0) {
    // Reorder columns to have Unassigned first
    const orderedColumns = { "Unassigned": unassignedJobs };
    // Add all other columns
    Object.entries(newColumns).forEach(([key, value]) => {
      orderedColumns[key] = value;
    });
    finalColumns = orderedColumns;
  } else {
    finalColumns = newColumns;
  }

  // Apply deduplication safeguard before setting columns
  const deduplicatedFinalColumns = deduplicateColumns(finalColumns);
  setColumns(deduplicatedFinalColumns);
}, [stageOptions, jobs, fieldId, filterParams, deduplicateColumns]);

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

  // Store original state for rollback
  const originalColumns = { ...columns };

  try {
    // Find the job being moved
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const job = sourceColumn.find(job => job.id === draggableId);

    if (!job) {
      console.error(`Job ${draggableId} not found in source column ${source.droppableId}`);
      return;
    }

    // Create new columns with the job moved
    const newSourceColumn = [...sourceColumn];
    newSourceColumn.splice(source.index, 1);

    const newDestColumn = [...destColumn];
    newDestColumn.splice(destination.index, 0, job);

    // Apply optimistic update with deduplication safeguard
    const updatedColumns = {
      ...columns,
      [source.droppableId]: newSourceColumn,
      [destination.droppableId]: newDestColumn
    };

    // Ensure no duplicates exist across all columns
    const deduplicatedColumns = deduplicateColumns(updatedColumns);
    setColumns(deduplicatedColumns);

    // Update job stage in API
    await updateJobStage(draggableId, destination.droppableId);

    // If API update successful (didn't throw), apply final deduplication
    // Double-check for any duplicates after API success
    setColumns(prevColumns => deduplicateColumns(prevColumns));
    
    message.success(`Job moved to ${destination.droppableId}`);
  } catch (error) {
    console.error("Error in drag and drop:", error);
    // On error, rollback to original state
    setColumns(originalColumns);
    message.error("Failed to update job stage");
    
    // Refresh data to ensure consistency
    setTimeout(() => {
      fetchJobs();
    }, 500);
  }
};

// Update column colors when columns change
useEffect(() => {
  if (Object.keys(columns).length > 0) {
    setColumnColors(generateLaneColors(Object.keys(columns).length, Object.keys(columns)));
  }
}, [columns]);

// Function to handle adding a new task
const handleAddTask = useCallback(async (jobId, taskName) => {
  if (!taskName || !taskName.trim()) {
    message.warning("Task name cannot be empty.");
    return;
  }

  const trimmedTaskName = taskName.trim();
  message.loading({ content: 'Adding task...', key: `add-task-${jobId}` });

  try {
    const mutation = {
      "createTask": {
        "$": {
          "name": trimmedTaskName,
          "isToDo": true,
          "targetType": "job",
          "targetId": jobId
        },
        "createdTask": { 
           "id": {},
           "name": {},
           "isToDo": {},
           "progress": {}
        }
      }
    };

    const result = await updateJobTread(mutation);
    const createdTaskData = result?.createTask?.createdTask;

    if (createdTaskData) {
      message.success({ content: 'Task added successfully!', key: `add-task-${jobId}`, duration: 2 });
      setNewTaskInputs(prev => ({ ...prev, [jobId]: '' })); // Clear the input

      setJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job => {
          if (job.id === jobId) {
            const newTask = {
              id: createdTaskData.id,
              name: createdTaskData.name || trimmedTaskName,
              isToDo: createdTaskData.isToDo !== undefined ? createdTaskData.isToDo : true,
              progress: createdTaskData.progress !== undefined ? createdTaskData.progress : 0,
            };
            const existingNodes = Array.isArray(job.tasks?.nodes) ? job.tasks.nodes : [];
            const updatedTasksNodes = [...existingNodes, newTask];
            return {
              ...job,
              tasks: {
                ...job.tasks,
                nodes: updatedTasksNodes
              }
            };
          }
          return job;
        });
        
        // Ensure no duplicate jobs after update
        const seenJobIds = new Set();
        return updatedJobs.filter(job => {
          if (seenJobIds.has(job.id)) {
            console.warn(`Duplicate job found after task update: ${job.id}, removing duplicate`);
            return false;
          }
          seenJobIds.add(job.id);
          return true;
        });
      });
    } else {
      console.error("Failed to add task, unexpected response:", result);
      message.error({ content: 'Failed to add task. Unexpected response.', key: `add-task-${jobId}`, duration: 3 });
    }
  } catch (error) {
    console.error("Error adding task:", error);
    message.error({ content: `Error adding task: ${error.message}`, key: `add-task-${jobId}`, duration: 3 });
  }
}, [fetchJobs]);

// Generic function to handle updating an existing task (name or completion)
const handleUpdateTask = useCallback(async (jobId, taskId, updatePayload, originalName = null) => {
  // Ensure updateKey is declared only ONCE here
  const updateKey = Object.keys(updatePayload)[0]; 
  const newValue = updatePayload[updateKey];

  if (updateKey === 'name') {
    const trimmedValue = newValue.trim();
    if (!trimmedValue) {
      message.warning("Task name cannot be empty.");
      setEditingTask({ id: null, value: '' });
      return;
    }
    if (trimmedValue === originalName) {
       setEditingTask({ id: null, value: '' });
       return;
    }
    updatePayload.name = trimmedValue;
  }

  const actionText = updateKey === 'name' ? 'Updating task name...' : (newValue === 1 ? 'Marking task complete...' : 'Marking task incomplete...');
  message.loading({ content: actionText, key: `update-task-${taskId}` });

  try {
    const mutation = {
      "updateTask": {
        "$": {
          "id": taskId,
          ...updatePayload
        },
        "task": {
          "$": {"id": taskId},
           "id": {},
           "name": {},
           "progress": {},
           "completed": {}
        }
      }
    };

    const result = await updateJobTread(mutation);
    const updatedTaskData = result?.updateTask?.task;

    if (updatedTaskData) {
      message.success({ content: 'Task updated!', key: `update-task-${taskId}`, duration: 2 });
      if (updateKey === 'name') {
         setEditingTask({ id: null, value: '' });
      }

      setJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job => {
          if (job.id === jobId) {
            const updatedTasks = job.tasks.nodes.map(task => {
              if (task.id === taskId) {
                return { ...task, ...updatedTaskData };
              }
              return task;
            });
            return { ...job, tasks: { ...job.tasks, nodes: updatedTasks } };
          }
          return job;
        });
        
        // Ensure no duplicate jobs after update
        const seenJobIds = new Set();
        return updatedJobs.filter(job => {
          if (seenJobIds.has(job.id)) {
            console.warn(`Duplicate job found after task update: ${job.id}, removing duplicate`);
            return false;
          }
          seenJobIds.add(job.id);
          return true;
        });
      });
    } else {
      console.error("Failed to update task, unexpected response:", result);
      message.error({ content: 'Failed to update task.', key: `update-task-${taskId}`, duration: 3 });
      if (updateKey === 'name') {
         setEditingTask({ id: null, value: '' });
       }
    }
  } catch (error) {
    console.error("Error updating task:", error);
    message.error({ content: `Error updating task: ${error.message}`, key: `update-task-${taskId}`, duration: 3 });
     if (updateKey === 'name') {
       setEditingTask({ id: null, value: '' });
     }
  }
}, [fetchJobs]);

// Handler to update the specific input field state for new tasks
const handleNewTaskInputChange = (jobId, value) => {
  setNewTaskInputs(prev => ({
    ...prev,
    [jobId]: value
  }));
};

// Handler to update the state for the task being edited inline
const handleEditingTaskInputChange = (value) => {
  setEditingTask(prev => ({ ...prev, value }));
};

const defaultSelections = () => {
  if (fieldId === "22P7Rp2AWjYT") {
    return [{ fieldId: "22NwzQcjYUA4", defaults: [ "Design Proposal in Progress 📝",
            "Design Proposal Sent 📤","Design Sold 💲","In Planning & Design 🎨", "Design Approved by Client👍" ] },
          { fieldId: "22P7Rp2AWjYT", defaults: ["DEV. TEAM", "IN REVIEW/QC- PABLO"] },
          ];
  } else {
    return null;
  }
}

return (
  <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
    <ThemeSwitch />
    <Content style={{ padding: '20px', paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="ml-5" style={{ color: 'var(--foreground)' }}>{fieldName} Kanban Board</h1>

      </div>

      {!authLoading && (
        <JobStatusFilter
          onFiltersChange={handleFiltersChange}
          onFieldOptionsLoaded={handleFieldOptionsLoaded}
          customFieldId={fieldId}
          defaultSelections={defaultSelections()}
          hideFilterOptions={['22NwWybgjBTW']}
          skipStorageLoad={hasExtDesignRole}
        />
      )}

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
                            const currentNewTaskValue = newTaskInputs[job.id] || '';

                            // Get job info for display in the collapsed view
                            const estimator = job.customFieldValues.nodes.find(node =>
                              node.customField.name === "Estimator"
                            )?.value || 'Not Assigned';

                            const stage = job.customFieldValues.nodes.find(node =>
                              node.customField.name === "Stage"
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpandJob(job.id);
                                      }}
                                    >
                                      <JobCardTitle>{job.name}</JobCardTitle>
                                      <JobCardActions>
                                        <div
                                          {...provided.dragHandleProps}
                                          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <HolderOutlined />
                                        </div>
                                        {!hasExtDesignRole && (
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<ExportOutlined />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://app.jobtread.com/jobs/${job.id}`, '_blank');
                                            }}
                                          />
                                        )}
                                        <div
                                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 4px' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpandJob(job.id);
                                          }}
                                        >
                                          {loadingJobDetails.has(job.id) ? (
                                            <Spin size="small" />
                                          ) : isExpanded ? (
                                            <CaretDownOutlined />
                                          ) : (
                                            <CaretRightOutlined />
                                          )}
                                        </div>
                                      </JobCardActions>
                                    </JobCardHeader>

                                    <div style={{ marginBottom: isExpanded ? 12 : 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                      {stage} | {address}
                                    </div>

                                    {/* --- Task Section (Only when NOT expanded) --- */}
                                    {!isExpanded && (
                                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                        {/* Existing Tasks */}
                                        {job.tasks?.nodes && job.tasks.nodes.length > 0 && (
                                          <div style={{ marginBottom: '4px' }}>
                                            <strong>To-Do:</strong>
                                            <ul style={{ margin: '2px 0 0 0', padding: 0, listStyleType: 'none' }}>
                                              {job.tasks.nodes
                                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort by createdAt, oldest first (newest at bottom)
                                                .map(task => (
                                                <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px' /* Ensure consistent height */ }}>
                                                  <Checkbox
                                                     checked={!!task.progress} // Use progress status (0 = false, 1 = true)
                                                     onChange={(e) => {
                                                         e.stopPropagation();
                                                         // Pass job.id here
                                                         handleUpdateTask(job.id, task.id, { progress: e.target.checked ? 1 : 0 });
                                                     }}
                                                     style={{ transform: 'scale(0.8)' }}
                                                     onClick={(e) => e.stopPropagation()} // Prevent card header click
                                                   />
                                                  {editingTask.id === task.id ? (
                                                    // --- Editing Input ---
                                                    <Input
                                                      size="small"
                                                      value={editingTask.value}
                                                      onChange={(e) => handleEditingTaskInputChange(e.target.value)}
                                                      onBlur={() => handleUpdateTask(job.id, task.id, { name: editingTask.value }, task.name)}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          // Pass job.id here
                                                          handleUpdateTask(job.id, task.id, { name: editingTask.value }, task.name);
                                                        } else if (e.key === 'Escape') {
                                                          setEditingTask({ id: null, value: '' });
                                                        }
                                                      }}
                                                      autoFocus
                                                      style={{ flexGrow: 1, fontSize: '12px', border: 'none', padding: '0 2px', boxShadow: 'none', height: '20px', background: 'var(--input-background-hover)' }}
                                                      onClick={(e) => e.stopPropagation()} // Prevent card header click
                                                    />
                                                  ) : (
                                                    // --- Display Span ---
                                                    <span
                                                      style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer', flexGrow: 1, padding: '0 2px', lineHeight: '20px' /* Align with input */ }}
                                                      onClick={(e) => {
                                                          e.stopPropagation(); // Prevent card header click
                                                          setEditingTask({ id: task.id, value: task.name });
                                                      }}
                                                      title="Click to edit"
                                                    >
                                                      {task.name}
                                                    </span>
                                                  )}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Add New Task Input */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: job.tasks?.nodes?.length > 0 ? '4px' : '0' }}>
                                          <Checkbox checked={false} disabled style={{ transform: 'scale(0.8)', pointerEvents: 'none' }} />
                                          <Input
                                            size="small"
                                            placeholder="Add a task..."
                                            value={currentNewTaskValue}
                                            onChange={(e) => handleNewTaskInputChange(job.id, e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && currentNewTaskValue.trim()) {
                                                handleAddTask(job.id, currentNewTaskValue);
                                              }
                                            }}
                                            style={{ flexGrow: 1, fontSize: '12px' }}
                                             onClick={(e) => e.stopPropagation()} // Prevent card header click
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {/* --- End Task Section --- */}

                                    <JobCardContent isExpanded={isExpanded}>
                                      {isExpanded && loadingJobDetails.has(job.id) && (
                                        <div style={{ padding: '10px 0', textAlign: 'center' }}>
                                          <Spin size="small" /> Loading details...
                                        </div>
                                      )}

                                      {isExpanded && !loadingJobDetails.has(job.id) && hasDetails && (
                                        <JobTile
                                          job={{
                                            ...job,
                                            ...jobDetails[job.id]
                                          }}
                                          inlineStyle={true}
                                          hasExtDesignRole={hasExtDesignRole}
                                        />
                                      )}

                                      {isExpanded && !loadingJobDetails.has(job.id) && !hasDetails && (
                                        <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                          Could not load details.
                                        </div>
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
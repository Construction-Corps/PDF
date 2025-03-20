import React, { useEffect, useState, useCallback } from "react";
import { fetchJobTread } from "../../utils/JobTreadApi";
import { HTMLTooltip } from "../components/formatters/fields";
import JobStatusFilter from "../components/JobStatusFilter";
import JobTile from "../components/JobTile";
import { CaretRightOutlined, CaretDownOutlined, VerticalAlignMiddleOutlined, ArrowsAltOutlined   } from "@ant-design/icons";
import dayjs from 'dayjs';
import { Button, Tooltip } from 'antd';


// Helper for sorting tasks by startDate
function sortTasksByStartDate(tasks) {
    return tasks.slice().sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : Infinity;
        return aDate - bDate;
    });
}

export default function JobsChecklistPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskTypes, setTaskTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [jobDetails, setJobDetails] = useState({});
    const [nextPageToken, setNextPageToken] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isolatedJobId, setIsolatedJobId] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [lastSelectedTask, setLastSelectedTask] = useState(null);
    const [minimizedTasks, setMinimizedTasks] = useState(() => {
        // Try to load minimized tasks from localStorage
        try {
            const saved = localStorage.getItem('minimizedTasks');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    
    // Extract fetch jobs into a callback to avoid recreation on each render
    const fetchJobs = useCallback(async (statuses, pageToken = "", append = false) => {
        if (!statuses || statuses.length === 0) return;
        
        append ? setLoadingMore(true) : setLoading(true);
        try {
            // Example query to get all jobs & tasks
            const jobsQuery = {
                "organization": {
                    "id": {},
                    "jobs": {
                        "nextPage": {},
                        $:{
                            "page": pageToken,
                            "size": 10,
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
                                    ...(searchTerm ? [["name", "like", `%${searchTerm}%`]] : []),
                                    {
                                        "or": statuses.map(status => 
                                            [["cf", "values"], "=", status]
                                        )
                                    }
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
                                        "name": {}
                                    }
                                }
                            },
                            "tasks": {
                                "$": {
                                "size": 75
                                },    
                                "nodes": {
                                    "id": {},
                                    "description": {},
                                    "completed": {},
                                    "progress": {},
                                    "name": {},
                                    "endDate": {},
                                    "startDate": {},
                                    "createdAt": {},
                                    "taskType": {id:{}},
                                }
                            },
                        }
                    }
                }
            };
            
            const data = await fetchJobTread(jobsQuery);
            
            // data.allJobs.nodes should have the list of jobs
            if (data?.organization?.jobs?.nodes) {
                if (append) {
                    // Append new jobs to existing jobs
                    setJobs(prevJobs => [...prevJobs, ...data.organization.jobs.nodes]);
                } else {
                    // Replace jobs with new data
                    setJobs(data.organization.jobs.nodes);
                }
                                
                // Store the next page token for future requests
                setNextPageToken(data.organization.jobs.nextPage || "");
            }
        } catch (error) {
            console.error("Fetching jobs failed:", error);
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    }, [searchTerm]);


    const fetchTaskTypes = useCallback(async ( append = false) => {
        
        append ? setLoadingMore(true) : setLoading(true);
        try {
            // Example query to get all jobs & tasks
            const taskTypesQuery = {
                "organization": {
                    "id": {},
                    "taskTypes": {
                        $:{
                            "size": 100,
                        },
                        "nodes": {
                            "color": {},
                            "name": {},
                            "id": {}
                        }
                    }
                }
            };
            
            const data = await fetchJobTread(taskTypesQuery);
            
            // data.allJobs.nodes should have the list of jobs
            if (data?.organization?.taskTypes?.nodes) {
               
                
                setTaskTypes(data.organization.taskTypes.nodes);
                
                // Store the next page token for future requests
            }
        } catch (error) {
            console.error("Fetching Task Types failed:", error);
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    }, []);
    
    // Only run fetchJobs when selectedStatuses changes
    useEffect(() => {
        if (selectedStatuses.length > 0) {
            fetchTaskTypes(selectedStatuses, "");
            fetchJobs(selectedStatuses, "");
            setNextPageToken("");
            // Clear isolation when filters change
            setIsolatedJobId(null);
        }
    }, [selectedStatuses, searchTerm, fetchJobs]);
    
    // Handle status changes from the filter component
    const handleStatusChange = useCallback((newStatuses) => {
        setSelectedStatuses(newStatuses);
    }, []);
    
    // Handle search changes
    const handleSearchChange = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    }, []);
    
    // Function to handle job isolation
    const handleIsolateJob = (jobId) => {
        setIsolatedJobId(prevId => prevId === jobId ? null : jobId);
    };

    // Get filtered jobs based on isolation
    const filteredJobs = isolatedJobId 
        ? jobs.filter(job => job.id === isolatedJobId)
        : jobs;

    // Function to toggle progress 0 <-> 1
    const handleCheckboxChange = async (jobId, taskId, checked) => {
        try {
            // Immediately update UI (optimistic update)
            setJobs((prevJobs) =>
                prevJobs.map((job) => {
                    if (job.id !== jobId) return job;
                    return {
                        ...job,
                        tasks: {
                            ...job.tasks,
                            nodes: job.tasks.nodes.map((tk) =>
                                tk.id === taskId ? { ...tk, progress: checked ? 1 : 0 } : tk
                            ),
                        },
                    };
                })
            );
            
            // Send update to backend
            const query = {
                updateTask: {
                    $: {
                        id: taskId,
                        progress: checked ? 1 : 0,
                    },
                    task: {
                        $: { id: taskId },
                        id: {},
                        progress: {},
                        name: {},
                        startDate: {},
                    },
                },
            };
            const result = await fetchJobTread(query);
            
            // Optionally re-synchronize with the data returned
            if (result?.updateTask?.task) {
                const updatedTask = result.updateTask.task;
                setJobs((prevJobs) =>
                    prevJobs.map((job) => {
                        if (job.id !== jobId) return job;
                        return {
                            ...job,
                            tasks: {
                                ...job.tasks,
                                nodes: job.tasks.nodes.map((tk) =>
                                    tk.id === taskId ? { ...tk, ...updatedTask } : tk
                                ),
                            },
                        };
                    })
                );
            }
        } catch (error) {
            console.error("Error updating task progress:", error);
        }
    };

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
        }
    }, [jobDetails]);

    // Toggle expanded job
    const toggleExpandJob = (jobId) => {
        if (expandedJobId === jobId) {
            // Collapse if already expanded
            setExpandedJobId(null);
        } else {
            // Expand and fetch details if needed
            setExpandedJobId(jobId);
            fetchJobDetails(jobId);
        }
    };

    // Handle loading more data when user scrolls to bottom
    const loadMoreJobs = useCallback(() => {
        console.log("loadMoreJobs");
        if (nextPageToken && selectedStatuses.length > 0 && !loadingMore) {
            fetchJobs(selectedStatuses, nextPageToken, true);
        }
    }, [nextPageToken, selectedStatuses, loadingMore, fetchJobs]);

    // Add scroll event listener to detect when user reaches bottom of the page
    useEffect(() => {
        const handleScroll = () => {
            // Adding specific console logs to debug the scroll behavior
            console.log("=== SCROLL EVENT TRIGGERED ===");
            
            // Calculate values for scroll position detection
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight;
            const scrolledToBottom = windowHeight + scrollTop >= docHeight - 200;
            
            console.log({
                windowHeight,
                scrollTop,
                docHeight,
                scrolledToBottom
            });
            
            if (scrolledToBottom) {
                console.log("LOADING MORE JOBS!");
                loadMoreJobs();
            }
        };
        
        console.log("Adding scroll event listener");
        window.addEventListener('scroll', handleScroll);
        
        // Call once on mount to check if initial content doesn't fill the page
        setTimeout(() => {
            handleScroll();
        }, 1000);
        
        return () => {
            console.log("Removing scroll event listener");
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadMoreJobs]);

    // Handle task selection with Shift key and Ctrl key support
    const handleTaskSelect = (e, taskId, jobId) => {
        // If Ctrl key is pressed, toggle minimization for this specific task
        if (e.ctrlKey) {
            e.preventDefault(); // Prevent default browser Ctrl+click behavior
            
            // Toggle minimization state for this task
            setMinimizedTasks(prev => {
                const isCurrentlyMinimized = prev.some(t => 
                    t.taskId === taskId && t.jobId === jobId
                );
                
                let newMinimized;
                if (isCurrentlyMinimized) {
                    // Remove from minimized if already minimized
                    newMinimized = prev.filter(t => 
                        !(t.taskId === taskId && t.jobId === jobId)
                    );
                } else {
                    // Add to minimized if not minimized
                    newMinimized = [...prev, { taskId, jobId }];
                }
                
                // Save to localStorage
                localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
                return newMinimized;
            });
            
            return; // Exit early to prevent regular selection
        }
        
        // If shift key is pressed and we have a last selected task
        if (e.shiftKey && lastSelectedTask) {
            const allTasks = jobs.flatMap(job => 
                (job.tasks.nodes || []).map(task => ({ 
                    taskId: task.id, 
                    jobId: job.id 
                }))
            );
            
            // Find indices of current and last selected task
            const currentIndex = allTasks.findIndex(t => t.taskId === taskId && t.jobId === jobId);
            const lastIndex = allTasks.findIndex(t => 
                t.taskId === lastSelectedTask.taskId && t.jobId === lastSelectedTask.jobId
            );
            
            if (currentIndex !== -1 && lastIndex !== -1) {
                // Get range of tasks between last selected and current
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);
                const tasksInRange = allTasks.slice(start, end + 1);
                
                // Add all tasks in range to selection
                setSelectedTasks(prev => {
                    const newSelection = [...prev];
                    tasksInRange.forEach(t => {
                        // Only add if not already selected
                        if (!newSelection.some(st => st.taskId === t.taskId && st.jobId === t.jobId)) {
                            newSelection.push(t);
                        }
                    });
                    return newSelection;
                });
            }
        } else {
            // Toggle selection for individual task
            setSelectedTasks(prev => {
                const isSelected = prev.some(t => t.taskId === taskId && t.jobId === jobId);
                
                if (isSelected) {
                    return prev.filter(t => !(t.taskId === taskId && t.jobId === jobId));
                } else {
                    return [...prev, { taskId, jobId }];
                }
            });
        }
        
        // Update last selected task
        setLastSelectedTask({ taskId, jobId });
    };
    
    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for "-" key
            if (e.key === '-' && selectedTasks.length > 0) {
                // Minimize selected tasks
                setMinimizedTasks(prev => {
                    const newMinimized = [...prev];
                    selectedTasks.forEach(task => {
                        if (!newMinimized.some(t => t.taskId === task.taskId && t.jobId === task.jobId)) {
                            newMinimized.push(task);
                        }
                    });
                    
                    // Save to localStorage
                    localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
                    return newMinimized;
                });
                
                // Clear selection after minimizing
                setSelectedTasks([]);
            }
            
            // Check for "+" key to restore minimized tasks
            if (e.key === '+' && selectedTasks.length > 0) {
                // Restore minimized tasks
                setMinimizedTasks(prev => {
                    const newMinimized = prev.filter(t => 
                        !selectedTasks.some(st => st.taskId === t.taskId && st.jobId === t.jobId)
                    );
                    
                    // Save to localStorage
                    localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
                    return newMinimized;
                });
                
                // Clear selection after restoring
                setSelectedTasks([]);
            }
        };
        
        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Clean up
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedTasks]);
    
    // Check if a task is minimized
    const isTaskMinimized = (taskId, jobId) => {
        return minimizedTasks.some(t => t.taskId === taskId && t.jobId === jobId);
    };
    
    // Check if a task is selected
    const isTaskSelected = (taskId, jobId) => {
        return selectedTasks.some(t => t.taskId === taskId && t.jobId === jobId);
    };

    const handleExpandAllTasks = () => {
        // Clear all minimized tasks
        setMinimizedTasks([]);
        // Save to localStorage
        localStorage.setItem('minimizedTasks', JSON.stringify([]));
    };
    
    const handleMinimizeAllTasks = () => {
        // Collect all tasks from all jobs
        const allTasks = jobs.flatMap(job => 
            (job.tasks.nodes || []).map(task => ({ 
                taskId: task.id, 
                jobId: job.id 
            }))
        );
        
        // Set all tasks as minimized
        setMinimizedTasks(allTasks);
        // Save to localStorage
        localStorage.setItem('minimizedTasks', JSON.stringify(allTasks));
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Jobs Checklist</h2>
            
            <JobStatusFilter 
                onStatusChange={handleStatusChange} 
                onSearchChange={handleSearchChange}
            />
            
            {isolatedJobId && (
                <div style={{ 
                    margin: "10px 0", 
                    padding: "8px", 
                    background: "#f0f8ff", 
                    border: "1px solid #91d5ff",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span>Showing isolated job only</span>
                    <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => setIsolatedJobId(null)}
                    >
                        Show All Jobs
                    </Button>
                </div>
            )}
            
            
            <div style={{ 
                    margin: "10px 0", 
                    padding: "8px", 
                    background: "#f0f8ff", 
                    border: "1px solid #91d5ff",
                    borderRadius: "4px",
                    display: "flex",
                    position: "sticky",
                    top: "50px",
                    zIndex: 1000,
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
            {selectedTasks.length > 0 ? (
                <>
                    <span>{selectedTasks.length} tasks selected</span>
                    <div>
                        <Button 
                            type="primary" 
                            size="small" 
                            onClick={() => {
                                setMinimizedTasks(prev => {
                                    const newMinimized = [...prev];
                                    selectedTasks.forEach(task => {
                                        if (!newMinimized.some(t => t.taskId === task.taskId && t.jobId === task.jobId)) {
                                            newMinimized.push(task);
                                        }
                                    });
                                    
                                    localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
                                    return newMinimized;
                                });
                                setSelectedTasks([]);
                            }}
                            style={{ marginRight: "8px" }}
                        >
                            Minimize Selected (-)
                        </Button>
                        <Button 
                            size="small" 
                            onClick={() => {
                                setMinimizedTasks(prev => {
                                    const newMinimized = prev.filter(t => 
                                        !selectedTasks.some(st => st.taskId === t.taskId && st.jobId === t.jobId)
                                    );
                                    
                                    localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
                                    return newMinimized;
                                });
                                setSelectedTasks([]);
                            }}
                        >
                            Restore Selected (+)
                        </Button>
                        <Button 
                            style={{ marginLeft: "8px" }}
                            size="small" 
                            onClick={() => setSelectedTasks([])}
                        >
                            Deselect All
                        </Button>
                    </div>
                </>
            ): (
            < >
                <div>
                    {minimizedTasks.length > 0 ? 
                        `${minimizedTasks.length} tasks minimized` : 
                        "All tasks expanded"}
                </div>
                <Button 
                    type="primary" 
                    size="small" 
                    onClick={minimizedTasks.length > 0 ? handleExpandAllTasks : handleMinimizeAllTasks}
                >
                    {minimizedTasks.length > 0 ? "Expand All Tasks" : "Minimize All Tasks"}
                </Button>
            </>)}
            </div>
            
            {loading ? (
                <div>Loading Jobs...</div>
            ) : (
                <div style={{ width: "100%", overflowX: "auto" }}>
                    <div style={{ 
                        width: "max-content",
                        minWidth: "100%"
                    }}>
                        {/* Header row */}
                        <div style={{ 
                            display: "flex", 
                            borderBottom: "2px solid #f0f0f0",
                            fontWeight: "bold"
                        }}>
                            <div style={{ 
                                width: "250px",
                                padding: "8px",
                                position: "sticky",
                                left: 0,
                                backgroundColor: "white",
                                zIndex: 2,
                                boxShadow: "inset -1px 0 0 #777"
                            }}>
                                Job
                            </div>
                            {/* Task headers will be implicit */}
                        </div>
                        
                        {/* Job rows */}
                        {filteredJobs.map(job => {
                            const sortedTasks = sortTasksByStartDate(job.tasks.nodes || []);
                            const isExpanded = expandedJobId === job.id;
                            
                            // Get job info
                            const estimator = job.customFieldValues.nodes.find(node => 
                                node.customField.name === "Estimator"
                            )?.value || 'Not Assigned';
                            
                            const productionManager = job.customFieldValues.nodes.find(node => 
                                node.customField.name === "Production Manager"
                            )?.value || 'Not Assigned';
                            
                            const jobStatus = job.customFieldValues.nodes.find(node => 
                                node.customField.name === "Stage"
                            )?.value || 'Not Set';
                            
                            return (
                                <div key={job.id} style={{ 
                                    display: "flex",
                                    borderBottom: "1px solid #777"
                                }}>
                                    {/* Job cell */}
                                    <div style={{ 
                                        width: "250px",
                                        padding: "8px",
                                        position: "sticky",
                                        left: 0,
                                        backgroundColor: "white",
                                        zIndex: 2,
                                        boxShadow: "inset -1px 0 0 #777"
                                    }}>
                                        <div style={{ 
                                            display: "flex", 
                                            justifyContent: "space-between", 
                                            alignItems: "center",
                                            marginBottom: "5px"
                                        }}>


                                            <div style={{ fontWeight: "bold" }}>{job.name}</div>
                                                        <Tooltip
                                                            title={isolatedJobId === job.id ? "Show all jobs" : "Isolate this job"}
                                                            options={{
                                                            touch: ['hold', 500],
                                                            placement: 'top'
                                                        }}>   
                                                        <div 
                                                            onClick={() => handleIsolateJob(job.id)}
                                                            style={{
                                                                cursor: "pointer",
                                                                padding: "2px 5px",
                                                                borderRadius: "3px",
                                                                background: isolatedJobId === job.id ? "#1890ff" : "#f0f0f0",
                                                                color: isolatedJobId === job.id ? "white" : "#555"
                                                            }}
                                                            
                                                        >
                                                            {isolatedJobId === job.id ? 
                                                                <ArrowsAltOutlined />
                                                                :
                                                                <VerticalAlignMiddleOutlined />
                                                            }
                                                        </div>
                                                    </Tooltip>
                                                
                                        
                                        </div>
                                        <div><strong>Estimator:</strong> {estimator}</div>
                                        <div><strong>Production Manager:</strong> {productionManager}</div>
                                        
                                        <div style={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "space-between"
                                        }}>
                                            <div><strong>Status:</strong> {jobStatus}</div>
                                            <div 
                                                onClick={() => toggleExpandJob(job.id)} 
                                                style={{ 
                                                    cursor: "pointer", 
                                                    padding: "4px",
                                                    display: "flex",
                                                    alignItems: "center" 
                                                }}
                                            >
                                                {isExpanded ? 
                                                    <CaretDownOutlined /> : 
                                                    <CaretRightOutlined />
                                                }
                                            </div>
                                        </div>
                                        
                                        {isExpanded && jobDetails[job.id] && (
                                            <div style={{ marginTop: "10px" }}>
                                                <JobTile 
                                                    job={{
                                                        ...job,
                                                        ...jobDetails[job.id]
                                                    }} 
                                                    inlineStyle={true}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Task cells */}
                                    {sortedTasks.map(task => {
                                        const taskTypeInfo = taskTypes.find(tt => tt.id === task?.taskType?.id);
                                        const isMinimized = isTaskMinimized(task.id, job.id);
                                        const isSelected = isTaskSelected(task.id, job.id);
                                        
                                        return (
                                            <HTMLTooltip 
                                                key={task.id}
                                                html={`
                                                    <div style="text-align: left">
                                                        <strong>Name:</strong> ${task.name}<br>
                                                        <strong>Description:</strong> ${task.description || 'No description'}<br>
                                                        <strong>Start Date:</strong> ${dayjs(task.startDate).format('MM/DD/YYYY') || 'No start date'}<br>
                                                        <strong>End Date:</strong> ${dayjs(task.endDate).format('MM/DD/YYYY') || 'No end date'}
                                                    </div>
                                                `}
                                                options={{
                                                    touch: ['hold', 500], 
                                                    interactive: true,
                                                    delay: [1500, 100]
                                                }}
                                            >
                                                <div 
                                                    style={{ 
                                                        width: isMinimized ? "20px" : "150px",
                                                        padding: isMinimized ? "0" : "8px",
                                                        position: "relative",
                                                        cursor: "pointer",
                                                        backgroundColor: isSelected ? "rgba(24, 144, 255, 0.1)" : "transparent",
                                                        transition: "width 0.3s"
                                                    }}
                                                    onClick={(e) => handleTaskSelect(e, task.id, job.id)}
                                                >
                                                    {/* Color bar tooltip */}
                                                    <HTMLTooltip
                                                        html={`<div>${taskTypeInfo?.name || 'No Type'}</div>`}
                                                        options={{
                                                            touch: ['hold', 500],
                                                            placement: 'top'
                                                        }}
                                                    >
                                                        <div 
                                                            style={{
                                                                position: "absolute",
                                                                top: "0px",
                                                                left: "2px",
                                                                width: "6px",
                                                                height: "95%",
                                                                backgroundColor: taskTypeInfo?.color || '#444444',
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    </HTMLTooltip>
                                                    
                                                    {!isMinimized && (
                                                        <div style={{ 
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            marginLeft: '12px'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={task.progress === 1}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCheckboxChange(job.id, task.id, e.target.checked);
                                                                }}
                                                                style={{ 
                                                                    cursor: "pointer",
                                                                    width: "20px",
                                                                    height: "20px",
                                                                    marginRight: "8px"
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            
                                                            <div style={{ 
                                                                whiteSpace: "normal",
                                                                wordBreak: "break-word"
                                                            }}>
                                                                {task.name}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </HTMLTooltip>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Loading indicators */}
                    {loadingMore && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            Loading more jobs...
                        </div>
                    )}
                    
                    {/* Show "Load More" button as an alternative to scroll */}
                    {nextPageToken && !loadingMore && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <button 
                                onClick={loadMoreJobs}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#1890ff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchJobTread } from "../../utils/JobTreadApi";
import { HTMLTooltip } from "../components/formatters/fields";
import JobStatusFilter from "../components/JobStatusFilter";
import JobTile from "../components/JobTile";
import { CaretRightOutlined, CaretDownOutlined, VerticalAlignMiddleOutlined, ArrowsAltOutlined, LinkOutlined, ExportOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { Button, Tooltip } from 'antd';
import JobFieldEditors from '../components/JobFieldEditors';
import { useWindowSize } from '../components/useWindowSize';

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
    
    // Add state for field options
    const [fieldOptions, setFieldOptions] = useState({
        estimatorOptions: [],
        stageOptions: [],
        managerOptions: []
    });
    const [loadingFieldOptions, setLoadingFieldOptions] = useState(true);
    
    const [filterParams, setFilterParams] = useState({
        statuses: selectedStatuses,
        estimators: [],
        managers: [],
        search: searchTerm,
        sort: { field: "createdAt", order: "desc" }
    });
    
    const { isMobile } = useWindowSize();
    
    // Add a simple boolean state for horizontal scrolling
    const [isScrolledHorizontally, setIsScrolledHorizontally] = useState(false);
    
    // Add this to log whenever the state changes
    useEffect(() => {
        console.log("isScrolledHorizontally changed to:", isScrolledHorizontally);
    }, [isScrolledHorizontally]);

    // Add a state to track the count of jobs from last request
    const [lastRequestCount, setLastRequestCount] = useState(10);

    // Extract fetch jobs into a callback to avoid recreation on each render
    const fetchJobs = useCallback(async (statuses, pageToken = "", append = false) => {
        // if (!statuses || statuses.length === 0) return;
        
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
                            "sortBy": [
                                {
                                    "field": filterParams.sort.field,
                                    "order": filterParams.sort.order
                                }
                            ],
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
                                        "or": statuses.map(status => 
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
                                            [["cf", "values"], "=", manager]
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
            
            console.log("about to query");
            
            console.log("query", jobsQuery?.organization?.jobs?.$, "result", data?.organization?.jobs?.nodes);
            
            // data.allJobs.nodes should have the list of jobs
            if (data?.organization?.jobs?.nodes) {
                const newJobs = data.organization.jobs.nodes;
                
                // Track how many jobs we received in this request
                setLastRequestCount(newJobs.length);
                console.log(`Received ${newJobs.length} jobs in this request`);
                
                if (append) {
                    // Append new jobs to existing jobs
                    setJobs(prevJobs => [...prevJobs, ...newJobs]);
                } else {
                    // Replace jobs with new data
                    setJobs(newJobs);
                }
                
                // Store the next page token for future requests
                setNextPageToken(data.organization.jobs.nextPage || "");
            }
        } catch (error) {
            console.error("Fetching jobs failed:", error);
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    }, [filterParams]);


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
    
    // Only run fetchJobs when filters change
    useEffect(() => {
        // if (selectedStatuses.length > 0) {
            fetchTaskTypes(selectedStatuses, "");
            fetchJobs(selectedStatuses, "");
            setNextPageToken("");
            // Clear isolation when filters change
            setIsolatedJobId(null);
        // }
    }, [filterParams, fetchJobs]);
    
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

    // Modify loadMoreJobs to check the count from last request
    const loadMoreJobs = useCallback(() => {
        console.log("loadMoreJobs", { lastRequestCount, nextPageToken, loadingMore });
        
        // Only load more if we got a full page (10 items) in the last request
        // AND we have a nextPageToken AND we're not already loading
        if (lastRequestCount === 10 && nextPageToken && !loadingMore) {
            setLoadingMore(true);
            fetchJobs(selectedStatuses, nextPageToken, true);
        } else {
            console.log("Skipping load more - received less than 10 jobs in last request or no token");
        }
    }, [nextPageToken, selectedStatuses, loadingMore, fetchJobs, lastRequestCount]);

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
            // Create a visual mapping of tasks that matches the displayed order
            const visibleJobs = isolatedJobId 
                ? jobs.filter(job => job.id === isolatedJobId)
                : jobs;
            
            // Create ordered list that matches visual display (job by job, then tasks within each job)
            const visualOrderedTasks = [];
            visibleJobs.forEach(job => {
                const sortedTasks = sortTasksByStartDate(job.tasks.nodes || []);
                sortedTasks.forEach(task => {
                    visualOrderedTasks.push({
                        taskId: task.id,
                        jobId: job.id
                    });
                });
            });
            
            // Find indices in this visual order
            const currentIndex = visualOrderedTasks.findIndex(
                t => t.taskId === taskId && t.jobId === jobId
            );
            const lastIndex = visualOrderedTasks.findIndex(
                t => t.taskId === lastSelectedTask.taskId && t.jobId === lastSelectedTask.jobId
            );
            
            if (currentIndex !== -1 && lastIndex !== -1) {
                // Get range of tasks between last selected and current (inclusive)
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);
                
                // Select exactly the tasks in range (not one more, not one less)
                const tasksInRange = visualOrderedTasks.slice(start, end + 1);
                
                // Replace the entire selection with this range
                setSelectedTasks(tasksInRange);
            }
        } else {
            // For non-shift clicks, toggle selection and update last selected
            setSelectedTasks(prev => {
                const isSelected = prev.some(t => t.taskId === taskId && t.jobId === jobId);
                
                if (isSelected) {
                    return prev.filter(t => !(t.taskId === taskId && t.jobId === jobId));
                } else {
                    return [...prev, { taskId, jobId }];
                }
            });
            
            // Always update last selected task on regular click
            setLastSelectedTask({ taskId, jobId });
        }
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

    // Add new function to minimize all completed tasks
    const handleMinimizeCompletedTasks = () => {
        // Collect all completed tasks from all jobs
        const completedTasks = jobs.flatMap(job => 
            (job.tasks.nodes || [])
                .filter(task => task.progress === 1)
                .map(task => ({ 
                    taskId: task.id, 
                    jobId: job.id 
                }))
        );
        
        // Add completed tasks to minimized tasks (avoid duplicates)
        setMinimizedTasks(prev => {
            const newMinimized = [...prev];
            completedTasks.forEach(task => {
                if (!newMinimized.some(t => t.taskId === task.taskId && t.jobId === task.jobId)) {
                    newMinimized.push(task);
                }
            });
            
            // Save to localStorage
            localStorage.setItem('minimizedTasks', JSON.stringify(newMinimized));
            return newMinimized;
        });
    };

    // Handler for when field options are loaded
    const handleFieldOptionsLoaded = useCallback((options) => {
        setFieldOptions(options);
        setLoadingFieldOptions(false);
    }, []);

    // Handle combined filter changes
    const handleFiltersChange = useCallback((filters) => {
        setFilterParams(filters);
        setSelectedStatuses(filters.statuses);
        setSearchTerm(filters.search);
    }, []);

    return (
        <div style={{ padding: "20px", paddingTop: isMobile ? "50px" : "0px" }}>
            <h2>Jobs Checklist</h2>
            
            <JobStatusFilter 
                onStatusChange={handleStatusChange} 
                onSearchChange={handleSearchChange}
                onFieldOptionsLoaded={handleFieldOptionsLoaded}
                onFiltersChange={handleFiltersChange}
                extraButtons={
                    <div 
                    style={{ 
                        padding: "2px", 
                        paddingX: "8px",
                        background: "#f0f8ff", 
                        border: "1px solid #91d5ff",
                        borderRadius: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                    >
                {selectedTasks.length > 0 ? (
                    <>
                        {!isMobile && <span className="mr-2">{selectedTasks.length} tasks selected</span>}
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
                                className="mr-2"
                            >
                                {isMobile ? "-" : "Minimize Selected (-)"}
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
                                {isMobile ? "+" : "Restore Selected (+)"}
                            </Button>
                            <Button 
                                style={{ marginLeft: "8px" }}
                                size="small" 
                                onClick={() => setSelectedTasks([])}
                            >
                                {isMobile ? "✕" : "Deselect All"}
                            </Button>
                        </div>
                    </>
                ): (
                < >
                    {!isMobile && <div className="mr-2 text-black-all">
                        {minimizedTasks.length > 0 ? 
                            `${minimizedTasks.length} tasks minimized` : 
                            "All tasks expanded"}
                    </div>}
                    <div>
                        <Button 
                            type="primary" 
                            size="small" 
                            onClick={minimizedTasks.length > 0 ? handleExpandAllTasks : handleMinimizeAllTasks}
                            className="mr-2"
                        >
                            {isMobile ? 
                                (minimizedTasks.length > 0 ? "↕️" : "↓") : 
                                (minimizedTasks.length > 0 ? "Expand All Tasks" : "Minimize All Tasks")}
                        </Button>
                        <Button 
                            size="small" 
                            onClick={handleMinimizeCompletedTasks}
                        >
                            {isMobile ? "✓↓" : "Minimize Completed"}
                        </Button>
                    </div>
                </>)}
                </div>
                }
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
            
            
            
            
            {loading ? (
                <div>Loading Jobs...</div>
            ) : (
                <div 
                    className="job-list-container" 
                    style={{ 
                        width: "100%", 
                        overflowX: "auto",
                        // Add these to ensure proper scrolling behavior
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "thin"
                    }}
                    onScroll={(e) => {
                        // Add direct event handler in addition to listener
                        console.log("onScroll triggered, scrollLeft:", e.currentTarget.scrollLeft);
                        setIsScrolledHorizontally(e.currentTarget.scrollLeft > 0);
                    }}
                >
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
                            <div className="job-header">
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
                                    { isMobile && isScrolledHorizontally ?
                                
                                    <div className="job-cell-mobile">
                                        {job.name}
                                    </div>
                                    :
                                    <div className="job-cell">
                                        <div style={{ 
                                            display: "flex", 
                                            justifyContent: "space-between", 
                                            alignItems: "center",
                                            marginBottom: "5px"
                                        }}>
                                            <div style={{ fontWeight: "bold" }}>{job.name}</div>
                                            <div style={{ display: "flex" }}>
                                            <Tooltip
                                                    title="Open in JobTread"
                                                    options={{
                                                    touch: ['hold', 500],
                                                    placement: 'top'
                                                }}>   
                                                    <div 
                                                        onClick={() => window.open(`https://app.jobtread.com/jobs/${job.id}`, '_blank')}
                                                        style={{
                                                            cursor: "pointer",
                                                            padding: "2px 5px",
                                                            borderRadius: "3px",
                                                            // background: "#f0f0f0",
                                                            color: "#555",
                                                        }}
                                                    >
                                                        <ExportOutlined />
                                                    </div>
                                                </Tooltip>
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
                                                            background: isolatedJobId === job.id ? "#1890ff" : "transparent",
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
                                        </div>
                                        
                                        <JobFieldEditors 
                                            jobId={job.id}
                                            initialValues={{
                                                estimator: estimator,
                                                stage: jobStatus,
                                                manager: productionManager
                                            }}
                                            fieldOptions={fieldOptions}
                                            isLoadingOptions={loadingFieldOptions}
                                            onFieldUpdate={(updatedJob) => {
                                                // Handle the updated job data - refresh the job in the list
                                                setJobs(prevJobs => 
                                                    prevJobs.map(j => 
                                                        j.id === job.id ? {
                                                            ...j,
                                                            customFieldValues: {
                                                                ...j.customFieldValues,
                                                                nodes: updatedJob.customFieldValues.nodes
                                                            }
                                                        } : j
                                                    )
                                                );
                                            }}
                                        />
                                        
                                        <div style={{ 
                                            marginTop: "-10px",
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "flex-end"
                                        }}>
                                            <div 
                                                onClick={() => toggleExpandJob(job.id)} 
                                                style={{ 
                                                    cursor: "pointer", 
                                                    padding: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginTop: "-12px"
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
                                    }

                                    
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
                                                    delay: [750, 100]
                                                }}
                                            >
                                                <div 
                                                    style={{ 
                                                        width: isMinimized ? "20px" : "150px",
                                                        padding: isMinimized ? "0" : "8px",
                                                        position: "relative",
                                                        cursor: "pointer",
                                                        backgroundColor: task.progress === 1 ? (isSelected ? "rgba(15, 83, 148, 0.1)" : "rgba(82, 97, 103, 0.1)" ) : (isSelected ? "rgba(24, 144, 255, 0.1)" : "transparent"),
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
                                                                borderRadius: "3px",
                                                                height: "95%",
                                                                backgroundColor: task.progress === 1
                                                                ? `${taskTypeInfo?.color || '#555555'}80` // 50% opacity for completed tasks
                                                                : taskTypeInfo?.color || '#555555',
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    </HTMLTooltip>
                                                    
                                                    {!isMinimized && (
                                                        <div style={{ 
                                                            display: 'flex',
                                                            height: "100%",
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
                                                                className="mr-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            
                                                            <div style={{ 
                                                                whiteSpace: "normal",
                                                                wordBreak: "break-word",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                height: "100%"
                                                            }}>
                                                                {task.name}
                                                                <div className="mt-auto">
                                                                    <span className="text-muted">{dayjs(task.startDate).format('MM/DD')} - {dayjs(task.endDate).format('MM/DD')}</span>
                                                                </div>
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

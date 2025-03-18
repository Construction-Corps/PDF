import React, { useEffect, useState, useCallback } from "react";
import { fetchJobTread } from "../../utils/JobTreadApi";
import { HTMLTooltip } from "../components/formatters/fields";
import JobStatusFilter from "../components/JobStatusFilter";
import JobTile from "../components/JobTile";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';


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
    
    // Extract fetch jobs into a callback to avoid recreation on each render
    const fetchJobs = useCallback(async (statuses, pageToken = "", append = false) => {
        if (!statuses || statuses.length === 0) return;
        
        append ? setLoadingMore(true) : setLoading(true);
        try {
            // Example query to get all jobs & tasks
            const jobsQuery = {
                "organization": {
                    "id": {},
                    "taskTypes": {
                        "nodes": {
                            "color": {},
                            "name": {},
                            "id": {}
                        }
                    },
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
                                    {
                                        "or": statuses.map(status => 
                                            [["cf", "values"], "=", status]
                                        )
                                    }
                                ]
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
                
                setTaskTypes(data.organization.taskTypes.nodes);
                
                // Store the next page token for future requests
                setNextPageToken(data.organization.jobs.nextPage || "");
            }
        } catch (error) {
            console.error("Fetching jobs failed:", error);
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    }, []);
    
    // Only run fetchJobs when selectedStatuses changes
    useEffect(() => {
        if (selectedStatuses.length > 0) {
            fetchJobs(selectedStatuses, "");
            setNextPageToken("");
        }
    }, [selectedStatuses, fetchJobs]);
    
    // Handle status changes from the filter component
    const handleStatusChange = useCallback((newStatuses) => {
        setSelectedStatuses(newStatuses);
    }, []);
    
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

    return (
        <div style={{ padding: "20px" }}>
            <h2>Jobs Checklist</h2>
            
            <JobStatusFilter onStatusChange={handleStatusChange} />
            
            {loading ? (
                <div>Loading Jobs...</div>
            ) : (
                <div style={{ width: "100%" }}>
                    <div style={{ 
                        width: `${Math.max(1000, 250 + (jobs.reduce((max, job) => 
                            Math.max(max, (job.tasks.nodes || []).length), 0) * 150))}px`
                    }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginTop: "16px",
                                tableLayout: "fixed"
                            }}
                        >
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "2px solid #f0f0f0" }}>
                                    <th style={{ padding: "8px" }}>Job</th>
                                    {/* We will create columns dynamically per job, so no shared columns here */}
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => {
                                    // Sort tasks by earliest startDate
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
                                        <tr
                                            key={job.id}
                                            style={{ borderBottom: "1px solid #777", verticalAlign: "top" }}
                                        >
                                            {/* First cell: Simplified JobTile */}
                                            <td style={{ padding: "8px", width: "250px" }}>
                                                <div style={{ fontWeight: "bold" }}>{job.name}</div>
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
                                            </td>
                                            
                                            {/* Each subsequent cell: a task with a checkbox */}
                                            {sortedTasks.map((task) => {
                                                const taskTypeInfo = taskTypes.find(tt => tt.id === task?.taskType?.id);
                                                
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
                                                        }}
                                                    >
                                                        <td 
                                                            style={{ 
                                                                maxWidth: "100px", 
                                                                lineHeight: "1.2",
                                                                overflow: "hidden", 
                                                                wordWrap: "break-word",
                                                                padding: "8px", 
                                                                whiteSpace: "wrap",
                                                                position: "relative"
                                                            }}
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
                                                            
                                                            <div style={{ 
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                marginLeft: '12px'
                                                            }}>
                                                                {/* Checkbox in top left */}
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.progress === 1}
                                                                    onChange={(e) => handleCheckboxChange(job.id, task.id, e.target.checked)}
                                                                    style={{ 
                                                                        cursor: "pointer",
                                                                        width: "20px",
                                                                        height: "20px",
                                                                        marginRight: "8px"
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                
                                                                {/* Task name to the right of checkbox */}
                                                                <div>
                                                                    {task.name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </HTMLTooltip>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Show loading indicator at the bottom when fetching more jobs */}
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

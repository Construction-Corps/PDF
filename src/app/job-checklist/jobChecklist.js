import React, { useEffect, useState } from "react";
import { fetchJobTread } from "../../utils/JobTreadApi";
import { HTMLTooltip } from "../components/formatters/fields";

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
    
    // 1. Fetch the full list of jobs with tasks
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
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
                                "size": 20,
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
                                "createdAt": {},
                                "customFieldValues": {
                                    "nodes": {
                                        "value": {},
                                        "customField": {
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
                    setJobs(data.organization.jobs.nodes);
                    setTaskTypes(data.organization.taskTypes.nodes);
                }
            } catch (error) {
                console.error("Fetching jobs failed:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchJobs();
    }, []);
    
    // 2. Function to toggle progress 0 <-> 1
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

if (loading) return <div>Loading Jobs...</div>;

return (
    <div style={{ padding: "20px", WebkitOverflowScrolling: "touch" }}>
    <h2>Jobs Checklist</h2>
    <table
    style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "16px",
        touchAction: "pan-x pan-y"
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

        const jobStage = job.customFieldValues.nodes.find(node => 
            node.customField.name === "Stage"
        )?.value || 'Not Set';
        
        // 3. Sort tasks by earliest startDate
        const sortedTasks = sortTasksByStartDate(job.tasks.nodes || []);
        
        return (
            <tr
            key={job.id}
            style={{ borderBottom: "1px solid #777", verticalAlign: "top" }}
            >
                
            {/* First cell: job name, stage, and earliest task */}
            <td style={{ padding: "8px", width: "250px" }}>
                <div style={{ fontWeight: "bold" }}>{job.name}</div>
                <div><strong>Stage: </strong>{jobStage}</div>
                <div style={{ fontSize: "0.9rem", color: "#777" }}>
                    Job Start: 
                    {sortedTasks.length > 0 && sortedTasks[0].startDate
                        ? new Date(sortedTasks[0].startDate).toLocaleDateString()
                        : 'Not set'
                    }
                </div>
                <div style={{ fontSize: "0.9rem", color: "#777" }}>
                    Created: {job.createdAt
                        ? new Date(job.createdAt).toLocaleDateString()
                        : "N/A"
                    }
                </div>
            </td>
                
                {/* 4. Each subsequent cell: a task with a checkbox */}
                {sortedTasks.map((task) => {
                    const taskTypeInfo = taskTypes.find(tt => tt.id === task?.taskType?.id);
                    console.log('Task Type Info:', {
                        taskTypeId: task?.taskType?.id,
                        foundInfo: taskTypeInfo,
                        color: taskTypeInfo?.color
                    });
                    
                    return (
                        <HTMLTooltip 
                            html={`
                                <div style="text-align: left">
                                    <strong>Name:</strong> ${task.name}<br>
                                    <strong>Description:</strong> ${task.description || 'No description'}
                                </div>
                            `}
                            options={{
                                touch: ['hold', 500], // Show on 500ms hold for touch devices
                                interactive: true,    // Allow interaction with tooltip content
                            }}
                        >
                            <td 
                                key={task.id} 
                                style={{ 
                                    maxWidth: "100px", 
                                    lineHeight: "1.2",
                                    overflow: "hidden", 
                                    wordWrap: "break-word",
                                    padding: "8px", 
                                    whiteSpace: "wrap",
                                    position: "relative" // For absolute positioning
                                }}
                            >
                                {/* Color bar tooltip */}
                                <HTMLTooltip
                                    html={`<div>${taskTypeInfo?.name||'No Type'}</div>`}
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
                                    marginLeft: '12px' // Space for color bar
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
    );
}

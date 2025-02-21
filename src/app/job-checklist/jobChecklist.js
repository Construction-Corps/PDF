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
    
    // 1. Fetch the full list of jobs with tasks
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                // Example query to get all jobs & tasks
                const jobsQuery = {
                    "organization": {
                        "id": {},
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
    <div style={{ padding: "20px" }}>
    <h2>Jobs Checklist</h2>
    <table
    style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "16px",
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
            style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}
            >
            {/* First cell: job name and creation date */}
            <td style={{ padding: "8px", width: "250px" }}>
            <div style={{ fontWeight: "bold" }}>{job.name}</div>
            <div > <strong>Stage: </strong>{jobStage}</div>
            <div style={{ fontSize: "0.9rem", color: "#888" }}>
            Created:{" "}
            {job.createdAt
                ? new Date(job.createdAt).toLocaleDateString()
                : "N/A"}
                </div>
                </td>
                
                {/* 4. Each subsequent cell: a task with a checkbox */}
                {sortedTasks.map((task) => (
                    <HTMLTooltip 
                        html={`
                            <div style="text-align: left">
                                <strong>Name:</strong> ${task.name}<br>
                                <strong>Description:</strong> ${task.description || 'No description'}
                            </div>
                        `}
                    >
                        <td 
                            key={task.id} 
                            style={{ maxWidth: "100px", overflow: "hidden", padding: "8px", whiteSpace: "nowrap" }}
                        >
                            <label style={{ cursor: "pointer" }}>
                                <div>   
                                    <input
                                        type="checkbox"
                                        checked={task.progress === 1}
                                        onChange={(e) =>
                                            handleCheckboxChange(job.id, task.id, e.target.checked)
                                        }
                                        style={{ marginRight: "6px" }}
                                    />
                                </div>
                                {task.name}
                            </label>
                        </td>
                    </HTMLTooltip>
                ))}
                </tr>
            );
        })}
        </tbody>
        </table>
        </div>
    );
}

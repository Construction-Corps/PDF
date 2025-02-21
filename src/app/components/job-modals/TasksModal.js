import { Card, Modal, Slider, DatePicker } from 'antd';
import { CheckCircleOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import React, { useEffect, useState, useCallback } from 'react';
import { fetchJobTread } from '../../../utils/JobTreadApi';
import dayjs from 'dayjs';

// Create the debounced function outside the component
const debouncedFetchUpdate = debounce(async (query, callback) => {
    const data = await fetchJobTread(query);
    callback(data);
}, 500);

const TasksModal = ({ jobId, open, onClose, job }) => {
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState(job.tasks.nodes);   
    const [expandedTasks, setExpandedTasks] = useState({});
    
    const handleTaskUpdate = async (taskId, updates) => {
        try {
            // Update UI immediately
            setTasks(prevTasks => {
                const newTasks = prevTasks.map(task => 
                    task.id === taskId ? { ...task, ...updates } : task
                );
                
                // Get the updated task
                const updatedTask = newTasks.find(task => task.id === taskId);
                
                const query = {
                    "updateTask": {
                        "$": {
                            "id": taskId,
                            ...updates
                        },
                        task: {
                            $: { id: taskId },
                            "id": {},   
                            "description": {},
                            "completed": {},
                            "progress": {},
                            "name": {},
                            "endDate": {},
                            "startDate": {},
                            "taskType": {},
                            "createdAt": {},
                        }
                    }
                };
                
                debouncedFetchUpdate(query, (data) => {
                    setTasks(currentTasks => 
                        currentTasks.map(task => 
                            task.id === taskId ? { ...task, ...data.updateTask.task } : task
                        )
                    );
                });
                
                return newTasks;
            });
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };
    
    const toggleTask = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    return (
        <Modal
        title="Tasks"
        open={open}
        onCancel={onClose}
        footer={null}
        >
        {loading ? (
            <div>Loading...</div>
        ) : (
            <div className="tasks-list">
            {tasks?.map(task => (
                <Card 
                    key={task.id} 
                    className={`task ${expandedTasks[task.id] ? 'expanded' : 'collapsed'}`}
                    bodyStyle={{ padding: expandedTasks[task.id] ? '16px' : '8px' }}
                >
                    <div className="task-header d-flex align-items-center">
                        <input
                            type="checkbox"
                            checked={task.progress === 1}
                            onChange={(e) => {
                                handleTaskUpdate(task.id, { 
                                    progress: e.target.checked ? 1 : 0 
                                });
                            }}
                            className="mr-3"
                        />
                        <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                handleTaskUpdate(task.id, { 
                                    name: e.target.innerText 
                                });
                            }}
                            className="task-name flex-grow-1 font-bold"
                        >
                            {task.name}
                        </span>
                        <span className="task-status float-right">
                            {task.progress === 1 ? (
                                <>
                                    <i className="fa fa-check"/> Completed
                                </>
                            ) : `${Math.round(task.progress * 100)}%`}
                        </span>
                        <span 
                            className="task-expand-icon" 
                            onClick={() => toggleTask(task.id)}
                        >
                            {expandedTasks[task.id] ? <DownOutlined /> : <RightOutlined />}
                        </span>
                    </div>
                    
                    {expandedTasks[task.id] && (
                        <div className="task-details mt-3">
                            <div className="task-progress mb-3">
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={task.progress}
                                    onChange={(value) => {
                                        handleTaskUpdate(task.id, { 
                                            progress: value 
                                        });
                                    }}
                                    tooltip={{
                                        formatter: (value) => `${Math.round(value * 100)}%`
                                    }}
                                />
                            </div>
                            
                            <div 
                                className="task-description mb-3"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    handleTaskUpdate(task.id, { 
                                        description: e.target.innerText 
                                    });
                                }}
                            >
                                {task.description}
                            </div>
                            
                            <div className="task-dates">
                                <DatePicker.RangePicker
                                    value={[
                                        task.startDate ? dayjs(task.startDate) : null,
                                        task.endDate ? dayjs(task.endDate) : null
                                    ]}
                                    onChange={(dates) => {
                                        const [start, end] = dates || [null, null];
                                        handleTaskUpdate(task.id, {
                                            startDate: start ? start.format('YYYY-MM-DD') : null,
                                            endDate: end ? end.format('YYYY-MM-DD') : null
                                        });
                                    }}
                                    format="YYYY-MM-DD"
                                    allowClear
                                    className="w-100"
                                />
                            </div>
                        </div>
                    )}
                </Card>  
            ))}
            </div>
        )}
        </Modal>
    );
};



export default TasksModal;

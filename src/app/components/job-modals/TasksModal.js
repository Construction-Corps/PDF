import { Card, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../../utils/JobTreadApi';

const TasksModal = ({ jobId, open, onClose, job }) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(job.tasks.nodes);   

//   console.log({job}, {tasks}, job.tasks);

//   useEffect(() => {
//     if (open) {
//       loadTasks();
//     }
//   }, [open, jobId]);

//   const loadTasks = async () => {
//     setLoading(true);
//     try {
//       const query = {
//         "job": {
//           "$": { "id": jobId },
//           "id": {},
//           "tasks": {
//             "nodes": {
//               "id": {},
//               "description": {},
//               "completed": {},
//               "name": {},
//               "endDate": {},
//               "baselineEndDate": {}
//             }
//           }
//         }
//       };

//       const response = await fetchJobTread(query);
//       setTasks(response.job.tasks.nodes);
//     } catch (error) {
//       console.error("Error loading tasks:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  const handleTaskComplete = async (taskId, completed) => {
    try {
      const query = {
        "updateTask": {
          "$": {
            "id": taskId,
            "completed": completed
          }
        }
      };
      
      await fetchJobTread(query);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
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
            <Card key={task.id} className="task">
              <div className="task-header">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
                  className="mr-2"
                />
                <strong className="mr-2">{task?.name}</strong>
                <span className="mr-2">{task.completed ? '✓ Completed' : 'Pending'}</span>
              </div>
              <div className="task-description">{task.description}</div>
              <div className="task-dates">
                {task.endDate && (
                  <div>Due: {new Date(task.endDate).toLocaleDateString()}</div>
                )}
                {task.baselineEndDate && (
                  <div>Baseline: {new Date(task.baselineEndDate).toLocaleDateString()}</div>
                )}
              </div>
            </Card>  
          ))}
        </div>
      )}
    </Modal>
  );
};

export default TasksModal;

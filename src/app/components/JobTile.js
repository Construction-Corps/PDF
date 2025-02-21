import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../utils/JobTreadApi';
import ActivityModal from './job-modals/ActivityModal';
import DailyLogsModal from './job-modals/DailyLogsModal';
import TasksModal from './job-modals/TasksModal';
import DocumentsModal from './job-modals/DocumentsModal';

const JobTile = ({ job }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  
  useEffect(() => {
    const loadJobDetails = async () => {
      const detailsQuery = {
        "job": {
          "$": {
            "id": job.id
          },
          "id": {},
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
              "name": {},
              "endDate": {},
              "baselineEndDate": {}
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
      
      try {
        const response = await fetchJobTread(detailsQuery);
        setJobDetails(response.job);
      } catch (error) {
        console.error("Error loading job details:", error);
      }
    };
    
    loadJobDetails();
  }, [job.id]);
  
  const estimator = job.customFieldValues.nodes.find(node => 
    node.customField.name === "Estimator"
  )?.value || 'Not Assigned';
  
  const productionManager = job.customFieldValues.nodes.find(node => 
    node.customField.name === "Production Manager"
  )?.value || 'Not Assigned';
  
  const jobStatus = job.customFieldValues.nodes.find(node => 
    node.customField.name === "Stage"
  )?.value || 'Not Set';
  
  const address = `${job.location.street}, ${job.location.city}, ${job.location.state} ${job.location.postalCode}`;

  const latestComment = jobDetails?.comments?.nodes[0];
  
  return (
    <div className="job-tile">
      <strong>{job.name}</strong>
      <div className="job-details">
        <div><strong>Estimator:</strong> {estimator}</div>
        <div><strong>Production Manager:</strong> {productionManager}</div>
        <div><strong>Status:</strong> {jobStatus}</div>
        <div className="address">{address}</div>
        
        <div className="modal-buttons">
          <Button onClick={() => setActiveModal('activity')}>Activity</Button>
          <Button onClick={() => setActiveModal('dlogs')}>D-Logs</Button>
          <Button onClick={() => setActiveModal('tasks')}>Tasks</Button>
          <Button onClick={() => setActiveModal('docs')}>Docs</Button>
        </div>
        
        {activeModal === 'activity' && <ActivityModal 
          job={jobDetails}
          jobId={job.id}
          open={activeModal === 'activity'}
          onClose={() => setActiveModal(null)}
        />}
        {activeModal === 'dlogs' && <DailyLogsModal 
          job={jobDetails}
          jobId={job.id}
          open={activeModal === 'dlogs'}
          onClose={() => setActiveModal(null)}
        />}
        {activeModal === 'tasks' && <TasksModal 
          job={jobDetails}
          jobId={job.id}
          open={activeModal === 'tasks'}
          onClose={() => setActiveModal(null)}
        />}
        {activeModal === 'docs' && <DocumentsModal   
          job={jobDetails}
          jobId={job.id}
          open={activeModal === 'docs'}
          onClose={() => setActiveModal(null)}
        />}
            
        {jobDetails && latestComment && (
          <div className="extended-details">
            <div className="comments">
              <strong>Latest activity:</strong> 
              <div><strong>Date: </strong>{new Date(latestComment.createdAt).toLocaleDateString()}</div>
              <div><strong>By: </strong>{latestComment.createdByUser?.name || 'Unknown'}</div>
              <div>{latestComment.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTile;

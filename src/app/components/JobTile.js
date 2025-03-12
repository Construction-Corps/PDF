import { Button, Input } from 'antd';
import { debounce } from 'lodash';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../utils/JobTreadApi';
import ActivityModal from './job-modals/ActivityModal';
import DailyLogsModal from './job-modals/DailyLogsModal';
import TasksModal from './job-modals/TasksModal';
import DocumentsModal from './job-modals/DocumentsModal';

const debouncedAddComment = debounce(async (jobId, comment) => {
  try {
    const query = {
      "createComment": {
        "$": {
          "targetId": jobId,
          "message": comment,
          "targetType": "job"
        },
        "createdComment": {
          "id": {},
          "message": {},
          "name": {},
          "createdAt": {},
          "createdByUser": {
            "name": {}
          }
        }
      }
    };
    
    return await fetchJobTread(query);
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}, 500);

const JobTile = ({ job, inlineStyle = false }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
    const loadJobDetails = async () => {
      const detailsQuery = {
        "job": {
          "$": {
            "id": job.id
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
      
      try {
        const response = await fetchJobTread(detailsQuery);
        setJobDetails(response.job);
      } catch (error) {
        console.error("Error loading job details:", error);
      }
    };
    
    if (!job.comments && !inlineStyle) {
      loadJobDetails();
    } else {
      setJobDetails(job);
    }
  }, [job.id, job.comments, inlineStyle]);
  
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
    <div className={inlineStyle ? "" : "job-tile"}>
      {!inlineStyle && <strong>{job.name}</strong>}
      <div className={inlineStyle ? "" : "job-details"}>
        {!inlineStyle && (
          <>
            <div><strong>Estimator:</strong> {estimator}</div>
            <div><strong>Production Manager:</strong> {productionManager}</div>
            <div><strong>Status:</strong> {jobStatus}</div>
            <div className="address">{address}</div>
          </>
        )}
        
        {/* {!inlineStyle && ( */}
          <div className="modal-buttons">
            <Button onClick={() => setActiveModal('activity')}>Activity</Button>
            <Button onClick={() => setActiveModal('dlogs')}>D-Logs</Button>
            <Button onClick={() => setActiveModal('tasks')}>Tasks</Button>
            <Button onClick={() => setActiveModal('docs')}>Docs</Button>
          </div>
        {/* )} */}
        
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
                  <div className={inlineStyle ? "" : "extended-details"}>
                    <div className={inlineStyle ? "" : "comments"}>
                      <strong>Latest activity:</strong> 
                      <div><strong>Date: </strong>{new Date(latestComment.createdAt).toLocaleDateString()}</div>
                      <div><strong>By: </strong>{latestComment.createdByUser?.name || 'Unknown'}</div>
                      {latestComment.name && <div><strong>Name: </strong>{latestComment.name}</div>}
                      <div><strong>Message: </strong>{latestComment.message}</div>
                    </div>
                    
                    {/* {!inlineStyle && ( */}
                      <div className="comment-input-section">
                        <Input.TextArea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          className="comment-textarea"
                        />
                        <Button 
                          type="primary"
                          onClick={async () => {
                            if (newComment.trim()) {
                              const data = await debouncedAddComment(job.id, newComment.trim());
                              if (data?.createComment?.createdComment) {
                                console.log({data});
                                // Update the latest comment in jobDetails
                                setJobDetails(prev => ({
                                  ...prev,
                                  comments: {
                                    nodes: [data.createComment.createdComment, ...(prev.comments?.nodes || [])]
                                  }
                                }));
                                setNewComment('');
                              }
                            }
                          }}
                          className="comment-submit-btn btn-sm"
                        >
                          Add Comment
                        </Button>
                      </div>
                    {/* )} */}
                  </div>
                )}
      </div>
    </div>
  );
};

export default JobTile;

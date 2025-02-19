import React from 'react';

const JobTile = ({ job }) => {
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

  return (
    <div className="job-tile">
      <strong>{job.name}</strong>
      <div className="job-details">
        <div><strong>Estimator:</strong> {estimator}</div>
        <div><strong>Production Manager:</strong> {productionManager}</div>
        <div><strong>Status:</strong> {jobStatus}</div>
        <div className="address">{address}</div>
      </div>
    </div>
  );
};

export default JobTile;

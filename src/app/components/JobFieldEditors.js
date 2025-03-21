import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { fetchJobTread } from '@/utils/JobTreadApi';

const { Option } = Select;

const JobFieldEditors = ({ 
  jobId, 
  initialValues = {}, 
  onFieldUpdate,
  fieldOptions = {
    estimatorOptions: [],
    stageOptions: [],
    managerOptions: []
  },
  isLoadingOptions = false
}) => {
  // Custom field IDs
  const ESTIMATOR_FIELD_ID = "22NwWybgjBTW";
  const STAGE_FIELD_ID = "22NwzQcjYUA4";
  const MANAGER_FIELD_ID = "22P2ZNybRiyG";
  
  // Using provided options instead of fetching
  const { estimatorOptions, stageOptions, managerOptions } = fieldOptions;
  
  // Selected values
  const [estimator, setEstimator] = useState(initialValues.estimator || null);
  const [stage, setStage] = useState(initialValues.stage || null);
  const [manager, setManager] = useState(initialValues.manager || null);
  
  // Set initial values when they change
  useEffect(() => {
    setEstimator(initialValues.estimator || null);
    setStage(initialValues.stage || null);
    setManager(initialValues.manager || null);
  }, [initialValues]);
  
  // Update a field value
  const updateJobField = async (fieldId, value) => {
    if (!jobId) return;
    
    try {
      const query = {
        "updateJob": {
          "$": {
            "id": jobId,
            "customFieldValues": {
              [fieldId]: value
            }
          },
          "job": {
            "$": { "id": jobId,
                size:100
             },
            "id": {},
            "customFieldValues": {
              "nodes": {
                "customField": {
                  "id": {},
                  "name": {}
                },
                "value": {}
              }
            }
          }
        }
      };
      
      const result = await fetchJobTread(query);
      
      if (result?.updateJob?.job) {
        onFieldUpdate && onFieldUpdate(result.updateJob.job);
      }
    } catch (error) {
      console.error(`Error updating field ${fieldId}:`, error);
    }
  };
  
  // Handle change events
  const handleEstimatorChange = value => {
    setEstimator(value);
    updateJobField(ESTIMATOR_FIELD_ID, value);
  };
  
  const handleStageChange = value => {
    setStage(value);
    updateJobField(STAGE_FIELD_ID, value);
  };
  
  const handleManagerChange = value => {
    setManager(value);
    updateJobField(MANAGER_FIELD_ID, value);
  };
  
  // Render field editors
  return (
    <div>
      <div style={{ marginBottom: "5px" }}>
        <strong>Estimator:</strong>{" "}
        <Select 
          value={estimator}
          onChange={handleEstimatorChange}
          style={{ width: 120 }}
          loading={isLoadingOptions}
          size="small"
        >
          {estimatorOptions.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </div>
      
      <div style={{ marginBottom: "5px" }}>
        <strong>PM:</strong>{" "}
        <Select 
          value={manager}
          onChange={handleManagerChange}
          style={{ width: 120 }}
          loading={isLoadingOptions}
          size="small"
        >
          {managerOptions.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </div>
      
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between"
      }}>
        <div>
          <strong>Stage:</strong>{" "}
          <Select 
            value={stage}
            onChange={handleStageChange}
            style={{ width: 120 }}
            loading={isLoadingOptions}
            size="small"
          >
            {stageOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default JobFieldEditors; 
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Dropdown, Checkbox, Button, Input, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchJobTread } from '@/utils/JobTreadApi';

const FilterContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 100px;
  z-index: 10;
  display: flex;
  gap: 10px;
`;

const FilterButton = styled(Button)`
  background: white;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
`;

const FilterMenu = styled.div`
  background: white;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  padding: 8px;
  width: 250px;
  max-height: 400px;
  overflow-y: auto;
`;

const FilterOption = styled.div`
  padding: 6px 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const SearchInput = styled(Input)`
  width: 200px;
  border-radius: 4px;
`;

// Default selections that match current JobChecklist
const DEFAULT_SELECTIONS = [
  "Job Started 🔨",
  "Job Mid Way ⚒️", 
  "Job Complete ✅", 
  "Pre-Production 🗓️", 
  "Awaiting Payment ⏲️"
];

// Field IDs
const ESTIMATOR_FIELD_ID = "22NwWybgjBTW";
const STAGE_FIELD_ID = "22NwzQcjYUA4";
const MANAGER_FIELD_ID = "22P2ZNybRiyG";

// localStorage keys for different filter selections
const STORAGE_KEY = 'jobStatusFilterSelections';
const ESTIMATOR_STORAGE_KEY = 'jobEstimatorFilterSelections';
const MANAGER_STORAGE_KEY = 'jobManagerFilterSelections';
const SEARCH_KEY = 'jobStatusFilterSearch';

const JobStatusFilter = ({ 
  onStatusChange, 
  onSearchChange, 
  onFieldOptionsLoaded,
  initialSelections = null, 
  extraButtons = null 
}) => {
  // State for all available options
  const [allStatuses, setAllStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for all options
  const [fieldOptions, setFieldOptions] = useState({
    estimatorOptions: [],
    stageOptions: [],
    managerOptions: []
  });
  
  // Initialize status selections from localStorage or defaults
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return initialSelections || DEFAULT_SELECTIONS;
  });
  
  // Initialize estimator selections
  const [selectedEstimators, setSelectedEstimators] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ESTIMATOR_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return [];
  });
  
  // Initialize manager selections
  const [selectedManagers, setSelectedManagers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MANAGER_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return [];
  });
  
  // Initialize search term from localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(SEARCH_KEY) || "";
      } catch (e) {
        console.error('Error reading search from localStorage', e);
      }
    }
    return "";
  });
  
  const [open, setOpen] = useState(false);
  
  // Fetch all field options in one call
  const fetchAllFieldOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query to get all custom fields options
      const query = {
        "organization": {
          "$": {
            "id": "22NwWhUAf6VB"
          },
          "id": {},
          "customFields": {
            "nodes": {
              "id": {},
              "name": {},
              "options": {}
            },
            "$": {
              "where": {
                "or": [
                  ["id", "=", ESTIMATOR_FIELD_ID],
                  ["id", "=", STAGE_FIELD_ID],
                  ["id", "=", MANAGER_FIELD_ID]
                ]
              }
            }
          }
        }
      };
      
      const data = await fetchJobTread(query);
      
      if (data?.organization?.customFields?.nodes) {
        const fields = data.organization.customFields.nodes;
        
        // Collect all field options
        const estimatorField = fields.find(f => f.id === ESTIMATOR_FIELD_ID);
        const stageField = fields.find(f => f.id === STAGE_FIELD_ID);
        const managerField = fields.find(f => f.id === MANAGER_FIELD_ID);
        
        const options = {
          estimatorOptions: estimatorField?.options || [],
          stageOptions: stageField?.options || [],
          managerOptions: managerField?.options || []
        };
        
        setFieldOptions(options);
        
        // Set status options (for the filter)
        if (stageField?.options) {
          setAllStatuses(stageField.options);
        }
        
        // Pass options up to parent
        if (onFieldOptionsLoaded) {
          onFieldOptionsLoaded(options);
        }
      }
    } catch (error) {
      console.error("Error fetching field options:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [onFieldOptionsLoaded]);
  
  // Fetch options on component mount
  useEffect(() => {
    fetchAllFieldOptions();
  }, [fetchAllFieldOptions]);
  
  // Update localStorage when selections change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStatuses));
        localStorage.setItem(ESTIMATOR_STORAGE_KEY, JSON.stringify(selectedEstimators));
        localStorage.setItem(MANAGER_STORAGE_KEY, JSON.stringify(selectedManagers));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
    // Notify parent component with all selections
    onStatusChange({
      statuses: selectedStatuses,
      estimators: selectedEstimators,
      managers: selectedManagers
    });
  }, [selectedStatuses, selectedEstimators, selectedManagers, onStatusChange]);
  
  // Update localStorage when search term changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SEARCH_KEY, searchTerm);
      } catch (e) {
        console.error('Error writing search to localStorage', e);
      }
    }
    // Notify parent component
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);
  
  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };
  
  const handleEstimatorToggle = (estimator) => {
    setSelectedEstimators(prev => {
      if (prev.includes(estimator)) {
        return prev.filter(e => e !== estimator);
      } else {
        return [...prev, estimator];
      }
    });
  };
  
  const handleManagerToggle = (manager) => {
    setSelectedManagers(prev => {
      if (prev.includes(manager)) {
        return prev.filter(m => m !== manager);
      } else {
        return [...prev, manager];
      }
    });
  };
  
  const handleSelectAll = (field) => {
    switch (field) {
      case 'status':
        setSelectedStatuses([...allStatuses]);
        break;
      case 'estimator':
        setSelectedEstimators([...fieldOptions.estimatorOptions]);
        break;
      case 'manager':
        setSelectedManagers([...fieldOptions.managerOptions]);
        break;
      default:
        break;
    }
  };
  
  const handleClearAll = (field) => {
    switch (field) {
      case 'status':
        setSelectedStatuses([]);
        break;
      case 'estimator':
        setSelectedEstimators([]);
        break;
      case 'manager':
        setSelectedManagers([]);
        break;
      default:
        break;
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Get total selected filters count
  const totalSelectedFilters = selectedStatuses.length + selectedEstimators.length + selectedManagers.length;
  
  return (
    <FilterContainer>
      {extraButtons}
      <SearchInput
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={handleSearchChange}
        prefix={<SearchOutlined />}
      />
      <Dropdown 
        overlay={
          <FilterMenu style={{ width: 'auto', minWidth: '300px' }}>
            {/* Stages (Status) Filter Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Job Stage</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Button size="small" onClick={() => handleSelectAll('status')}>Select All</Button>
                <Button size="small" onClick={() => handleClearAll('status')}>Clear All</Button>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '4px' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  allStatuses.map(status => (
                    <FilterOption key={status} onClick={() => handleStatusToggle(status)}>
                      <Checkbox checked={selectedStatuses.includes(status)} style={{ marginRight: '8px' }} />
                      {status}
                    </FilterOption>
                  ))
                )}
              </div>
            </div>
            
            {/* Estimator Filter Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Estimator</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Button size="small" onClick={() => handleSelectAll('estimator')}>Select All</Button>
                <Button size="small" onClick={() => handleClearAll('estimator')}>Clear All</Button>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '4px' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  fieldOptions.estimatorOptions.map(estimator => (
                    <FilterOption key={estimator} onClick={() => handleEstimatorToggle(estimator)}>
                      <Checkbox checked={selectedEstimators.includes(estimator)} style={{ marginRight: '8px' }} />
                      {estimator}
                    </FilterOption>
                  ))
                )}
              </div>
            </div>
            
            {/* Manager Filter Section */}
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Production Manager</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Button size="small" onClick={() => handleSelectAll('manager')}>Select All</Button>
                <Button size="small" onClick={() => handleClearAll('manager')}>Clear All</Button>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '4px' }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  fieldOptions.managerOptions.map(manager => (
                    <FilterOption key={manager} onClick={() => handleManagerToggle(manager)}>
                      <Checkbox checked={selectedManagers.includes(manager)} style={{ marginRight: '8px' }} />
                      {manager}
                    </FilterOption>
                  ))
                )}
              </div>
            </div>
          </FilterMenu>
        }
        trigger={['click']} 
        visible={open}
        onVisibleChange={setOpen}
      >
        <FilterButton onClick={() => setOpen(!open)}>
          Filter ({totalSelectedFilters})
        </FilterButton>
      </Dropdown>
    </FilterContainer>
  );
};

export default JobStatusFilter;

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

// localStorage key for status selections
const STORAGE_KEY = 'jobStatusFilterSelections';
const SEARCH_KEY = 'jobStatusFilterSearch';

const JobStatusFilter = ({ 
  onStatusChange, 
  onSearchChange, 
  onFieldOptionsLoaded, // New prop to pass options to parent
  initialSelections = null, 
  extraButtons = null 
}) => {
  // State for all available statuses
  const [allStatuses, setAllStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for all options
  const [fieldOptions, setFieldOptions] = useState({
    estimatorOptions: [],
    stageOptions: [],
    managerOptions: []
  });
  
  // Initialize from localStorage or fall back to defaults
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
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
    // Notify parent component
    onStatusChange(selectedStatuses);
  }, [selectedStatuses, onStatusChange]);
  
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
  
  const handleSelectAll = () => {
    setSelectedStatuses([...allStatuses]);
  };
  
  const handleClearAll = () => {
    setSelectedStatuses([]);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Using the original dropdown approach without Ant Design Menu
  // This should work with current Ant Design versions
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
          <FilterMenu>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Button size="small" onClick={handleSelectAll}>Select All</Button>
              <Button size="small" onClick={handleClearAll}>Clear All</Button>
            </div>
            <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}></div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spin size="small" />
              </div>
            ) : error ? (
              <div style={{ padding: '10px', color: 'red' }}>
                Error loading statuses. Using defaults.
              </div>
            ) : (
              allStatuses.map(status => (
                <FilterOption key={status} onClick={() => handleStatusToggle(status)}>
                  <Checkbox checked={selectedStatuses.includes(status)} style={{ marginRight: '8px' }} />
                  {status}
                </FilterOption>
              ))
            )}
          </FilterMenu>
        }
        trigger={['click']} 
        visible={open}
        onVisibleChange={setOpen}
      >
        <FilterButton onClick={() => setOpen(!open)}>
          Filter by Status ({selectedStatuses.length})
        </FilterButton>
      </Dropdown>
    </FilterContainer>
  );
};

export default JobStatusFilter;

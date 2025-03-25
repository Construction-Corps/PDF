import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Dropdown, Checkbox, Button, Input, Spin, Select } from 'antd';
import { SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, FilterOutlined } from '@ant-design/icons';
import { fetchJobTread } from '@/utils/JobTreadApi';
import { useWindowSize } from './useWindowSize';

const FilterContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 50px;
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
  ${props => props.isMobile && `
    min-width: 36px;
    padding: 0 8px;
  `}
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
  width: ${props => props.isMobile ? '120px' : '200px'};
  border-radius: 4px;
`;

const FilterPanel = styled.div`
  background: white;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  padding: ${props => props.isMobile ? '12px 8px' : '16px'};
  width: ${props => props.isMobile ? '100%' : '700px'};
  max-width: ${props => props.isMobile ? '100vw' : 'none'};
  display: flex;
  flex-direction: column;
  gap: ${props => props.isMobile ? '8px' : '12px'};
`;

const FilterRow = styled.div`
  display: flex;
  gap: ${props => props.isMobile ? '8px' : '12px'};
  flex-wrap: wrap;
  flex-direction: ${props => props.isMobile ? 'column' : 'row'};
`;

const FilterSection = styled.div`
  flex: 1;
  min-width: ${props => props.isMobile ? '100%' : '200px'};
`;

const SectionTitle = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  font-size: ${props => props.isMobile ? '14px' : '16px'};
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

// Add localStorage keys for new filters
const ESTIMATOR_KEY = 'jobEstimatorFilterSelections';
const MANAGER_KEY = 'jobManagerFilterSelections';
const SORT_KEY = 'jobSortSelection';


const JobStatusFilter = ({ 
  onStatusChange, 
  onSearchChange, 
  onFieldOptionsLoaded,
  onSortChange, // New prop for sorting
  onFiltersChange, // New prop for combined filter changes
  initialSelections = null, 
  extraButtons = null 
}) => {
  // Add window size state
  const { isMobile } = useWindowSize();
  
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
  
  // Add new state for estimator and manager filters
  const [selectedEstimators, setSelectedEstimators] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ESTIMATOR_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return [];
  });
  
  const [selectedManagers, setSelectedManagers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MANAGER_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return [];
  });
  
  // Add sort state
  const [sortOption, setSortOption] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SORT_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return { field: "createdAt", order: "desc" };
  });
  
  const [open, setOpen] = useState(false);
  
  // Setup debounce function for filter changes
  const debouncedFilterChange = useCallback(
    debounce(() => {
      const filters = {
        statuses: selectedStatuses,
        estimators: selectedEstimators,
        managers: selectedManagers,
        search: searchTerm,
        sort: sortOption
      };
      
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
      
      // Also call individual handlers for backward compatibility
      if (onStatusChange) onStatusChange(selectedStatuses);
      if (onSearchChange) onSearchChange(searchTerm);
      if (onSortChange) onSortChange(sortOption);
    }, 500),
    [selectedStatuses, selectedEstimators, selectedManagers, searchTerm, sortOption]
  );
  
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
  
  // Update localStorage and trigger changes when filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStatuses));
        localStorage.setItem(ESTIMATOR_KEY, JSON.stringify(selectedEstimators));
        localStorage.setItem(MANAGER_KEY, JSON.stringify(selectedManagers));
        localStorage.setItem(SORT_KEY, JSON.stringify(sortOption));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
    
    debouncedFilterChange();
  }, [selectedStatuses, selectedEstimators, selectedManagers, sortOption, debouncedFilterChange]);
  
  // Update search separately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SEARCH_KEY, searchTerm);
      } catch (e) {
        console.error('Error writing search to localStorage', e);
      }
    }
    
    debouncedFilterChange();
  }, [searchTerm, debouncedFilterChange]);
  
  // Toggle handlers for each filter type
  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };
  
  const handleEstimatorToggle = (estimator) => {
    setSelectedEstimators(prev => 
      prev.includes(estimator) 
        ? prev.filter(e => e !== estimator) 
        : [...prev, estimator]
    );
  };
  
  const handleManagerToggle = (manager) => {
    setSelectedManagers(prev => 
      prev.includes(manager) 
        ? prev.filter(m => m !== manager) 
        : [...prev, manager]
    );
  };
  
  // Sort option handlers
  const handleSortFieldChange = (field) => {
    setSortOption(prev => ({ ...prev, field }));
  };
  
  const handleSortOrderToggle = () => {
    setSortOption(prev => ({ 
      ...prev, 
      order: prev.order === 'asc' ? 'desc' : 'asc' 
    }));
  };
  
  // Select all / clear handlers
  const handleSelectAllStatuses = () => setSelectedStatuses([...allStatuses]);
  const handleClearStatuses = () => setSelectedStatuses([]);
  
  const handleSelectAllEstimators = () => setSelectedEstimators([...fieldOptions.estimatorOptions]);
  const handleClearEstimators = () => setSelectedEstimators([]);
  
  const handleSelectAllManagers = () => setSelectedManagers([...fieldOptions.managerOptions]);
  const handleClearManagers = () => setSelectedManagers([]);
  
  // Get all possible sort fields
  const sortFields = [
    { label: "Created Date", value: "createdAt" },
    { label: "Updated Date", value: "updatedAt" },
    { label: "Job Name", value: "name" },
    { label: "Stage", value: STAGE_FIELD_ID },
    { label: "Estimator", value: ESTIMATOR_FIELD_ID },
    { label: "Manager", value: MANAGER_FIELD_ID },
  ];

  // Helper function to render a filter section
  const renderFilterSection = (title, options, selected, toggleFn, selectAllFn, clearFn) => (
    <FilterSection isMobile={isMobile}>
      <SectionTitle isMobile={isMobile}>{title}</SectionTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Button size={isMobile ? "small" : "middle"} onClick={selectAllFn}>
          {isMobile ? 'All' : 'Select All'}
        </Button>
        <Button size={isMobile ? "small" : "middle"} onClick={clearFn}>
          {isMobile ? '✕' : 'Clear'}
        </Button>
      </div>
      <div style={{ 
        maxHeight: isMobile ? '150px' : '200px', 
        overflowY: 'auto',
        fontSize: isMobile ? '13px' : '14px'
      }}>
        {options.map(option => (
          <FilterOption key={option} onClick={() => toggleFn(option)}>
            <Checkbox 
              checked={selected.includes(option)} 
              style={{ marginRight: '8px' }} 
            />
            {option}
          </FilterOption>
        ))}
      </div>
    </FilterSection>
  );
  
  return (
    <FilterContainer isMobile={isMobile}>
      {extraButtons}
      <SearchInput
        isMobile={isMobile}
        placeholder={isMobile ? "Search..." : "Search jobs..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        prefix={<SearchOutlined />}
      />
      <Dropdown 
        overlay={
          <FilterPanel isMobile={isMobile}>
            <FilterRow isMobile={isMobile}>
              {/* Status filter */}
              {renderFilterSection(
                "Status", 
                allStatuses, 
                selectedStatuses, 
                handleStatusToggle,
                handleSelectAllStatuses,
                handleClearStatuses
              )}
              
              {/* Estimator filter */}
              {renderFilterSection(
                "Estimator", 
                fieldOptions.estimatorOptions, 
                selectedEstimators, 
                handleEstimatorToggle,
                handleSelectAllEstimators,
                handleClearEstimators
              )}
              
              {/* Manager filter */}
              {renderFilterSection(
                "Manager", 
                fieldOptions.managerOptions, 
                selectedManagers, 
                handleManagerToggle,
                handleSelectAllManagers,
                handleClearManagers
              )}
            </FilterRow>
            
            {/* Sort section */}
            <FilterRow isMobile={isMobile}>
              <FilterSection isMobile={isMobile}>
                <SectionTitle isMobile={isMobile}>Sort By</SectionTitle>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Select 
                    style={{ flex: 1 }}
                    value={sortOption.field}
                    onChange={handleSortFieldChange}
                    size={isMobile ? "small" : "middle"}
                  >
                    {sortFields.map(field => (
                      <Select.Option key={field.value} value={field.value}>
                        {field.label}
                      </Select.Option>
                    ))}
                  </Select>
                  
                  <Button 
                    icon={sortOption.order === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    onClick={handleSortOrderToggle}
                    size={isMobile ? "small" : "middle"}
                  />
                </div>
              </FilterSection>
            </FilterRow>
          </FilterPanel>
        }
        trigger={['click']} 
        visible={open}
        onVisibleChange={setOpen}
        placement={isMobile ? "bottomRight" : "bottomLeft"}
      >
        <FilterButton isMobile={isMobile} onClick={() => setOpen(!open)}>
          {isMobile ? <FilterOutlined /> : "Filter"}
        </FilterButton>
      </Dropdown>
    </FilterContainer>
  );
};

// Add debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default JobStatusFilter;


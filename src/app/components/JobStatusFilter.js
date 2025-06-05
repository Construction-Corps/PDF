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
  // background: white;
  // border: 1px solid #d9d9d9;
  // box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
  // border-radius: 4px;
  // display: flex;
  // align-items: center;
  // justify-content: center;
  // font-weight: 500;
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

// Standard field IDs - centralized here only
const STANDARD_FIELDS = [
  { id: "22NwzQcjYUA4" }, // Stage
  { id: "22NwWybgjBTW" }, // Estimator
  { id: "22P2ZNybRiyG" }  // Manager
];

const JobStatusFilter = ({ 
  onFiltersChange,
  onFieldOptionsLoaded,
  customFieldId = null, // Additional field ID from parent
  defaultSelections = null,
  initialSelections = null,
  extraButtons = null 
}) => {
  const { isMobile } = useWindowSize();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for all field data
  const [fieldsData, setFieldsData] = useState([]);
  
  // Unified filter state
  const [filterState, setFilterState] = useState({
    search: "",
    sort: { field: "createdAt", order: "desc" }
  });
  
  // Helper to load from localStorage
  const loadFromStorage = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
    return defaultValue;
  };
  
  // Helper to save to localStorage
  const saveToStorage = (key, value) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
  };
  
  // Initialize search and sort from localStorage
  useEffect(() => {
    setFilterState(prev => ({
      ...prev,
      search: loadFromStorage('jobSearchTerm', ''),
      sort: loadFromStorage('jobSortOptions', { field: "createdAt", order: "desc" })
    }));
  }, []);
  
  // Fetch field data
  useEffect(() => {
    const fetchAllFields = async () => {
      setLoading(true);
      
      try {
        // Get all needed field IDs
        const fieldIds = [
          ...STANDARD_FIELDS.map(f => f.id),
          // Add custom field if provided and not already included
          ...(customFieldId && !STANDARD_FIELDS.some(f => f.id === customFieldId) 
              ? [customFieldId] 
              : [])
        ];
        
        // Query all fields at once
        const query = {
          "organization": {
            "$": { "id": "22NwWhUAf6VB" },
            "id": {},
            "customFields": {
              "nodes": {
                "id": {},
                "name": {},
                "options": {}
              },
              "$": {
                "where": {
                  "or": fieldIds.map(id => ["id", "=", id])
                }
              }
            }
          }
        };
        
        const data = await fetchJobTread(query);
        
        if (data?.organization?.customFields?.nodes) {
          const fields = data.organization.customFields.nodes;
          setFieldsData(fields);
          
          // Initialize filter state for each field
          fields.forEach(field => {
            const stateKey = field.name.toLowerCase().replace(/\s+/g, '_');
            const storageKey = `jobFilter_${field.id}`;
            
            // Load values from localStorage
            let defaultValues = [];
            if (field.name === 'Stage') {
              defaultValues = ["Job Started 🔨", "Job Mid Way ⚒️", "Job Complete ✅", 
                              "Pre-Production 🗓️", "Awaiting Payment ⏲️"];
            }
            if (defaultSelections) {
              defaultValues = defaultSelections.defaults;
            }
            
            const values = loadFromStorage(storageKey, defaultValues);
            
            // Update filterState for this field
            setFilterState(prev => ({
              ...prev,
              [stateKey]: values
            }));
          });
          
          // Create options object for backward compatibility
          const optionsObj = {
            fieldsData: fields
          };
          
          // Add field-specific options
          fields.forEach(field => {
            const key = `${field.id}_options`;
            optionsObj[key] = field.options || [];
            
            // Also add legacy keys for backward compatibility
            if (field.id === "22NwzQcjYUA4") { // Stage
              optionsObj.stageOptions = field.options || [];
            } else if (field.id === "22NwWybgjBTW") { // Estimator
              optionsObj.estimatorOptions = field.options || [];
            } else if (field.id === "22P2ZNybRiyG") { // Manager
              optionsObj.managerOptions = field.options || [];
            }
          });
          
          // Notify parent
          if (onFieldOptionsLoaded) {
            onFieldOptionsLoaded(optionsObj);
          }
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllFields();
  }, [customFieldId, onFieldOptionsLoaded]);
  
  // Toggle value in a field
  const toggleFieldValue = (fieldId, stateKey, value) => {
    setFilterState(prev => {
      const currentValues = prev[stateKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      // Save to localStorage
      saveToStorage(`jobFilter_${fieldId}`, newValues);
      
      return {
        ...prev,
        [stateKey]: newValues
      };
    });
  };
  
  // Select all values for a field
  const selectAllValues = (fieldId, stateKey, options) => {
    setFilterState(prev => {
      // Save to localStorage
      saveToStorage(`jobFilter_${fieldId}`, options);
      
      return {
        ...prev,
        [stateKey]: [...options]
      };
    });
  };
  
  // Clear all values for a field
  const clearValues = (fieldId, stateKey) => {
    setFilterState(prev => {
      // Save to localStorage
      saveToStorage(`jobFilter_${fieldId}`, []);
      
      return {
        ...prev,
        [stateKey]: []
      };
    });
  };
  
  // Handle search change
  const handleSearchChange = (value) => {
    setFilterState(prev => ({
      ...prev,
      search: value
    }));
    saveToStorage('jobSearchTerm', value);
  };
  
  // Handle sort field change
  const handleSortFieldChange = (field) => {
    setFilterState(prev => {
      const newSort = { ...prev.sort, field };
      saveToStorage('jobSortOptions', newSort);
      return {
        ...prev,
        sort: newSort
      };
    });
  };
  
  // Toggle sort order
  const handleSortOrderToggle = () => {
    setFilterState(prev => {
      const newSort = { 
        ...prev.sort,
        order: prev.sort.order === 'asc' ? 'desc' : 'asc'
      };
      saveToStorage('jobSortOptions', newSort);
      return {
        ...prev,
        sort: newSort
      };
    });
  };
  
  // Notify parent when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFiltersChange) {
        // Build the filter object with fieldIds as keys where needed
        const filtersWithIds = { ...filterState };
        
        // Add field IDs as keys for dynamic fields
        fieldsData.forEach(field => {
          const stateKey = field.name.toLowerCase().replace(/\s+/g, '_');
          const values = filterState[stateKey] || [];
          
          // Add field ID as a key with its values
          if (values.length > 0) {
            filtersWithIds[field.id] = values;
          }
        });
        
        onFiltersChange(filtersWithIds);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filterState, fieldsData, onFiltersChange]);
  
  // Render field filter section
  const renderFieldFilter = (field) => {
    const stateKey = field.name.toLowerCase().replace(/\s+/g, '_');
    const values = filterState[stateKey] || [];
    const options = field.options || [];
    
    return (
      <FilterSection isMobile={isMobile} key={field.id}>
        <SectionTitle isMobile={isMobile}>{field.name}</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Button 
            size={isMobile ? "small" : "middle"} 
            onClick={() => selectAllValues(field.id, stateKey, options)}
          >
            {isMobile ? 'All' : 'Select All'}
          </Button>
          <Button 
            size={isMobile ? "small" : "middle"} 
            onClick={() => clearValues(field.id, stateKey)}
          >
            {isMobile ? '✕' : 'Clear'}
          </Button>
        </div>
        <div style={{ 
          maxHeight: isMobile ? '150px' : '200px', 
          overflowY: 'auto',
          fontSize: isMobile ? '13px' : '14px'
        }}>
          {options.map(option => (
            <FilterOption key={option} onClick={() => toggleFieldValue(field.id, stateKey, option)}>
              <Checkbox 
                checked={values.includes(option)} 
                style={{ marginRight: '8px' }} 
              />
              {option}
            </FilterOption>
          ))}
        </div>
      </FilterSection>
    );
  };
  
  // Get all possible sort fields
  const sortFields = [
    { label: "Created Date", value: "createdAt" },
    { label: "Updated Date", value: "updatedAt" },
    { label: "Job Name", value: "name" },
    // Add field-specific options
    ...fieldsData.map(field => ({
      label: field.name,
      value: field.id
    }))
  ];
  
  return (
    <FilterContainer isMobile={isMobile}>
      {extraButtons}
      <SearchInput
        isMobile={isMobile}
        placeholder={isMobile ? "Search..." : "Search jobs..."}
        value={filterState.search}
        onChange={(e) => handleSearchChange(e.target.value)}
        prefix={<SearchOutlined />}
      />
      <Dropdown 
        overlay={
          <FilterPanel isMobile={isMobile}>
            <FilterRow isMobile={isMobile}>
              {/* Render all fields */}
              {fieldsData.map(field => renderFieldFilter(field))}
            </FilterRow>
            
            {/* Sort section */}
            <FilterRow isMobile={isMobile}>
              <FilterSection isMobile={isMobile}>
                <SectionTitle isMobile={isMobile}>Sort By</SectionTitle>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Select 
                    style={{ flex: 1 }}
                    value={filterState.sort.field}
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
                    icon={filterState.sort.order === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
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

export default JobStatusFilter;


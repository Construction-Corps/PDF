import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Dropdown, Checkbox, Button, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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

// List of all possible status options
const ALL_STATUSES = [
  "Called - No Answer 📵", 
  "Contacted 📞", 
  "Estimate Scheduled 📆", 
  "Prospect Canceled / LOST ❌",
  "Ballpark Sent 📨", 
  "Design Proposal in Progress 📝", 
  "Design Sold 💲", 
  "In Planning & Design 🎨", 
  "Proposal in Progress ⏳", 
  "Proposal Sent 📨", 
  "Proposal Approved 🎉", 
  "In Permitting ❄️", 
  "Pre-Production 🗓️", 
  "Job Started 🔨", 
  "Job Mid Way ⚒️", 
  "Awaiting Payment ⏲️", 
  "Job Complete ✅", 
  "Job Closed ✨🏡", 
  "Follow Up Later 🔁", 
  "Do Not Contact 🚫", 
  "No Opportunity ⛔"
];

// Default selections that match current JobChecklist
const DEFAULT_SELECTIONS = [
  "Job Started 🔨",
  "Job Mid Way ⚒️", 
  "Job Complete ✅", 
  "Pre-Production 🗓️", 
  "Awaiting Payment ⏲️"
];

// localStorage key for status selections
const STORAGE_KEY = 'jobStatusFilterSelections';
const SEARCH_KEY = 'jobStatusFilterSearch';

const JobStatusFilter = ({ onStatusChange, onSearchChange, initialSelections = null }) => {
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
    setSelectedStatuses(ALL_STATUSES);
  };
  
  const handleClearAll = () => {
    setSelectedStatuses([]);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const menu = (
    <FilterMenu>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Button size="small" onClick={handleSelectAll}>Select All</Button>
        <Button size="small" onClick={handleClearAll}>Clear All</Button>
      </div>
      <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}></div>
      {ALL_STATUSES.map(status => (
        <FilterOption key={status} onClick={() => handleStatusToggle(status)}>
          <Checkbox checked={selectedStatuses.includes(status)} style={{ marginRight: '8px' }} />
          {status}
        </FilterOption>
      ))}
    </FilterMenu>
  );
  
  return (
    <FilterContainer>
      <SearchInput
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={handleSearchChange}
        prefix={<SearchOutlined />}
      />
      <Dropdown 
        overlay={menu} 
        trigger={['click']} 
        open={open}
        onOpenChange={setOpen}
      >
        <FilterButton onClick={() => setOpen(!open)}>
          Filter by Status ({selectedStatuses.length})
        </FilterButton>
      </Dropdown>
    </FilterContainer>
  );
};

export default JobStatusFilter;

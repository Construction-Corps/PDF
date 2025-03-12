import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Dropdown, Checkbox, Button } from 'antd';

const FilterContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 100px;
  z-index: 10;
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
//   "Design Sold 💲", 
  "Pre-Production 🗓️", 
  "Awaiting Payment ⏲️"
];

// localStorage key for status selections
const STORAGE_KEY = 'jobStatusFilterSelections';

const JobStatusFilter = ({ onStatusChange, initialSelections = null }) => {
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

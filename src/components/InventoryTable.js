import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Input, Button, Space, Card, Select, DatePicker, InputNumber, Checkbox } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchInventory } from '../utils/InventoryApi';
import debounce from 'lodash.debounce';

const { RangePicker } = DatePicker;
const { Option } = Select;

const InventoryTable = ({
  resource,
  columns,
  title,
  searchPlaceholder = "Search...",
  defaultPageSize = 50,
  rowKey = "id",
  extraFilters = [],
  additionalActions = null,
  onRowSelect = null,
  expandable = null,
  onDataChange = null,
  dataUpdateCallbacks = null,
  ...tableProps
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        data,
        updateItem: (id, updatedItem) => {
          setData(prev => prev.map(item => item.id === id ? updatedItem : item));
        },
        addItem: (newItem) => {
          setData(prev => [newItem, ...prev]);
          setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        },
        removeItem: (id) => {
          setData(prev => prev.filter(item => item.id !== id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        },
        refreshData: () => fetchData(true)
      });
    }
  }, [data, onDataChange]);

  const mapSortField = (field) => {
    const fieldMapping = {
      'storage_location': 'storage_location__name',
      'category': 'category__name', 
      'user': 'user__email',
      'item': 'item__name',
      'last_known_location': 'last_known_location__name'
    };
    
    return fieldMapping[field] || field;
  };

  const buildApiParams = useCallback(() => {
    const params = [];
    
    params.push(`page=${pagination.current}`);
    params.push(`page_size=${pagination.pageSize}`);
    
    if (searchText.trim()) {
      params.push(`search=${encodeURIComponent(searchText.trim())}`);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          // For arrays, use Django's __in format with comma-separated values
          if (value.length === 1) {
            params.push(`${key}=${encodeURIComponent(value[0])}`);
          } else {
            params.push(`${key}__in=${value.join(',')}`);
          }
        } else if (!Array.isArray(value)) {
          params.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
    });
    
    if (sorter.field) {
      const mappedField = mapSortField(sorter.field);
      const orderField = sorter.order === 'descend' ? `-${mappedField}` : mappedField;
      params.push(`ordering=${encodeURIComponent(orderField)}`);
    }
    
    return params.join('&');
  }, [pagination.current, pagination.pageSize, searchText, filters, sorter]);

  const fetchData = useCallback(async (resetPagination = false) => {
    setLoading(true);
    try {
      if (resetPagination) {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
      
      const params = buildApiParams();
      
      const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers = { 
        "Content-Type": "application/json" 
      };
      
      if (authToken) {
        headers["Authorization"] = `Token ${authToken}`;
      }
      
      const response = await fetch(`https://ccbe.onrender.com/api/inventory/${resource}/?${params}`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.results) {
        setData(result.results);
        setPagination(prev => ({
          ...prev,
          total: result.count,
          current: resetPagination ? 1 : prev.current
        }));
      } else {
        setData(result);
        setPagination(prev => ({
          ...prev,
          total: result.length,
          current: resetPagination ? 1 : prev.current
        }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      try {
        const fallbackData = await fetchInventory(resource);
        setData(fallbackData);
        setPagination(prev => ({
          ...prev,
          total: fallbackData.length,
          current: 1
        }));
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [resource, buildApiParams, searchText, filters, sorter]);

  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setSearchText(value);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 300),
    []
  );

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleTableChange = (newPagination, tableFilters, tableSorter) => {
    setPagination(newPagination);
    setSorter(tableSorter);
    
    const newFilters = {};
    Object.entries(tableFilters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        newFilters[key] = value.length === 1 ? value[0] : value;
      }
    });
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setSorter({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const renderFilterControls = () => {
    if (!showFilters || extraFilters.length === 0) return null;

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          {extraFilters.map(filter => {
            const { key, label, type, options, placeholder } = filter;
            const value = filters[key];

            switch (type) {
              case 'select':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <Select
                      placeholder={placeholder || `Select ${label}`}
                      value={value}
                      onChange={(val) => handleFilterChange(key, val)}
                      allowClear
                      style={{ minWidth: 120 }}
                    >
                      {options.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                );
              
              case 'multiselect':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <Select
                      mode="multiple"
                      placeholder={placeholder || `Select ${label}`}
                      value={value}
                      onChange={(val) => handleFilterChange(key, val)}
                      allowClear
                      style={{ minWidth: 150 }}
                    >
                      {options.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                );
              
              case 'daterange':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <RangePicker
                      value={value}
                      onChange={(dates) => {
                        if (dates && dates.length === 2) {
                          handleFilterChange(`${key}__gte`, dates[0].format('YYYY-MM-DD'));
                          handleFilterChange(`${key}__lte`, dates[1].format('YYYY-MM-DD'));
                        } else {
                          handleFilterChange(`${key}__gte`, null);
                          handleFilterChange(`${key}__lte`, null);
                        }
                      }}
                      style={{ minWidth: 200 }}
                    />
                  </div>
                );
              
              case 'number':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <InputNumber
                      placeholder={placeholder}
                      value={value}
                      onChange={(val) => handleFilterChange(key, val)}
                      style={{ minWidth: 100 }}
                    />
                  </div>
                );
              
              case 'numberrange':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <Space.Compact>
                      <InputNumber
                        placeholder="Min"
                        value={filters[`${key}__gte`]}
                        onChange={(val) => handleFilterChange(`${key}__gte`, val)}
                        style={{ width: 80 }}
                      />
                      <InputNumber
                        placeholder="Max"
                        value={filters[`${key}__lte`]}
                        onChange={(val) => handleFilterChange(`${key}__lte`, val)}
                        style={{ width: 80 }}
                      />
                    </Space.Compact>
                  </div>
                );
              
              case 'boolean':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <Checkbox
                      checked={value}
                      onChange={(e) => handleFilterChange(key, e.target.checked)}
                    >
                      {placeholder || label}
                    </Checkbox>
                  </div>
                );
              
              case 'text':
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500 }}>{label}</label>
                    <Input
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => handleFilterChange(key, e.target.value)}
                      style={{ minWidth: 120 }}
                    />
                  </div>
                );
              
              default:
                return null;
            }
          })}
        </Space>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {additionalActions && (
          <div style={{ display: 'flex', gap: 8 }}>
            {additionalActions}
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            onChange={(e) => debouncedSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 300 }}
          />
          
          {extraFilters.length > 0 && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              type={showFilters ? 'primary' : 'default'}
            >
              Filters
            </Button>
          )}
          
          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
            disabled={Object.keys(filters).length === 0 && !searchText && !sorter.field}
          >
            Clear
          </Button>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(true)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {renderFilterControls()}

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: true }}
        sticky={true}
        expandable={expandable}
        rowSelection={onRowSelect ? {
          onChange: onRowSelect
        } : undefined}
        {...tableProps}
      />
    </div>
  );
};

export default InventoryTable; 
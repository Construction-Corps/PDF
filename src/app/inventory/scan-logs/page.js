'use client';

import React, { useState, useEffect } from 'react';
import { Table, message, Tag, DatePicker, Select, Input, Button, Row, Col } from 'antd';
import { fetchInventory, fetchUsers } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ScanLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user: null,
    item: null,
    action: null,
    dateRange: null,
  });
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);
  
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [logsData, usersData, itemsData] = await Promise.all([
          fetchInventory('scan-logs'),
          fetchUsers(),
          fetchInventory('items')
      ]);
      setLogs(logsData);
      setUsers(usersData);
      setItems(itemsData);
    } catch (error) {
      // HACK: no /api/users endpoint exists on the BE.
      // message.error('Failed to fetch data');
      console.error(error)
      // fetch just logs and items for now
      const [logsData, itemsData] = await Promise.all([
          fetchInventory('scan-logs'),
          fetchInventory('items')
      ]);
      setLogs(logsData);
      setItems(itemsData);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredLogs = logs.filter(log => {
    const { user, item, action, dateRange } = filters;
    if (user && log.user !== user) return false;
    if (item && log.item !== item) return false;
    if (action && log.action !== action) return false;
    if (dateRange && (new Date(log.timestamp) < dateRange[0] || new Date(log.timestamp) > dateRange[1])) return false;
    return true;
  });

  const columns = [
    { 
      title: 'Timestamp', 
      dataIndex: 'timestamp', 
      key: 'timestamp',
      render: (ts) => new Date(ts).toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    { 
      title: 'Item', 
      key: 'item',
      render: (_, record) => {
        const itm = items.find(i => i.id === record.item);
        return itm ? itm.name : record.item;
      },
      sorter: (a, b) => {
        const nameA = items.find(i=>i.id===a.item)?.name || '';
        const nameB = items.find(i=>i.id===b.item)?.name || '';
        return nameA.localeCompare(nameB);
      }
    },
    { 
      title: 'User', 
      key: 'user',
      render: (_, record) => {
        const usr = users.find(u => u.id === record.user);
        return usr ? (usr.first_name || usr.last_name ? `${usr.first_name} ${usr.last_name}`.trim() : usr.email) : record.user;
      },
      sorter: (a, b) => {
        const nameA = users.find(u=>u.id===a.user);
        const nameB = users.find(u=>u.id===b.user);
        const dispA = nameA ? (nameA.first_name||nameA.last_name?`${nameA.first_name} ${nameA.last_name}`.trim():nameA.email):'';
        const dispB = nameB ? (nameB.first_name||nameB.last_name?`${nameB.first_name} ${nameB.last_name}`.trim():nameB.email):'';
        return dispA.localeCompare(dispB);
      }
    },
    { 
      title: 'Action', 
      dataIndex: 'action', 
      key: 'action',
      render: (action) => {
        let color = 'geekblue';
        if (action === 'CHECK_IN') color = 'green';
        if (action === 'CHECK_OUT') color = 'volcano';
        return <Tag color={color}>{action.replace('_', ' ')}</Tag>;
      },
      sorter: (a, b) => a.action.localeCompare(b.action),
    },
    { title: 'Address', dataIndex: 'location_name', key: 'location_name', render: (val) => val || '—' },
    { title: 'Latitude', dataIndex: 'latitude', key: 'latitude', render: (val) => val?.toFixed ? val.toFixed(5) : val },
    { title: 'Longitude', dataIndex: 'longitude', key: 'longitude', render: (val) => val?.toFixed ? val.toFixed(5) : val },
    { title: 'JobTread Job', dataIndex: 'jobtread_job_id', key: 'jobtread_job_id', render: (id) => id || '—' },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Scan Logs</h2>
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Select
                placeholder="Filter by User"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('user', value)}
                >
                {users.map(u => <Option key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}</Option>)}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Item"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('item', value)}
                >
                {items.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
              </Select>
            </Col>
            <Col span={6}>
                <Select
                    placeholder="Filter by Action"
                    allowClear
                    style={{ width: '100%' }}
                    onChange={(value) => handleFilterChange('action', value)}
                >
                    <Option value="CHECK_IN">Check In</Option>
                    <Option value="CHECK_OUT">Check Out</Option>
                    <Option value="AUDIT">Audit</Option>
                </Select>
            </Col>
            <Col span={6}>
                <RangePicker 
                    style={{ width: '100%' }}
                    onChange={(dates) => handleFilterChange('dateRange', dates)}
                />
            </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey="id"
        />
      </div>
    </ProtectedRoute>
  );
};

export default ScanLogsPage; 
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { fetchUsers } from '../../../utils/InventoryApi';

const { Option } = Select;

const UserDevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesData, usersData] = await Promise.all([
        fetchInventory('user-devices'),
        fetchUsers()
      ]);
      setDevices(devicesData);
      setUsers(usersData);
    } catch (error) {
      // HACK: no /api/users endpoint exists on the BE.
      console.error(error);
      // Fetch just devices for now
      try {
        const devicesData = await fetchInventory('user-devices');
        setDevices(devicesData);
      } catch (devicesError) {
        message.error('Failed to fetch user devices');
      }
    } finally {
      setLoading(false);
    }
  };

  const showModal = (device) => {
    setEditingDevice(device);
    form.setFieldsValue({
      ...device,
      user: device.user?.id,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingDevice(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Only allow updating the 'name' and 'user' field. device_id is immutable.
      const updateData = { 
        name: values.name,
        user: values.user
      };
      await updateInventory('user-devices', editingDevice.id, updateData);
      message.success('Device updated successfully');
      handleCancel();
      fetchData();
    } catch (error) {
      message.error('Failed to save device');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('user-devices', id);
      message.success('Device unregistered successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to unregister device');
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (newValue === (dataIndex === 'user' ? record.user?.id : record[dataIndex])) return;
    const payload = dataIndex === 'user' ? { user: newValue } : { [dataIndex]: newValue };
    try {
      await updateInventory('user-devices', record.id, payload);
      message.success('Device updated');
      // update state
      setDevices(prev => prev.map(d => {
        if (d.id !== record.id) return d;
        if (dataIndex === 'user') {
          const userObj = users.find(u => u.id === newValue);
          return { ...d, user: userObj };
        }
        return { ...d, [dataIndex]: newValue };
      }));
    } catch (err) {
      message.error('Update failed');
    }
  };

  const editableTextRender = (dataIndex) => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === dataIndex) {
      return (
        <Input defaultValue={text}
          autoFocus
          onBlur={(e) => handleCellSave(record, dataIndex, e.target.value)}
          onPressEnter={(e) => handleCellSave(record, dataIndex, e.target.value)} />
      );
    }
    return <span style={{cursor:'pointer'}} onClick={() => setEditingCell({id: record.id, dataIndex})}>{text || '—'}</span>;
  };

  const editableSelectRender = () => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === 'user') {
      return (
        <Select
          defaultValue={record.user?.id}
          style={{width:120}}
          onChange={(val) => handleCellSave(record, 'user', val)}
          onBlur={() => setEditingCell(null)}
          options={users.map(u => ({value: u.id, label: u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}))}
          autoFocus
          open
        />
      );
    }
    return <span style={{cursor:'pointer'}} onClick={() => setEditingCell({id: record.id, dataIndex:'user'})}>{text || '—'}</span>;
  };

  const columns = [
    { title: 'Device Name', dataIndex: 'name', key: 'name', render: editableTextRender('name') },
    { title: 'Device ID', dataIndex: 'device_id', key: 'device_id' },
    { 
      title: 'User',
      key: 'user',
      render: (_, record) => {
        const display = record.user ? (record.user.first_name || record.user.last_name ? `${record.user.first_name} ${record.user.last_name}`.trim() : record.user.email) : '—';
        return editableSelectRender()(display, record);
      }
    },
    { title: 'Registered At', dataIndex: 'registered_at', key: 'registered_at',
      render: (ts) => new Date(ts).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Registered User Devices</h2>
        <p>Note: New devices are added through the device registration flow, not here.</p>
        <Table
          columns={columns}
          dataSource={devices}
          loading={loading}
          rowKey="id"
        />
        <Modal
          title="Edit Device"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose
        >
          <Form form={form} layout="vertical" name="device_form">
            <Form.Item name="name" label="Device Name">
              <Input placeholder="e.g., John's iPhone"/>
            </Form.Item>
            <Form.Item name="user" label="User" rules={[{ required: true }]}>
              <Select>
                {/* HACK: no users endpoint, so this will be empty unless the above fetch works */}
                {users.map(u => <Option key={u.id} value={u.id}>{u.username}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Device ID">
                <Input disabled value={editingDevice?.device_id} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default UserDevicesPage; 
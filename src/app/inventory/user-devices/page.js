'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import InventoryTable from '../../../components/InventoryTable';
import { fetchUsers } from '../../../utils/InventoryApi';

const { Option } = Select;

const UserDevicesPage = () => {
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);
  const [dataManager, setDataManager] = useState(null);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  const fetchSupportingData = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
      // HACK: no /api/users endpoint exists on the BE.
      console.error(error);
      message.warn('Could not fetch users. Some features may be limited.');
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
      const updatedDevice = await updateInventory('user-devices', editingDevice.id, updateData);
      message.success('Device updated successfully');
      handleCancel();
      // Update the device in the table
      if (dataManager) {
        dataManager.updateItem(editingDevice.id, updatedDevice);
      }
    } catch (error) {
      message.error('Failed to save device');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('user-devices', id);
      message.success('Device unregistered successfully');
      // Remove device from table
      if (dataManager) {
        dataManager.removeItem(id);
      }
    } catch (error) {
      message.error('Failed to unregister device');
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (newValue === (dataIndex === 'user' ? record.user?.id : record[dataIndex])) return;
    const payload = dataIndex === 'user' ? { user: newValue } : { [dataIndex]: newValue };
    try {
      const updatedDevice = await updateInventory('user-devices', record.id, payload);
      message.success('Device updated');
      // Update device in table
      if (dataManager) {
        dataManager.updateItem(record.id, updatedDevice);
      }
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
    return text || '—';
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
    return text || '—';
  };

  const columns = [
    { 
      title: 'Device Name', 
      dataIndex: 'name', 
      key: 'name',
      sorter: true,
      render: editableTextRender('name'),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'name') {
            setEditingCell({ id: record.id, dataIndex: 'name' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Device ID', 
      dataIndex: 'device_id', 
      key: 'device_id', 
      sorter: true 
    },
    { 
      title: 'User',
      key: 'user',
      sorter: true,
      render: (_, record) => {
        const display = record.user ? (record.user.first_name || record.user.last_name ? `${record.user.first_name} ${record.user.last_name}`.trim() : record.user.email) : '—';
        return editableSelectRender()(display, record);
      },
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'user') {
            setEditingCell({ id: record.id, dataIndex: 'user' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Registered At', 
      dataIndex: 'registered_at', 
      key: 'registered_at',
      sorter: true,
      render: (ts) => new Date(ts).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}/>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}/>
        </Space>
      ),
    },
  ];

  const extraFilters = [
    {
      key: 'user',
      label: 'User',
      type: 'select',
      options: users.map(u => ({
        value: u.id,
        label: u.first_name || u.last_name ? 
          `${u.first_name} ${u.last_name}`.trim() : 
          u.email
      }))
    },
    {
      key: 'registered_at',
      label: 'Registration Date',
      type: 'daterange'
    }
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Registered User Devices</h2>
        <p>Note: New devices are added through the device registration flow, not here.</p>
        
        <InventoryTable
          resource="user-devices"
          columns={columns}
          searchPlaceholder="Search devices by name, device ID, user..."
          extraFilters={extraFilters}
          onDataChange={setDataManager}
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
                {users.map(u => <Option key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}</Option>)}
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
'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import InventoryTable from '../../../components/InventoryTable';

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  const fetchSupportingData = async () => {
    try {
      const data = await fetchInventory('locations');
      setLocations(data);
    } catch (error) {
      message.error('Failed to fetch locations');
    }
  };

  const showModal = (location = null) => {
    setEditingLocation(location);
    if (location) {
      form.setFieldsValue(location);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingLocation(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingLocation) {
        const updatedLocation = await updateInventory('locations', editingLocation.id, values);
        message.success('Location updated successfully');
        setLocations(prev => prev.map(loc => 
          loc.id === editingLocation.id ? updatedLocation : loc
        ));
      } else {
        const newLocation = await createInventory('locations', values);
        message.success('Location created successfully');
        setLocations(prev => [...prev, newLocation]);
      }
      handleCancel();
      fetchSupportingData();
    } catch (error) {
      message.error('Failed to save location');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('locations', id);
      message.success('Location deleted successfully');
      setLocations(prev => prev.filter(loc => loc.id !== id));
      fetchSupportingData();
    } catch (error) {
      message.error('Failed to delete location');
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (newValue === record[dataIndex]) return;
    try {
      const updatedLocation = await updateInventory('locations', record.id, { [dataIndex]: newValue });
      message.success('Location updated');
      setLocations(prev => prev.map(l => l.id === record.id ? updatedLocation : l));
    } catch (error) {
      message.error('Update failed');
    }
  };

  const editableTextRender = (dataIndex) => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === dataIndex) {
      return (
        <Input
          defaultValue={text}
          autoFocus
          onBlur={(e) => handleCellSave(record, dataIndex, e.target.value)}
          onPressEnter={(e) => handleCellSave(record, dataIndex, e.target.value)}
        />
      );
    }
    return text || '—';
  };

  const columns = [
    { 
      title: 'Name', 
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
      title: 'Description', 
      dataIndex: 'description', 
      key: 'description',
      render: editableTextRender('description'),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'description') {
            setEditingCell({ id: record.id, dataIndex: 'description' });
          }
        },
        style: { cursor: 'pointer' }
      })
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

  const additionalActions = [
    <Button
      key="add"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => showModal()}
    >
      Add Location
    </Button>
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h1>Storage Locations</h1>
        
        <InventoryTable
          resource="locations"
          columns={columns}
          searchPlaceholder="Search locations by name, description..."
          additionalActions={additionalActions}
          data={locations}
        />

        {/* Add/Edit Location Modal */}
        <Modal
          title={editingLocation ? 'Edit Location' : 'Add Location'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose
        >
          <Form form={form} layout="vertical" name="location_form">
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name of the location!' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default LocationsPage; 
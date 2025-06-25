'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory('locations');
      setLocations(data);
    } catch (error) {
      message.error('Failed to fetch locations');
    } finally {
      setLoading(false);
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
        await updateInventory('locations', editingLocation.id, values);
        message.success('Location updated successfully');
      } else {
        await createInventory('locations', values);
        message.success('Location created successfully');
      }
      handleCancel();
      fetchData();
    } catch (error) {
      message.error('Failed to save location');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('locations', id);
      message.success('Location deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete location');
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (newValue === record[dataIndex]) return;
    try {
      await updateInventory('locations', record.id, { [dataIndex]: newValue });
      message.success('Location updated');
      setLocations(prev => prev.map(l => l.id === record.id ? { ...l, [dataIndex]: newValue } : l));
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
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{ marginBottom: 16 }}
        >
          Add Location
        </Button>
        <Table
          columns={columns}
          dataSource={locations}
          loading={loading}
          rowKey="id"
        />
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
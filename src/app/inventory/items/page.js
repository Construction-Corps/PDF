'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';

const { Option } = Select;

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [qrcodes, setQrcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrValue, setSelectedQrValue] = useState(null);

  const itemTypes = ['TOOL', 'SUPPLY', 'EQUIPMENT'];
  const itemConditions = ['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, locationsData, qrcodesData] = await Promise.all([
        fetchInventory('items'),
        fetchInventory('locations'),
        fetchInventory('qrcodes')
      ]);
      setItems(itemsData);
      setLocations(locationsData);

      // Filter out QR codes that are already associated with an item
      const assignedQrCodeIds = itemsData.map(item => item.qr_code).filter(Boolean);
      const availableQrcodes = qrcodesData.filter(qr => !assignedQrCodeIds.includes(qr.id));
      setQrcodes(availableQrcodes);

    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        storage_location: item.storage_location?.id,
        qr_code: item.qr_code,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await updateInventory('items', editingItem.id, values);
        message.success('Item updated successfully');
      } else {
        await createInventory('items', values);
        message.success('Item created successfully');
      }
      handleCancel();
      fetchData();
    } catch (error) {
      message.error('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('items', id);
      message.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete item');
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (newValue === record[dataIndex]) return;
    try {
      await updateInventory('items', record.id, { [dataIndex]: newValue });
      message.success('Item updated');
      setItems(prev => prev.map(it => it.id === record.id ? { ...it, [dataIndex]: newValue } : it));
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
    return (
      <span onClick={() => setEditingCell({ id: record.id, dataIndex })} style={{ cursor: 'pointer' }}>
        {text || '—'}
      </span>
    );
  };

  const editableNumberRender = (dataIndex) => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === dataIndex) {
      return (
        <Input
          type="number"
          defaultValue={text}
          autoFocus
          onBlur={(e) => handleCellSave(record, dataIndex, Number(e.target.value))}
          onPressEnter={(e) => handleCellSave(record, dataIndex, Number(e.target.value))}
        />
      );
    }
    return (
      <span onClick={() => setEditingCell({ id: record.id, dataIndex })} style={{ cursor: 'pointer' }}>
        {text}
      </span>
    );
  };

  const editableSelectRender = (dataIndex, optionsArray) => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === dataIndex) {
      return (
        <Select
          defaultValue={text}
          style={{ width: 120 }}
          onBlur={() => setEditingCell(null)}
          onChange={(value) => handleCellSave(record, dataIndex, value)}
          options={optionsArray.map(o => ({ value: o, label: o }))}
          autoFocus
          open
        />
      );
    }
    return (
      <span onClick={() => setEditingCell({ id: record.id, dataIndex })} style={{ cursor: 'pointer' }}>
        {text}
      </span>
    );
  };

  const openQr = (val) => {
    setSelectedQrValue(val);
    setQrModalOpen(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: editableTextRender('name') },
    { title: 'Category', dataIndex: 'category', key: 'category', render: editableTextRender('category') },
    { title: 'Type', dataIndex: 'item_type', key: 'item_type', render: editableSelectRender('item_type', itemTypes) },
    { title: 'Condition', dataIndex: 'condition', key: 'condition', render: editableSelectRender('condition', itemConditions) },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: editableNumberRender('quantity') },
    { title: 'Storage Location', dataIndex: ['storage_location', 'name'], key: 'storage_location' },
    { title: 'Last Known', dataIndex: ['last_known_location', 'location_name'], key: 'last_known_location', render: (name, record) => name || '—' },
    { title: 'QR Code', dataIndex: 'qr_code', key: 'qr_code', render: (val) => val ? <Button icon={<QrcodeOutlined />} onClick={() => openQr(val)}/> : '—' },
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
          Add Item
        </Button>
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          rowKey="id"
        />
        <Modal
          title={editingItem ? 'Edit Item' : 'Add Item'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose
        >
          <Form form={form} layout="vertical" name="item_form">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea />
            </Form.Item>
            <Form.Item name="category" label="Category">
              <Input />
            </Form.Item>
            <Form.Item name="item_type" label="Item Type" rules={[{ required: true }]}>
              <Select>
                {itemTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
              <Select>
                {itemConditions.map(cond => <Option key={cond} value={cond}>{cond}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="storage_location" label="Storage Location">
              <Select allowClear>
                {locations.map(loc => <Option key={loc.id} value={loc.id}>{loc.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="qr_code" label="QR Code">
              <Select allowClear>
                {editingItem && editingItem.qr_code && 
                  <Option key={editingItem.qr_code} value={editingItem.qr_code}>{editingItem.qr_code}</Option>
                }
                {qrcodes.map(qr => <Option key={qr.id} value={qr.id}>{qr.id}</Option>)}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
        <QRCodeModal open={qrModalOpen} onCancel={() => setQrModalOpen(false)} qrCodeValue={selectedQrValue} />
      </div>
    </ProtectedRoute>
  );
};

export default ItemsPage; 
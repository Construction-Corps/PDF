'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';
import QRLabel from '../../../components/QRLabel';
import { generatePrintSheet } from '../../../utils/printUtils';

const { Option } = Select;

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [qrcodes, setQrcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrValue, setSelectedQrValue] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printForm] = Form.useForm();

  const itemTypes = ['TOOL', 'SUPPLY', 'EQUIPMENT'];
  const itemConditions = ['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, locationsData, categoriesData, qrcodesData] = await Promise.all([
        fetchInventory('items'),
        fetchInventory('locations'),
        fetchInventory('categories'),
        fetchInventory('qrcodes')
      ]);
      setItems(itemsData);
      setLocations(locationsData);
      setCategories(categoriesData);

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
        category_id: item.category?.id,
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
    if (dataIndex === 'storage_location') {
      if (newValue === record.storage_location?.id) return;
      try {
        await updateInventory('items', record.id, { storage_location: newValue });
        message.success('Item updated');
        // Update the state with the new location object
        const newLocation = locations.find(loc => loc.id === newValue);
        setItems(prev => prev.map(it => it.id === record.id ? { ...it, storage_location: newLocation } : it));
      } catch (error) {
        message.error('Update failed');
      }
    } else if (dataIndex === 'category') {
      if (newValue === record.category?.id) return;
      try {
        await updateInventory('items', record.id, { category_id: newValue });
        message.success('Item updated');
        // Update the state with the new category object
        const newCategory = categories.find(cat => cat.id === newValue);
        setItems(prev => prev.map(it => it.id === record.id ? { ...it, category: newCategory } : it));
      } catch (error) {
        message.error('Update failed');
      }
    } else {
      if (newValue === record[dataIndex]) return;
      try {
        await updateInventory('items', record.id, { [dataIndex]: newValue });
        message.success('Item updated');
        setItems(prev => prev.map(it => it.id === record.id ? { ...it, [dataIndex]: newValue } : it));
      } catch (error) {
        message.error('Update failed');
      }
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
    return text;
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
    return text;
  };

  const editableLocationRender = () => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === 'storage_location') {
      return (
        <Select
          defaultValue={record.storage_location?.id}
          style={{ width: 150 }}
          onBlur={() => setEditingCell(null)}
          onChange={(value) => handleCellSave(record, 'storage_location', value)}
          options={locations.map(loc => ({ value: loc.id, label: loc.name }))}
          allowClear
          autoFocus
          open
        />
      );
    }
    return text || '—';
  };

  const editableCategoryRender = () => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === 'category') {
      return (
        <Select
          defaultValue={record.category?.id}
          style={{ width: 150 }}
          onBlur={() => setEditingCell(null)}
          onChange={(value) => handleCellSave(record, 'category', value)}
          options={categories.map(cat => ({ 
            value: cat.id, 
            label: cat.parent_name ? `${cat.parent_name} → ${cat.name}` : cat.name 
          }))}
          allowClear
          autoFocus
          open
        />
      );
    }
    return text || '—';
  };

  const openQr = (val) => {
    setSelectedQrValue(val);
    setQrModalOpen(true);
  };

  const showPrintModal = () => {
    printForm.setFieldsValue({ rows: 3, columns: 3, padding: 0.0 });
    setIsPrintModalVisible(true);
  };

  const handlePrintModalCancel = () => {
    setIsPrintModalVisible(false);
  };

  const handlePrint = async () => {
    try {
      const values = await printForm.validateFields();
      const { rows, columns, padding } = values;
      const selectedItems = items.filter(item => selectedRowKeys.includes(item.id));
      
      message.loading({ content: 'Generating PDF...', key: 'pdf' });

      await generatePrintSheet({ items: selectedItems, rows, columns, padding });
      
      message.success({ content: 'PDF generated successfully!', key: 'pdf', duration: 2 });
      
      const qrCodesToUpdate = selectedItems
        .filter(item => item.qr_code && item.qr_code.id && !item.qr_code.is_printed)
        .map(item => item.qr_code.id);

      if (qrCodesToUpdate.length > 0) {
        message.loading({ content: `Marking ${qrCodesToUpdate.length} QR code(s) as printed...`, key: 'update_qr' });
        try {
            const updatePromises = qrCodesToUpdate.map(qrId => 
              updateInventory('qrcodes', qrId, { is_printed: true })
            );
            await Promise.all(updatePromises);
            message.success({ content: 'QR codes marked as printed.', key: 'update_qr', duration: 2 });
            fetchData(); // Refresh data
        } catch (updateError) {
            console.error('Failed to update QR code status:', updateError);
            message.error({ content: 'Failed to mark QR codes as printed.', key: 'update_qr', duration: 2 });
        }
      }

      setIsPrintModalVisible(false);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      message.error({ content: 'Failed to generate PDF', key: 'pdf', duration: 2 });
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
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
      title: 'Category', 
      key: 'category',
      render: (_, record) => {
        const categoryDisplay = record.category 
          ? (record.category.parent_name ? `${record.category.parent_name} → ${record.category.name}` : record.category.name)
          : '—';
        return editableCategoryRender()(categoryDisplay, record);
      },
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'category') {
            setEditingCell({ id: record.id, dataIndex: 'category' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Type', 
      dataIndex: 'item_type', 
      key: 'item_type', 
      render: editableSelectRender('item_type', itemTypes),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'item_type') {
            setEditingCell({ id: record.id, dataIndex: 'item_type' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Condition', 
      dataIndex: 'condition', 
      key: 'condition', 
      render: editableSelectRender('condition', itemConditions),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'condition') {
            setEditingCell({ id: record.id, dataIndex: 'condition' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Quantity', 
      dataIndex: 'quantity', 
      key: 'quantity', 
      render: editableNumberRender('quantity'),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'quantity') {
            setEditingCell({ id: record.id, dataIndex: 'quantity' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'Storage Location', 
      dataIndex: ['storage_location', 'name'], 
      key: 'storage_location',
      render: editableLocationRender(),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'storage_location') {
            setEditingCell({ id: record.id, dataIndex: 'storage_location' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { title: 'Last Known', dataIndex: ['last_known_location', 'short_name'], key: 'last_known_location', render: (name, record) => name || '—' },
    { title: 'QR Code', dataIndex: 'qr_code', key: 'qr_code', render: (qr) => qr && qr.id ? <Button icon={<QrcodeOutlined />} onClick={() => openQr(qr.id)}/> : '—' },
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
        <Button
          type="primary"
          onClick={showPrintModal}
          disabled={!selectedRowKeys.length}
          style={{ marginLeft: 8 }}
        >
          Generate Print Sheet ({selectedRowKeys.length})
        </Button>
        <Table
          rowSelection={rowSelection}
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
            <Form.Item name="category_id" label="Category">
              <Select allowClear placeholder="Select a category">
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.parent_name ? `${cat.parent_name} → ${cat.name}` : cat.name}
                  </Option>
                ))}
              </Select>
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
        <Modal
          title="Configure Print Sheet"
          open={isPrintModalVisible}
          onOk={handlePrint}
          onCancel={handlePrintModalCancel}
          okText="Generate PDF"
        >
          <Form form={printForm} layout="vertical" name="print_form">
            <Form.Item name="rows" label="Rows per page" rules={[{ required: true }]}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="columns" label="Columns per page" rules={[{ required: true }]}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="padding" label="Page Padding (inches)" rules={[{ required: true }]}>
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
        <QRCodeModal open={qrModalOpen} onCancel={() => setQrModalOpen(false)} qrCodeValue={selectedQrValue} />
      </div>
    </ProtectedRoute>
  );
};

export default ItemsPage; 
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';

const { Option } = Select;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const categoriesData = await fetchInventory('categories');
      setCategories(categoriesData);
    } catch (error) {
      message.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (categories) => {
    return categories.map(cat => ({
      title: cat.name,
      value: cat.id,
      key: cat.id,
      children: categories.filter(child => child.parent === cat.id).length > 0 
        ? buildCategoryTree(categories.filter(child => child.parent === cat.id))
        : undefined
    })).filter(cat => !categories.find(c => c.id === cat.value)?.parent);
  };

  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        name: category.name,
        parent: category.parent
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await updateInventory('categories', editingCategory.id, values);
        message.success('Category updated successfully');
      } else {
        await createInventory('categories', values);
        message.success('Category created successfully');
      }
      handleCancel();
      fetchData();
    } catch (error) {
      if (error.message.includes('circular dependency')) {
        message.error('Cannot create circular dependency - a category cannot be its own ancestor');
      } else {
        message.error('Failed to save category');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('categories', id);
      message.success('Category deleted successfully');
      fetchData();
    } catch (error) {
      if (error.message.includes('referenced')) {
        message.error('Cannot delete category - it is being used by items or has subcategories');
      } else {
        message.error('Failed to delete category');
      }
    }
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    if (dataIndex === 'parent') {
      if (newValue === record.parent) return;
      try {
        await updateInventory('categories', record.id, { parent: newValue });
        message.success('Category updated');
        fetchData(); // Refresh to get updated parent_name
      } catch (error) {
        if (error.message.includes('circular dependency')) {
          message.error('Cannot create circular dependency - a category cannot be its own ancestor');
        } else {
          message.error('Update failed');
        }
      }
    } else {
      if (newValue === record[dataIndex]) return;
      try {
        await updateInventory('categories', record.id, { [dataIndex]: newValue });
        message.success('Category updated');
        setCategories(prev => prev.map(cat => cat.id === record.id ? { ...cat, [dataIndex]: newValue } : cat));
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

  const editableParentRender = () => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === 'parent') {
      // Filter out self and descendants to prevent circular dependencies
      const availableParents = categories.filter(cat => {
        if (cat.id === record.id) return false; // Can't be parent of itself
        // TODO: Add more sophisticated circular dependency checking if needed
        return true;
      });
      
      return (
        <Select
          defaultValue={record.parent}
          style={{ width: 150 }}
          onBlur={() => setEditingCell(null)}
          onChange={(value) => handleCellSave(record, 'parent', value)}
          options={availableParents.map(cat => ({ value: cat.id, label: cat.name }))}
          allowClear
          autoFocus
          open
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
      title: 'Parent Category', 
      dataIndex: 'parent_name', 
      key: 'parent_name',
      render: editableParentRender(),
      onCell: (record) => ({
        onClick: () => {
          if (!editingCell || editingCell.id !== record.id || editingCell.dataIndex !== 'parent') {
            setEditingCell({ id: record.id, dataIndex: 'parent' });
          }
        },
        style: { cursor: 'pointer' }
      })
    },
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 80
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

  const categoryTreeData = buildCategoryTree(categories);

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Categories</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{ marginBottom: 16 }}
        >
          Add Category
        </Button>
        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="id"
        />
        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose
        >
          <Form form={form} layout="vertical" name="category_form">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="e.g., Power Tools" />
            </Form.Item>
            <Form.Item name="parent" label="Parent Category">
              <TreeSelect
                treeData={categoryTreeData}
                placeholder="Select parent category (optional)"
                allowClear
                showSearch
                treeDefaultExpandAll
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default CategoriesPage; 
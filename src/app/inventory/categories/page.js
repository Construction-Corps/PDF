'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Input, Select, message, TreeSelect, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import InventoryTable from '../../../components/InventoryTable';

const { Option } = Select;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [editingCell, setEditingCell] = useState(null);
  const [parentSearchValue, setParentSearchValue] = useState('');
  const [dataManager, setDataManager] = useState(null);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  const fetchSupportingData = async () => {
    try {
      const categoriesData = await fetchInventory('categories');
      setCategories(categoriesData);
    } catch (error) {
      message.error('Failed to fetch categories');
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

  const createNewParentCategory = async (name) => {
    try {
      const newCategory = await createInventory('categories', { name });
      setCategories(prev => [...prev, newCategory]);
      if (dataManager) {
        dataManager.addItem(newCategory);
      }
      setParentSearchValue('');
      return newCategory.id;
    } catch (error) {
      message.error('Failed to create category');
      throw error;
    }
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
      // Ensure parent is null if not selected (instead of undefined)
      const payload = {
        ...values,
        parent: values.parent || null
      };
      
      if (editingCategory) {
        const updatedCategory = await updateInventory('categories', editingCategory.id, payload);
        message.success('Category updated successfully');
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        ));
        if (dataManager) {
          dataManager.updateItem(editingCategory.id, updatedCategory);
        }
      } else {
        const newCategory = await createInventory('categories', payload);
        message.success('Category created successfully');
        setCategories(prev => [...prev, newCategory]);
        if (dataManager) {
          dataManager.addItem(newCategory);
        }
      }
      handleCancel();
      fetchSupportingData();
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
      setCategories(prev => prev.filter(cat => cat.id !== id));
      if (dataManager) {
        dataManager.removeItem(id);
      }
      fetchSupportingData();
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
      const currentParent = record.parent || null;
      const newParent = newValue || null;
      if (newParent === currentParent) return;
      
      try {
        const updatedCategory = await updateInventory('categories', record.id, { parent: newParent });
        message.success('Category updated');
        setCategories(prev => prev.map(cat => cat.id === record.id ? updatedCategory : cat));
        if (dataManager) {
          dataManager.updateItem(record.id, updatedCategory);
        }
        fetchSupportingData();
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
        const updatedCategory = await updateInventory('categories', record.id, { [dataIndex]: newValue });
        message.success('Category updated');
        setCategories(prev => prev.map(cat => cat.id === record.id ? updatedCategory : cat));
        if (dataManager) {
          dataManager.updateItem(record.id, updatedCategory);
        }
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
      const availableParents = categories.filter(cat => {
        if (cat.id === record.id) return false;
        return cat.name.toLowerCase().includes(parentSearchValue.toLowerCase());
      });
      
      return (
        <Select
          defaultValue={record.parent}
          style={{ width: 200 }}
          onBlur={() => {
            setEditingCell(null);
            setParentSearchValue('');
          }}
          onChange={async (value) => {
            if (value === 'CREATE_NEW') {
              try {
                const newParentId = await createNewParentCategory(parentSearchValue);
                handleCellSave(record, 'parent', newParentId);
              } catch (error) {
                // Error handled in createNewParentCategory
              }
            } else {
              handleCellSave(record, 'parent', value);
            }
          }}
          onSearch={(value) => setParentSearchValue(value)}
          showSearch
          filterOption={false}
          allowClear
          autoFocus
          open
          dropdownRender={(menu) => (
            <>
              {menu}
              {parentSearchValue && !availableParents.some(cat => cat.name.toLowerCase() === parentSearchValue.toLowerCase()) && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#1890ff'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={async () => {
                                              try {
                          const newParentId = await createNewParentCategory(parentSearchValue);
                          handleCellSave(record, 'parent', newParentId);
                        } catch (error) {
                          // Error handled in createNewParentCategory
                        }
                    }}
                  >
                    <PlusOutlined /> Create "{parentSearchValue}"
                  </div>
                </>
              )}
            </>
          )}
        >
          {availableParents.map(cat => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>
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
      title: 'Parent Category', 
      dataIndex: 'parent_name', 
      key: 'parent_name',
      sorter: true,
      filters: categories
        .filter(cat => categories.some(child => child.parent === cat.id))
        .map(cat => ({ text: cat.name, value: cat.id })),
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
      width: 80,
      sorter: true
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

  const extraFilters = [
    {
      key: 'parent__isnull',
      label: 'Category Type',
      type: 'select',
      options: [
        { value: 'true', label: 'Root Categories (No Parent)' },
        { value: 'false', label: 'Sub Categories (Has Parent)' }
      ]
    },
    {
      key: 'parent',
      label: 'Parent Category',
      type: 'select',
      options: categories
        .filter(cat => categories.some(child => child.parent === cat.id))
        .map(cat => ({ value: cat.id, label: cat.name }))
    }
  ];

  const additionalActions = [
    <Button
      key="add"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => showModal()}
    >
      Add Category
    </Button>
  ];

  const categoryTreeData = buildCategoryTree(categories);

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h1>Categories</h1>
        
        <InventoryTable
          resource="categories"
          columns={columns}
          searchPlaceholder="Search categories by name, parent category..."
          extraFilters={extraFilters}
          additionalActions={additionalActions}
          onDataChange={setDataManager}
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
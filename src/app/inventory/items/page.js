'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, InputNumber, Divider, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory, fetchCategoryTree } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';
import QRLabel from '../../../components/QRLabel';
import { generatePrintSheet } from '../../../utils/printUtils';

const { Option } = Select;

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
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
  const [categorySearchValue, setCategorySearchValue] = useState('');
  const [locationSearchValue, setLocationSearchValue] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [categoryForm] = Form.useForm();
  const [locationForm] = Form.useForm();

  const itemTypes = ['TOOL', 'SUPPLY', 'EQUIPMENT'];
  const itemConditions = ['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, locationsData, categoriesData, categoryTreeData, qrcodesData] = await Promise.all([
        fetchInventory('items'),
        fetchInventory('locations'),
        fetchInventory('categories'),
        fetchCategoryTree(),
        fetchInventory('qrcodes')
      ]);
      setItems(itemsData);
      setLocations(locationsData);
      setCategories(categoriesData);
      setCategoryTree(categoryTreeData);

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

  const createNewCategory = async (name) => {
    try {
      const newCategory = await createInventory('categories', { name });
      setCategories(prev => [...prev, newCategory]);
      // Refresh category tree to include the new category
      const updatedCategoryTree = await fetchCategoryTree();
      setCategoryTree(updatedCategoryTree);
      setCategorySearchValue('');
      return newCategory;
    } catch (error) {
      message.error('Failed to create category');
      throw error;
    }
  };

  const createNewLocation = async (name) => {
    try {
      const newLocation = await createInventory('locations', { name });
      setLocations(prev => [...prev, newLocation]);
      setLocationSearchValue('');
      return newLocation;
    } catch (error) {
      message.error('Failed to create location');
      throw error;
    }
  };

  // Helper function to get category display path
  const getCategoryDisplayPath = (categoryId) => {
    if (!categoryId || !categories.length) return '—';
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '—';
    return category.parent_name ? `${category.parent_name} → ${category.name}` : category.name;
  };

  // Helper function to flatten tree data for search
  const flattenTreeData = (treeData) => {
    const flattened = [];
    const flatten = (nodes) => {
      nodes.forEach(node => {
        flattened.push(node);
        if (node.children) {
          flatten(node.children);
        }
      });
    };
    flatten(treeData);
    return flattened;
  };

  // Category modal handlers
  const showCategoryModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      categoryForm.setFieldsValue({
        name: category.name,
        parent: category.parent
      });
    } else {
      categoryForm.resetFields();
    }
    setIsCategoryModalVisible(true);
  };

  const handleCategoryModalOk = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (editingCategory) {
        await updateInventory('categories', editingCategory.id, values);
        message.success('Category updated successfully');
      } else {
        await createInventory('categories', values);
        message.success('Category created successfully');
      }
      setIsCategoryModalVisible(false);
      setEditingCategory(null);
      categoryForm.resetFields();
      
      // Refresh data
      const [categoriesData, categoryTreeData] = await Promise.all([
        fetchInventory('categories'),
        fetchCategoryTree()
      ]);
      setCategories(categoriesData);
      setCategoryTree(categoryTreeData);
    } catch (error) {
      if (error.message.includes('circular dependency')) {
        message.error('Cannot create circular dependency - a category cannot be its own ancestor');
      } else {
        message.error('Failed to save category');
      }
    }
  };

  const handleCategoryModalCancel = () => {
    setIsCategoryModalVisible(false);
    setEditingCategory(null);
    categoryForm.resetFields();
  };

  // Location modal handlers
  const showLocationModal = (location = null) => {
    setEditingLocation(location);
    if (location) {
      locationForm.setFieldsValue({
        name: location.name,
        description: location.description
      });
    } else {
      locationForm.resetFields();
    }
    setIsLocationModalVisible(true);
  };

  const handleLocationModalOk = async () => {
    try {
      const values = await locationForm.validateFields();
      if (editingLocation) {
        await updateInventory('locations', editingLocation.id, values);
        message.success('Location updated successfully');
      } else {
        await createInventory('locations', values);
        message.success('Location created successfully');
      }
      setIsLocationModalVisible(false);
      setEditingLocation(null);
      locationForm.resetFields();
      
      // Refresh locations data
      const locationsData = await fetchInventory('locations');
      setLocations(locationsData);
    } catch (error) {
      message.error('Failed to save location');
    }
  };

  const handleLocationModalCancel = () => {
    setIsLocationModalVisible(false);
    setEditingLocation(null);
    locationForm.resetFields();
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    setCategorySearchValue('');
    setLocationSearchValue('');
    
    if (dataIndex === 'storage_location') {
      if (newValue === record.storage_location?.id) return;
      try {
        await updateInventory('items', record.id, { storage_location: newValue });
        message.success('Item updated');
        // Update the state with the new location object - get fresh state
        setItems(prev => prev.map(it => {
          if (it.id === record.id) {
            const newLocation = locations.find(loc => loc.id === newValue);
            return { ...it, storage_location: newLocation };
          }
          return it;
        }));
      } catch (error) {
        message.error('Update failed');
      }
    } else if (dataIndex === 'category') {
      if (newValue === record.category?.id) return;
      try {
        await updateInventory('items', record.id, { category_id: newValue });
        message.success('Item updated');
        // Update the state with the new category object - get fresh state  
        setItems(prev => prev.map(it => {
          if (it.id === record.id) {
            const newCategory = categories.find(cat => cat.id === newValue);
            return { ...it, category: newCategory };
          }
          return it;
        }));
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
      const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(locationSearchValue.toLowerCase())
      );
      
      return (
        <Select
          defaultValue={record.storage_location?.id}
          style={{ width: 200 }}
          onBlur={() => {
            setEditingCell(null);
            setLocationSearchValue('');
          }}
          onChange={async (value) => {
            if (value === 'CREATE_NEW') {
              try {
                const newLocation = await createNewLocation(locationSearchValue);
                // Update the item directly with the new location object
                setEditingCell(null);
                setLocationSearchValue('');
                await updateInventory('items', record.id, { storage_location: newLocation.id });
                message.success('Item updated');
                setItems(prev => prev.map(it => 
                  it.id === record.id ? { ...it, storage_location: newLocation } : it
                ));
              } catch (error) {
                // Error handled in createNewLocation
              }
            } else {
              handleCellSave(record, 'storage_location', value);
            }
          }}
          onSearch={(value) => setLocationSearchValue(value)}
          showSearch
          filterOption={false}
          allowClear
          autoFocus
          open
          dropdownRender={(menu) => (
            <>
              {menu}
              {locationSearchValue && !filteredLocations.some(loc => loc.name.toLowerCase() === locationSearchValue.toLowerCase()) && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#1890ff'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                         onClick={async () => {
                       try {
                         const newLocation = await createNewLocation(locationSearchValue);
                         // Update the item directly with the new location object
                         setEditingCell(null);
                         setLocationSearchValue('');
                         await updateInventory('items', record.id, { storage_location: newLocation.id });
                         message.success('Item updated');
                         setItems(prev => prev.map(it => 
                           it.id === record.id ? { ...it, storage_location: newLocation } : it
                         ));
                       } catch (error) {
                         // Error handled in createNewLocation
                       }
                     }}
                  >
                    <PlusOutlined /> Create "{locationSearchValue}"
                  </div>
                </>
              )}
            </>
          )}
        >
          {filteredLocations.map(loc => (
            <Option key={loc.id} value={loc.id}>{loc.name}</Option>
          ))}
        </Select>
      );
    }
    return text || '—';
  };

    const editableCategoryRender = () => (text, record) => {
    if (editingCell && editingCell.id === record.id && editingCell.dataIndex === 'category') {
      return (
        <TreeSelect
          treeData={categoryTree}
          value={record.category?.id}
          style={{ width: 300 }}
          onBlur={() => {
            setEditingCell(null);
            setCategorySearchValue('');
          }}
          onChange={async (value) => {
            if (value === 'CREATE_NEW') {
              try {
                const newCategory = await createNewCategory(categorySearchValue);
                // Update the item directly with the new category object
                setEditingCell(null);
                setCategorySearchValue('');
                await updateInventory('items', record.id, { category_id: newCategory.id });
                message.success('Item updated');
                setItems(prev => prev.map(it => 
                  it.id === record.id ? { ...it, category: newCategory } : it
                ));
              } catch (error) {
                // Error handled in createNewCategory
              }
            } else {
              handleCellSave(record, 'category', value);
            }
          }}
          onSearch={(value) => setCategorySearchValue(value)}
          showSearch
          filterTreeNode={(input, node) =>
            node.title.toLowerCase().includes(input.toLowerCase())
          }
          allowClear
          autoFocus
          open
          treeDefaultExpandAll
          dropdownRender={(menu) => (
            <>
              {menu}
              {categorySearchValue && !categories.some(cat => cat.name.toLowerCase() === categorySearchValue.toLowerCase()) && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#1890ff'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    onClick={async () => {
                      try {
                        const newCategory = await createNewCategory(categorySearchValue);
                        // Update the item directly with the new category object
                        setEditingCell(null);
                        setCategorySearchValue('');
                        await updateInventory('items', record.id, { category_id: newCategory.id });
                        message.success('Item updated');
                        setItems(prev => prev.map(it => 
                          it.id === record.id ? { ...it, category: newCategory } : it
                        ));
                      } catch (error) {
                        // Error handled in createNewCategory
                      }
                    }}
                  >
                    <PlusOutlined /> Create "{categorySearchValue}"
                  </div>
                </>
              )}
            </>
          )}
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
      title: 'Category', 
      key: 'category',
      render: (_, record) => {
        const categoryDisplay = getCategoryDisplayPath(record.category?.id);
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
              <Input.Group compact>
                <TreeSelect
                  treeData={categoryTree}
                  placeholder="Select or create a category"
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  style={{ width: 'calc(100% - 32px)' }}
                  filterTreeNode={(input, node) =>
                    node.title.toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={(value) => setCategorySearchValue(value)}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {categorySearchValue && !categories.some(cat => cat.name.toLowerCase() === categorySearchValue.toLowerCase()) && (
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
                                const newCategory = await createNewCategory(categorySearchValue);
                                form.setFieldValue('category_id', newCategory.id);
                              } catch (error) {
                                // Error handled in createNewCategory
                              }
                            }}
                          >
                            <PlusOutlined /> Create "{categorySearchValue}"
                          </div>
                        </>
                      )}
                    </>
                  )}
                />
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => {
                    const currentCategoryId = form.getFieldValue('category_id');
                    if (currentCategoryId) {
                      // Edit existing category
                      const currentCategory = categories.find(cat => cat.id === currentCategoryId);
                      showCategoryModal(currentCategory);
                    } else {
                      // Add new category
                      showCategoryModal(null);
                    }
                  }}
                  style={{ width: '32px' }}
                  title={form.getFieldValue('category_id') ? "Edit Selected Category" : "Add New Category"}
                />
              </Input.Group>
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
              <Input.Group compact>
                <Select 
                  allowClear
                  placeholder="Select or create a location"
                  showSearch
                  style={{ width: 'calc(100% - 32px)' }}
                  filterOption={(input, option) => 
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={(value) => setLocationSearchValue(value)}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {locationSearchValue && !locations.some(loc => loc.name.toLowerCase() === locationSearchValue.toLowerCase()) && (
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
                                const newLocation = await createNewLocation(locationSearchValue);
                                form.setFieldValue('storage_location', newLocation.id);
                              } catch (error) {
                                // Error handled in createNewLocation
                              }
                            }}
                          >
                            <PlusOutlined /> Create "{locationSearchValue}"
                          </div>
                        </>
                      )}
                    </>
                  )}
                >
                  {locations.map(loc => <Option key={loc.id} value={loc.id}>{loc.name}</Option>)}
                </Select>
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => {
                    const currentLocationId = form.getFieldValue('storage_location');
                    if (currentLocationId) {
                      // Edit existing location
                      const currentLocation = locations.find(loc => loc.id === currentLocationId);
                      showLocationModal(currentLocation);
                    } else {
                      // Add new location
                      showLocationModal(null);
                    }
                  }}
                  style={{ width: '32px' }}
                  title={form.getFieldValue('storage_location') ? "Edit Selected Location" : "Add New Location"}
                />
              </Input.Group>
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
        
        {/* Category Edit Modal */}
        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          open={isCategoryModalVisible}
          onOk={handleCategoryModalOk}
          onCancel={handleCategoryModalCancel}
          destroyOnClose
        >
          <Form form={categoryForm} layout="vertical" name="category_form">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="e.g., Power Tools" />
            </Form.Item>
            <Form.Item name="parent" label="Parent Category">
              <TreeSelect
                treeData={categoryTree}
                placeholder="Select parent category (optional)"
                allowClear
                showSearch
                treeDefaultExpandAll
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Location Edit Modal */}
        <Modal
          title={editingLocation ? 'Edit Location' : 'Add Location'}
          open={isLocationModalVisible}
          onOk={handleLocationModalOk}
          onCancel={handleLocationModalCancel}
          destroyOnClose
        >
          <Form form={locationForm} layout="vertical" name="location_form">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="e.g., Warehouse A" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea placeholder="Optional description of the location" />
            </Form.Item>
          </Form>
        </Modal>
        
        <QRCodeModal open={qrModalOpen} onCancel={() => setQrModalOpen(false)} qrCodeValue={selectedQrValue} />
      </div>
    </ProtectedRoute>
  );
};

export default ItemsPage; 
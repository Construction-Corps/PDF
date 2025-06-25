'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, InputNumber, Divider, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, updateInventory, deleteInventory, fetchCategoryTree, generateQRCode } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';
import QRLabel from '../../../components/QRLabel';
import ItemEditModal from '../../../components/ItemEditModal';
import { generatePrintSheet } from '../../../utils/printUtils';

const { Option } = Select;

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [qrcodes, setQrcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrValue, setSelectedQrValue] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printForm] = Form.useForm();
  const [categorySearchValue, setCategorySearchValue] = useState('');
  const [locationSearchValue, setLocationSearchValue] = useState('');

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

  const showEditModal = (item) => {
    setEditingItem(item);
    setIsEditModalVisible(true);
  };

  const showAddModal = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingItem(null);
  };

  const handleEditModalSuccess = () => {
    fetchData(); // Refresh the items list
  };

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields();
      await createInventory('items', values);
      message.success('Item created successfully');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to create item');
    }
  };

  const handleAddCancel = () => {
    setIsAddModalVisible(false);
    addForm.resetFields();
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

  const handleGenerateQRCode = async (itemId) => {
    try {
      const result = await generateQRCode(itemId);
      // Update the item in state with the new QR code
      setItems(prev => prev.map(item => 
        item.id === itemId ? result.item : item
      ));
      return result.item;
    } catch (error) {
      // Error already handled by the InventoryApi utility
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

  // Update callbacks for ItemEditModal
  const handleCategoriesUpdate = async (newCategory, updatedCategoryTree) => {
    if (newCategory) {
      setCategories(prev => [...prev.filter(cat => cat.id !== newCategory.id), newCategory]);
    }
    if (updatedCategoryTree) {
      setCategoryTree(updatedCategoryTree);
    }
    // Refresh all data to be safe
    const [categoriesData, categoryTreeData] = await Promise.all([
      fetchInventory('categories'),
      fetchCategoryTree()
    ]);
    setCategories(categoriesData);
    setCategoryTree(categoryTreeData);
  };

  const handleLocationsUpdate = async (newLocation) => {
    if (newLocation) {
      setLocations(prev => [...prev.filter(loc => loc.id !== newLocation.id), newLocation]);
    }
    // Refresh locations data
    const locationsData = await fetchInventory('locations');
    setLocations(locationsData);
  };

  const handleCellSave = async (record, dataIndex, newValue) => {
    setEditingCell(null);
    setCategorySearchValue('');
    setLocationSearchValue('');
    
    if (dataIndex === 'storage_location') {
      if (newValue === record.storage_location?.id) return;
      try {
        await updateInventory('items', record.id, { storage_location_id: newValue });
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
                await updateInventory('items', record.id, { storage_location_id: newLocation.id });
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
                         await updateInventory('items', record.id, { storage_location_id: newLocation.id });
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
    { title: 'QR Code', dataIndex: 'qr_code', key: 'qr_code', render: (qr, record) => {
        if (qr && qr.id) {
          return <Button icon={<QrcodeOutlined />} onClick={() => openQr(qr.id)} />;
                 } else {
           return <Button icon={<PlusOutlined />} onClick={() => handleGenerateQRCode(record.id)}>Add</Button>;
         }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>Edit</Button>
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
          onClick={showAddModal}
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
          title="Add Item"
          open={isAddModalVisible}
          onOk={handleAddOk}
          onCancel={handleAddCancel}
          destroyOnClose
        >
          <Form form={addForm} layout="vertical" name="add_item_form">
            <Form.Item name="name" label="Item Name" rules={[{ required: true, message: 'Please enter item name' }]}>
              <Input placeholder="Enter item name" autoFocus />
            </Form.Item>
          </Form>
        </Modal>
        
        <ItemEditModal
          open={isEditModalVisible}
          onCancel={handleEditModalClose}
          onSuccess={handleEditModalSuccess}
          item={editingItem}
          categories={categories}
          categoryTree={categoryTree}
          locations={locations}
          qrcodes={qrcodes}
          itemTypes={itemTypes}
          itemConditions={itemConditions}
          onCategoriesUpdate={handleCategoriesUpdate}
          onLocationsUpdate={handleLocationsUpdate}
        />
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
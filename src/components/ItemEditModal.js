import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, TreeSelect, Divider, Button, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { createInventory, updateInventory, fetchCategoryTree } from '../utils/InventoryApi';
import CategoryModal from './CategoryModal';
import LocationModal from './LocationModal';

const { Option } = Select;

const ItemEditModal = ({
  open,
  onCancel,
  onSuccess,
  item,
  categories,
  categoryTree,
  locations,
  qrcodes,
  itemTypes,
  itemConditions,
  onCategoriesUpdate,
  onLocationsUpdate
}) => {
  const [form] = Form.useForm();
  const [categorySearchValue, setCategorySearchValue] = useState('');
  const [locationSearchValue, setLocationSearchValue] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    if (open && item) {
      form.setFieldsValue({
        ...item,
        storage_location_id: item.storage_location?.id,
        category_id: item.category?.id,
        qr_code_id: item.qr_code?.id,
      });
    }
  }, [open, item, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await updateInventory('items', item.id, values);
      message.success('Item updated successfully');
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      message.error('Failed to save item');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCategorySearchValue('');
    setLocationSearchValue('');
    onCancel();
  };

  const createNewCategory = async (name) => {
    try {
      const newCategory = await createInventory('categories', { name });
      const updatedCategoryTree = await fetchCategoryTree();
      onCategoriesUpdate && onCategoriesUpdate(newCategory, updatedCategoryTree);
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
      onLocationsUpdate && onLocationsUpdate(newLocation);
      setLocationSearchValue('');
      return newLocation;
    } catch (error) {
      message.error('Failed to create location');
      throw error;
    }
  };

  const showCategoryModal = (category = null) => {
    setEditingCategory(category);
    setIsCategoryModalVisible(true);
  };

  const handleCategoryModalSuccess = async (updatedCategory) => {
    const updatedCategoryTree = await fetchCategoryTree();
    onCategoriesUpdate && onCategoriesUpdate(updatedCategory, updatedCategoryTree);
    if (updatedCategory) {
      form.setFieldValue('category_id', updatedCategory.id);
    }
  };

  const handleCategoryModalCancel = () => {
    setIsCategoryModalVisible(false);
    setEditingCategory(null);
  };

  const showLocationModal = (location = null) => {
    setEditingLocation(location);
    setIsLocationModalVisible(true);
  };

  const handleLocationModalSuccess = async (updatedLocation) => {
    onLocationsUpdate && onLocationsUpdate(updatedLocation);
    if (updatedLocation) {
      form.setFieldValue('storage_location_id', updatedLocation.id);
    }
  };

  const handleLocationModalCancel = () => {
    setIsLocationModalVisible(false);
    setEditingLocation(null);
  };

  return (
    <>
      <Modal
        title="Edit Item"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
        width={600}
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
                    const currentCategory = categories.find(cat => cat.id === currentCategoryId);
                    showCategoryModal(currentCategory);
                  } else {
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
          <Form.Item name="storage_location_id" label="Storage Location">
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
                            form.setFieldValue('storage_location_id', newLocation.id);
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
                  const currentLocationId = form.getFieldValue('storage_location_id');
                  if (currentLocationId) {
                    const currentLocation = locations.find(loc => loc.id === currentLocationId);
                    showLocationModal(currentLocation);
                  } else {
                    showLocationModal(null);
                  }
                }}
                style={{ width: '32px' }}
                title={form.getFieldValue('storage_location_id') ? "Edit Selected Location" : "Add New Location"}
              />
            </Input.Group>
          </Form.Item>
          <Form.Item name="qr_code_id" label="QR Code">
            <Select allowClear>
              {item && item.qr_code && 
                <Option key={item.qr_code.id} value={item.qr_code.id}>{item.qr_code.id}</Option>
              }
              {qrcodes.map(qr => <Option key={qr.id} value={qr.id}>{qr.id}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      <CategoryModal
        open={isCategoryModalVisible}
        onCancel={handleCategoryModalCancel}
        category={editingCategory}
        categoryTree={categoryTree}
        onSuccess={handleCategoryModalSuccess}
      />

      <LocationModal
        open={isLocationModalVisible}
        onCancel={handleLocationModalCancel}
        location={editingLocation}
        onSuccess={handleLocationModalSuccess}
      />
    </>
  );
};

export default ItemEditModal; 
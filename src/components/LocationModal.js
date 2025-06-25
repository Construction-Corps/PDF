import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createInventory, updateInventory } from '../utils/InventoryApi';

const LocationModal = ({ 
  open, 
  onCancel, 
  location = null, 
  onSuccess 
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      if (location) {
        form.setFieldsValue({
          name: location.name,
          description: location.description
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, location, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      let updatedLocation;
      if (location) {
        updatedLocation = await updateInventory('locations', location.id, values);
        message.success('Location updated successfully');
      } else {
        updatedLocation = await createInventory('locations', values);
        message.success('Location created successfully');
      }
      form.resetFields();
      onSuccess && onSuccess(updatedLocation);
      onCancel();
    } catch (error) {
      message.error(`Failed to ${location ? 'update' : 'create'} location`);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={location ? 'Edit Location' : 'Add Location'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="location_form">
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., Warehouse A" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Optional description of the location" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LocationModal; 
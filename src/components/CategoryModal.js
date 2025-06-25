import React from 'react';
import { Modal, Form, Input, TreeSelect, message } from 'antd';
import { createInventory, updateInventory, fetchInventory, fetchCategoryTree } from '../utils/InventoryApi';

const CategoryModal = ({ 
  open, 
  onCancel, 
  category = null, 
  categoryTree = [], 
  onSuccess 
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      if (category) {
        form.setFieldsValue({
          name: category.name,
          parent: category.parent
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, category, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (category) {
        await updateInventory('categories', category.id, values);
        message.success('Category updated successfully');
      } else {
        await createInventory('categories', values);
        message.success('Category created successfully');
      }
      form.resetFields();
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      message.error(`Failed to ${category ? 'update' : 'create'} category`);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={category ? 'Edit Category' : 'Add Category'}
      open={open}
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
            treeData={categoryTree}
            placeholder="Select parent category (optional)"
            allowClear
            showSearch
            treeDefaultExpandAll
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryModal; 
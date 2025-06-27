'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, Select, message, Tag, Popover } from 'antd';
import { PlusOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, deleteInventory, fetchUsers } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import InventoryTable from '../../../components/InventoryTable';
import QRCodeModal from '../../../components/QRCodeModal';

const { Option } = Select;

const DeviceRegistrationTokensPage = () => {
  const [users, setUsers] = useState([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [qrModalValue, setQrModalValue] = useState(null);
  const [form] = Form.useForm();
  const [dataManager, setDataManager] = useState(null);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  const fetchSupportingData = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
      console.error(error);
      message.warn('Could not fetch users. Token creation will be disabled.');
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = { 
        user: values.user_id,
      };

      const newToken = await createInventory('device-registration-tokens', payload);
      message.success('Token created successfully');
      setCreateModalVisible(false);
      // Add new token to table
      if (dataManager) {
        dataManager.addItem(newToken);
      }
    } catch (error) {
      message.error('Failed to create token');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('device-registration-tokens', id);
      message.success('Token deleted successfully');
      // Remove token from table
      if (dataManager) {
        dataManager.removeItem(id);
      }
    } catch (error) {
      message.error('Failed to delete token');
    }
  };
  
  const columns = [
    { 
      title: 'Token ID', 
      dataIndex: 'id', 
      key: 'id',
      sorter: true,
      render: (id) => (
        <Space>
          <Popover content={id} title="Token ID" trigger="hover">
            <span>{`${id.substring(0, 8)}...`}</span>
          </Popover>
          <Button icon={<QrcodeOutlined />} onClick={() => setQrModalValue(id)} />
        </Space>
      )
    },
    { 
      title: 'User', 
      key: 'user',
      sorter: true,
      render: (_, record) => {
        const user = users.find(u => u.id === record.user);
        return user ? (user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email) : '—';
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}/>
      ),
    },
  ];

  const extraFilters = [
    {
      key: 'user',
      label: 'User',
      type: 'multiselect',
      options: users.map(u => ({
        value: u.id,
        label: u.first_name || u.last_name ? 
          `${u.first_name} ${u.last_name}`.trim() : 
          u.email
      }))
    }
  ];

  const additionalActions = [
    <Button
      key="create"
      type="primary"
      icon={<PlusOutlined />}
      onClick={showCreateModal}
      disabled={users.length === 0}
    >
      Generate New Token
    </Button>
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Device Registration Tokens</h2>
        
        <InventoryTable
          resource="device-registration-tokens"
          columns={columns}
          searchPlaceholder="Search tokens by user..."
          extraFilters={extraFilters}
          additionalActions={additionalActions}
          onDataChange={setDataManager}
        />
        
        <Modal
          title="Generate Registration Token"
          open={isCreateModalVisible}
          onOk={handleCreate}
          onCancel={() => setCreateModalVisible(false)}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="user_id" label="User" rules={[{ required: true }]}>
              <Select placeholder="Select a user">
                {users.map(u => <Option key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}</Option>)}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
        <QRCodeModal
          open={!!qrModalValue}
          onCancel={() => setQrModalValue(null)}
          qrCodeValue={qrModalValue}
          title="Device Registration QR Code"
          register={true}
        />
      </div>
    </ProtectedRoute>
  );
};

export default DeviceRegistrationTokensPage;
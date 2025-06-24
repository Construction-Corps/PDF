'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Select, message, Tag, Popover } from 'antd';
import { PlusOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, deleteInventory, fetchUsers } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';

const { Option } = Select;

const DeviceRegistrationTokensPage = () => {
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [qrModalValue, setQrModalValue] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tokensData, usersData] = await Promise.all([
        fetchInventory('device-registration-tokens'),
        fetchUsers()
      ]);
      setTokens(tokensData);
      setUsers(usersData);
    } catch (error) {
        console.error(error);
        try {
            const tokensData = await fetchInventory('device-registration-tokens');
            setTokens(tokensData);
            message.warn('Could not fetch users. Token creation will be disabled.');
        } catch (tokensError) {
            message.error('Failed to fetch registration tokens.');
        }
    } finally {
      setLoading(false);
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

      await createInventory('device-registration-tokens', payload);
      message.success('Token created successfully');
      setCreateModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Failed to create token');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('device-registration-tokens', id);
      message.success('Token deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete token');
    }
  };
  
  const columns = [
    { 
      title: 'Token ID', 
      dataIndex: 'id', 
      key: 'id',
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
      render: (_, record) => {
        const user = users.find(u => u.id === record.user);
        return user ? (user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email) : '—';
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h2>Device Registration Tokens</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
          style={{ marginBottom: 16 }}
          disabled={users.length === 0}
        >
          Generate New Token
        </Button>
        <Table
          columns={columns}
          dataSource={tokens}
          loading={loading}
          rowKey="id"
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
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Select, Button, message, Card, Spin, Typography, Result } from 'antd';
import { getDeviceId } from '../../utils/deviceId';
import { registerDeviceWithToken, quickRegisterDevice, fetchPublicUsers } from '../../utils/InventoryApi';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const RegistrationContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [deviceId, setDeviceId] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, form, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    // If a token is present in the URL, attempt to register automatically
    if (token && id) {
      const register = async () => {
        try {
          await registerDeviceWithToken(token, id, 'Registered via Token');
          setStatus('success');
        } catch (error) {
          setErrorMessage(error.message || 'Failed to register device with token.');
          setStatus('error');
        }
      };
      register();
    } else {
      // Otherwise, show the quick registration form and fetch users
      setStatus('form');
      const loadUsers = async () => {
        try {
          const usersData = await fetchPublicUsers();
          setUsers(usersData);
        } catch (error) {
          message.error('Could not load user list.');
        }
      };
      loadUsers();
    }
  }, [token]);

  const handleQuickRegister = async (values) => {
    if (!deviceId) {
      message.error("Device ID could not be determined. Please refresh and try again.");
      return;
    }
    setStatus('loading');
    try {
      await quickRegisterDevice(values.user_id, deviceId, 'Registered via Quick Form');
      setStatus('success');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to register device.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spin size="large" tip="Processing Registration..." /></div>;
  }
  
  if (status === 'success') {
    return <Result status="success" title="Device Successfully Registered!" subTitle="You can now close this window and continue scanning." />;
  }
  
  if (status === 'error') {
    return <Result status="error" title="Registration Failed" subTitle={errorMessage} />;
  }

  return (
    <div style={{ maxWidth: 500, margin: '100px auto' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center' }}>Register This Device</Title>
        <Paragraph style={{ textAlign: 'center' }}>
          To track inventory, you must associate this device with your user account.
        </Paragraph>
        <Form form={form} onFinish={handleQuickRegister} layout="vertical">
          <Form.Item name="user_id" label="Select Your Name" rules={[{ required: true, message: 'Please select your name' }]}>
            <Select showSearch placeholder="Find your name in the list" optionFilterProp="children">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={status === 'loading'}>
              Register Device
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const RegisterDevicePage = () => (
  <Suspense fallback={<Spin size="large" />}>
    <RegistrationContent />
  </Suspense>
);


export default RegisterDevicePage; 
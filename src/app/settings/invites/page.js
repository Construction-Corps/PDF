'use client'

import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Card, Alert, Select } from 'antd';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

export default function InviteUserPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const { user } = useAuth(); // Only get what's needed, or nothing if not used

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        message.error('Authentication required to fetch roles.');
        setRolesLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://ccbe.onrender.com/api/auth/roles/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setRoles(response.data || []);
      } catch (err) {
        console.error("Fetch Roles Error:", err);
        message.error('Failed to load roles. Please try again.');
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleSendInvite = async (values) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('authToken'); // Get token from localStorage

    if (!token) {
        message.error('Authentication token not found. Please log in again.');
        setError('Authentication required.');
        setLoading(false);
        return;
    }

    const params = {
        email: values.email
    };
    if (values.roleId) {
        params.role = values.roleId;
    } else {
        params.role = 2;
    } 

    try {
        const response = await axios.get('https://ccbe.onrender.com/api/auth/invite/', {
            params: params,
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        if (response.status === 200) {
            message.success(`Invitation sent successfully to ${values.email}`);
            form.resetFields();
        } else {
            message.error('Failed to send invitation. Unexpected response.');
            setError('An unexpected error occurred.');
        }

    } catch (err) {
        console.error("Send Invite Error:", err);
        if (err.response && err.response.data) {
            const backendError = err.response.data.detail || err.response.data.error || JSON.stringify(err.response.data);
            setError(`Failed to send invite: ${backendError}`);
            message.error(`Failed to send invite: ${backendError}`);
        } else {
            setError('Failed to send invite. Check the console for details.');
            message.error('Failed to send invite. Please check network connection or backend logs.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card bordered={false}>
      <Title level={3}>Invite New User</Title>
      <Paragraph>
        Enter the email address of the user you want to invite. They will receive an email with instructions to create their account and set a password.
      </Paragraph>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendInvite}
        style={{ maxWidth: '400px' }}
      >
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Please input the email address!' },
            { type: 'email', message: 'Please enter a valid email address!' }
          ]}
        >
          <Input placeholder="new.user@example.com" />
        </Form.Item>

        <Form.Item
          label="Assign Role (Optional)"
          name="roleId"
        >
          <Select placeholder="Select a role" loading={rolesLoading} allowClear>
            {roles.map(role => (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {error && (
            <Form.Item>
                <Alert message={error} type="error" showIcon />
            </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Send Invitation
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
} 
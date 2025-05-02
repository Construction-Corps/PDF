'use client'

import { useState } from 'react';
import { Form, Input, Button, message, Typography, Card, Alert } from 'antd';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path as necessary

const { Title, Paragraph } = Typography;

export default function InviteUserPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getToken } = useAuth(); // Use useAuth to get the token

  const handleSendInvite = async (values) => {
    setLoading(true);
    setError('');
    const token = getToken(); // Retrieve the auth token

    if (!token) {
        message.error('Authentication token not found. Please log in again.');
        setError('Authentication required.');
        setLoading(false);
        return; 
    }

    try {
        const response = await axios.get('https://ccbe.onrender.com/api/auth/invite/', {
            params: {
                email: values.email
            },
            headers: {
                'Authorization': `Token ${token}` // Include the token in the header
            }
        });

        if (response.status === 200) {
            message.success(`Invitation sent successfully to ${values.email}`);
            form.resetFields();
        } else {
            // Should ideally not happen if backend returns proper errors
            message.error('Failed to send invitation. Unexpected response.');
            setError('An unexpected error occurred.');
        }

    } catch (err) {
        console.error("Send Invite Error:", err);
        if (err.response && err.response.data) {
            const backendError = err.response.data.detail || err.response.data.error || JSON.stringify(err.response.data); // Try to get specific error
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
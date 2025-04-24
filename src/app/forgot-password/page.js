'use client'

import { useState } from 'react'
import { Layout, Form, Input, Button, Card, message, Alert } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import ThemeSwitch from '../components/ThemeSwitch' // Assuming ThemeSwitch is shareable

const { Content } = Layout

export default function ForgotPasswordPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      // Use the corrected API path prefix /api/auth/
      const response = await axios.post('https://ccbe.onrender.com/api/auth/password_reset/', {
        email: values.email,
      })
      
      if (response.status === 200 && response.data.status === 'OK') {
        setSuccess(true)
        message.success('If an account exists for this email, a password reset link has been sent.')
        form.resetFields()
      } else {
         // Handle cases where the API might return 200 but not the expected status
         setError('An unexpected error occurred. Please try again.')
         message.error('An unexpected error occurred.')
      }
    } catch (err) {
        console.error("Password Reset Request Error:", err);
        if (err.response && err.response.data) {
            // Attempt to display backend error messages if available
            const backendErrors = Object.values(err.response.data).flat().join(' ');
            setError(`Request failed: ${backendErrors || err.message}`);
            message.error(`Request failed: ${backendErrors || err.message}`);
        } else {
            setError('Failed to send password reset request. Please check your network connection and try again.')
            message.error('Failed to send password reset request.')
        }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
        <Card title="Forgot Password" style={{ width: 400, background: 'var(--card-background)' }}>
          {success ? (
            <Alert
              message="Check Your Email"
              description="If an account with that email exists, we have sent a password reset link."
              type="success"
              showIcon
              style={{ marginBottom: '20px' }}
            />
          ) : (
             <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <p style={{ marginBottom: '20px', color: 'var(--foreground-secondary)' }}>
                    Enter the email address associated with your account, and we'll send you a link to reset your password.
                </p>
                <Form.Item
                  label={<span style={{ color: 'var(--foreground)' }}>Email</span>}
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email address!' }
                  ]}
                >
                  <Input placeholder="you@example.com" />
                </Form.Item>

                {error && (
                  <Form.Item>
                    <Alert message={error} type="error" showIcon />
                  </Form.Item>
                )}

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Send Reset Link
                  </Button>
                </Form.Item>
             </Form>
          )}
           <div style={{ textAlign: 'center', marginTop: '20px' }}>
             <Link href="/login" style={{ color: 'var(--primary-color)' }}>Back to Login</Link>
           </div>
        </Card>
      </Content>
    </Layout>
  )
} 
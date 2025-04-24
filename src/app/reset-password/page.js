'use client'

import { useState, useEffect, Suspense } from 'react'
import { Layout, Form, Input, Button, Card, message, Alert, Spin } from 'antd'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitch from '../components/ThemeSwitch' // Adjust path as needed

const { Content } = Layout

function ResetPasswordContent() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token found in URL.')
        setIsTokenValid(false)
        setIsValidatingToken(false)
        message.error('Invalid or missing reset link.')
        return
      }
      
      setIsValidatingToken(true)
      setError('')
      try {
        // Use the corrected API path prefix /api/auth/
        await axios.post('https://ccbe.onrender.com/api/auth/password_reset/validate_token/', {
          token: token,
        })
        setIsTokenValid(true)
        message.success('Token is valid. Please enter your new password.')
      } catch (err) {
        console.error("Token Validation Error:", err);
        setError('Invalid or expired password reset link. Please request a new one.')
        setIsTokenValid(false)
        message.error('Invalid or expired password reset link.')
      } finally {
        setIsValidatingToken(false)
      }
    }

    validateToken()
  }, [token]) // Rerun validation if token changes

  const onFinish = async (values) => {
    if (!token) {
      setError('Missing token.')
      message.error('Cannot reset password without a valid token.')
      return
    }
    if (values.password !== values.confirmPassword) {
        setError('Passwords do not match.');
        message.error('Passwords do not match.');
        return; 
    }

    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      // Use the corrected API path prefix /api/auth/
      const response = await axios.post('https://ccbe.onrender.com/api/auth/password_reset/confirm/', {
        token: token,
        password: values.password,
      })

      if (response.status === 200 && response.data.status === 'OK') {
        setSuccess(true)
        message.success('Password has been reset successfully! Redirecting to login...')
        form.resetFields()
        setTimeout(() => {
          router.push('/login')
        }, 2000) // Redirect after 2 seconds
      } else {
        setError('An unexpected error occurred while resetting the password.')
        message.error('An unexpected error occurred.')
      }
    } catch (err) {
      console.error("Password Reset Confirm Error:", err);
      if (err.response && err.response.data) {
         const backendErrors = Object.values(err.response.data).flat().join(' ');
         setError(`Reset failed: ${backendErrors || err.message}`);
         message.error(`Reset failed: ${backendErrors || 'Please check password requirements.'}`);
      } else {
         setError('Failed to reset password. Please try again.')
         message.error('Failed to reset password.')
      } 
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (isValidatingToken) {
        return <Spin tip="Validating link..." size="large"><div style={{ minHeight: '200px' }} /></Spin>;
    }

    if (!isTokenValid) {
        return (
            <>
                <Alert
                    message="Invalid Link"
                    description={error || 'This password reset link is invalid or has expired. Please request a new one.'}
                    type="error"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />
                <Link href="/forgot-password" style={{ color: 'var(--primary-color)' }}>Request a new link</Link>
            </>
        );
    }
    
    if (success) {
        return (
            <Alert
              message="Password Reset Successful"
              description="Your password has been updated. You will be redirected to the login page shortly."
              type="success"
              showIcon
            />
        );
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
        >
            <Form.Item
                label={<span style={{ color: 'var(--foreground)' }}>New Password</span>}
                name="password"
                rules={[{ required: true, message: 'Please input your new password!' }]} // Add more specific rules if needed
                hasFeedback
            >
                <Input.Password placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
                label={<span style={{ color: 'var(--foreground)' }}>Confirm New Password</span>}
                name="confirmPassword"
                dependencies={['password']}
                hasFeedback
                rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                        },
                    }),
                ]}
            >
                <Input.Password placeholder="Confirm new password" />
            </Form.Item>

            {error && (
                <Form.Item>
                    <Alert message={error} type="error" showIcon />
                </Form.Item>
            )}

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    Reset Password
                </Button>
            </Form.Item>
             <div style={{ textAlign: 'center', marginTop: '20px' }}>
               <Link href="/login" style={{ color: 'var(--primary-color)' }}>Back to Login</Link>
             </div>
        </Form>
    );
  }

  return renderContent();
}

export default function ResetPasswordPage() {
  return (
    // Wrap with Suspense because useSearchParams requires it
    <Suspense fallback={<Spin tip="Loading page..."><div style={{ minHeight: '100vh' }} /></Spin>}>
      <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <ThemeSwitch />
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
          <Card title="Set New Password" style={{ width: 400, background: 'var(--card-background)' }}>
            <ResetPasswordContent />
          </Card>
        </Content>
      </Layout>
    </Suspense>
  )
}
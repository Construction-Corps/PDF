'use client'

import { useState, useEffect, Suspense } from 'react'
import { Layout, Form, Input, Button, Card, message, Alert, Spin } from 'antd'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitch from '../components/ThemeSwitch' // Adjust path if needed

const { Content } = Layout

// Need Suspense boundary for useSearchParams
function AcceptInviteContent() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  useEffect(() => {
    if (!token) {
        setError('No invitation token found in the URL. Please ensure you clicked the correct link.');
        message.error('Invalid or missing invitation link.');
    }
  }, [token]);

  const onFinish = async (values) => {
    if (!token) {
      setError('Missing invitation token.')
      message.error('Cannot create account without a valid invitation token.')
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
      // Use the correct API endpoint and include the base URL
      const response = await axios.post('https://ccbe.onrender.com/api/auth/accept-invite/', {
        token: token,
        password: values.password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Expecting 201 Created for success
      if (response.status === 201) { 
        setSuccess(true)
        message.success('Account created successfully! Redirecting to login...')
        form.resetFields()
        setTimeout(() => {
          router.push('/login')
        }, 3000) // Redirect after 3 seconds
      } else {
         // Handle unexpected success status codes if necessary
         setError(`Unexpected response status: ${response.status}. Please try again.`)
         message.error('An unexpected error occurred.')
      }
    } catch (err) {
      console.error("Accept Invite Error:", err);
      if (err.response && err.response.data) {
         // Attempt to extract specific error messages from the backend response
         const backendErrors = Object.values(err.response.data).flat().join(' ');
         setError(`Account creation failed: ${backendErrors || err.message}`);
         message.error(`Account creation failed: ${backendErrors || 'Please check the details and try again.'}`);
      } else {
         setError('Failed to create account. Please check your network connection or try again later.')
         message.error('Failed to create account.')
      } 
    } finally {
      setLoading(false)
    }
  }

  // Display error if token is missing from the start
  if (!token) {
      return (
          <Alert
            message="Invalid Invitation Link"
            description={error || 'The invitation link is missing required information. Please use the link provided in your email.'}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
      );
  }
  
  if (success) {
      return (
          <Alert
            message="Account Created Successfully!"
            description="Your account is ready. You will be redirected to the login page shortly."
            type="success"
            showIcon
          />
      );
  }

  // Render the form if token exists and not yet successful
  return (
      <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
      >
          <p style={{ marginBottom: '20px', color: 'var(--foreground-secondary)' }}>
              Welcome! Please set a password for your new account.
          </p>
          <Form.Item
              label={<span style={{ color: 'var(--foreground)' }}>Password</span>}
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                // Add Django's default minimum length or other backend rules if known
                { min: 8, message: 'Password must be at least 8 characters long.'} 
              ]}
              hasFeedback
          >
              <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
              label={<span style={{ color: 'var(--foreground)' }}>Confirm Password</span>}
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                  { required: true, message: 'Please confirm your password!' },
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
              <Input.Password placeholder="Confirm password" />
          </Form.Item>

          {error && (
              <Form.Item>
                  <Alert message={error} type="error" showIcon />
              </Form.Item>
          )}

          <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                  Create Account
              </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
               <Link href="/login" style={{ color: 'var(--primary-color)' }}>Already have an account? Login</Link>
          </div>
      </Form>
  );
}


export default function AcceptInvitePage() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
        <Card title="Accept Invitation" style={{ width: 400, background: 'var(--card-background)' }}>
           <Suspense fallback={<Spin tip="Loading invitation details..."><div style={{ minHeight: '200px' }} /></Spin>}>
              <AcceptInviteContent />
           </Suspense>
        </Card>
      </Content>
    </Layout>
  )
} 
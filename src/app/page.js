'use client'

import { Layout, Card, Button } from 'antd'
import Link from 'next/link'
import ThemeSwitch from './components/ThemeSwitch'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

const { Content } = Layout

export default function DirectoryPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ padding: '50px' }}>
        <h1 style={{ color: 'var(--foreground)' }}>Directory</h1>
        
        {isAuthenticated ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card 
              title="Job Map" 
              style={{ marginBottom: '20px' }}
              extra={<Link href="/job-map">Open →</Link>}
            >
              View all jobs on an interactive map
            </Card>
            <Card 
              title="Payment Schedule" 
              style={{ marginBottom: '20px' }}
              extra={<Link href="/payment-schedule">Open →</Link>}
            >
              Calculate payment schedule
            </Card>
            <Card 
              title="Job Checklist" 
              style={{ marginBottom: '20px' }}
              extra={<Link href="/job-checklist">Open →</Link>}
            >
              View all jobs on a checklist
            </Card>
            <Card 
              title="Job Kanban - Stage" 
              style={{ marginBottom: '20px' }}
              extra={<Link href="/job-kanban?fieldId=22NwzQcjYUA4">Open →</Link>}
            >
              Manage jobs with drag-and-drop kanban by job stage
            </Card>
            <Card 
              title="Job Kanban - Design Stage" 
              style={{ marginBottom: '20px' }}
              extra={<Link href="/job-kanban?fieldId=22P7Rp2AWjYT">Open →</Link>}
            >
              Manage jobs with drag-and-drop kanban by design stage
            </Card>
            {/* Add more cards here for other sections */}
          </div>
        ) : (
          <div style={{ 
            maxWidth: '600px', 
            margin: '0 auto', 
            textAlign: 'center',
            padding: '40px',
            background: 'var(--card-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2>Welcome to JobTread Tools</h2>
            <p style={{ fontSize: '16px', margin: '20px 0' }}>
              Please login to access the application features.
            </p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
          </div>
        )}
      </Content>
    </Layout>
  )
}

'use client'

import { Layout, Card, Button, Spin } from 'antd'
import Link from 'next/link'
import ThemeSwitch from './components/ThemeSwitch'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

const { Content } = Layout

export default function DirectoryPage() {
  const { isAuthenticated, visibleMenuItems, menuLoading } = useAuth();
  const router = useRouter();
  
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ padding: '50px' }}>
        <h1 style={{ color: 'var(--foreground)' }}>Directory</h1>
        
        {isAuthenticated ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {menuLoading && (
              <div style={{ textAlign: 'center', margin: '40px 0' }}>
                  <Spin size="large" tip="Loading tools..." />
              </div>
            )}

            {!menuLoading && visibleMenuItems.map(item => (
              <Card 
                key={item.url || item.name}
                title={item.name}
                style={{ marginBottom: '20px' }}
                extra={<Link href={item.url}>Open →</Link>}
              >
                Access the {item.name} tool.
              </Card>
            ))}

            {!menuLoading && visibleMenuItems.length === 0 && (
                <Card>
                    No tools available or failed to load.
                </Card>
            )}
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

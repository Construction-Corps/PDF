'use client'

import { Layout, Card } from 'antd'
import Link from 'next/link'
import ThemeSwitch from './components/ThemeSwitch'

const { Content } = Layout

export default function DirectoryPage() {
  
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Content style={{ padding: '50px' }}>
        <h1 style={{ color: 'var(--foreground)' }}>Directory</h1>
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
          {/* Add more cards here for other sections */}
        </div>
      </Content>
    </Layout>
  )
}

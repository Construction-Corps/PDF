'use client'

import { Layout, Card } from 'antd'
import Link from 'next/link'

const { Content } = Layout

export default function DirectoryPage() {
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '50px' }}>
        <h1>Directory</h1>
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
          {/* Add more cards here for other sections */}
        </div>
      </Content>
    </Layout>
  )
}

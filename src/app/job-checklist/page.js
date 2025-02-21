'use client'

import { Layout, Button, Input, Space } from 'antd'

import JobsChecklistPage from './jobChecklist'


const { Header, Content } = Layout
const { Search } = Input

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        height: '0px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
  
      </Header> 
      <Content style={{ 
        overflow: 'auto',
        overflowX: 'auto',
        overflowY: 'auto',
        height: 'calc(100vh - 0px)',
        width: '100%'
      }}>
          <JobsChecklistPage />
      </Content>
    </Layout>
  )
}

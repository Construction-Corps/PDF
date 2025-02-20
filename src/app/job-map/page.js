'use client'

import { Layout, Button, Input, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import JobMap from '@/app/job-map/JobMap'
import { LoadScript } from '@react-google-maps/api'


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
        {/* <h1 style={{ margin: 0 }}>Job Map</h1> */}
        {/* <Space>
          <Search
            placeholder="Search jobs..."
            allowClear
            onSearch={(value) => console.log(value)}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<SearchOutlined />}>
            Advanced Search
          </Button>
        </Space> */}
      </Header>
      <Content>
      <LoadScript googleMapsApiKey={"AIzaSyCK9cfqkPcy_1eqMT-avYHue7CLSCOBqA0"}>
          <JobMap />
        </LoadScript>
      </Content>
    </Layout>
  )
}

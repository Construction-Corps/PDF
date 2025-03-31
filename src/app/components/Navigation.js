'use client';

import { useState } from 'react';
import { Button, Drawer, Menu, Divider } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';

const Navigation = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  return (
    <>
      {/* Hamburger menu button */}
      <Button
        icon={<MenuOutlined />}
        onClick={() => setMenuVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1000
        }}
      />
      
      {/* Navigation drawer */}
      <Drawer
        title="Navigation"
        placement="left"
        closable={true}
        onClose={() => setMenuVisible(false)}
        open={menuVisible}
        width={250}
      >
        <Menu mode="vertical">
          <Menu.Item key="home">
            <Link href="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="job-map">
            <Link href="/job-map">Job Map</Link>
          </Menu.Item>
          <Menu.Item key="payment-schedule">
            <Link href="/payment-schedule">Payment Schedule</Link>
          </Menu.Item>
          <Menu.Item key="job-checklist">
            <Link href="/job-checklist">Job Checklist</Link>
          </Menu.Item>
        </Menu>
        
        <Divider style={{ margin: '24px 0 16px' }} />
        
        <div style={{ padding: '0 16px' }}>
          <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Legal</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/privacy-policy" style={{ color: '#333', fontSize: '14px' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: '#333', fontSize: '14px' }}>
              Terms of Service
            </Link>
            <Link href="/data-deletion" style={{ color: '#333', fontSize: '14px' }}>
              Data Deletion Request
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Navigation; 
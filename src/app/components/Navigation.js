'use client';

import { useState } from 'react';
import { Button, Drawer, Menu } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Link from 'next/link';

const Navigation = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  return (
    <>
      {/* Hamburger menu button */}
      <Button
        icon={<MenuOutlined />}
        onClick={() => setMenuVisible(prev => !prev)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1400
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
      </Drawer>
    </>
  );
};

export default Navigation; 
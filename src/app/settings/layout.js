'use client'

import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserAddOutlined, SettingOutlined } from '@ant-design/icons';
import ThemeSwitch from '../../components/ThemeSwitch'; // Adjust path as necessary
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path

const { Content, Sider } = Layout;

// Define menu items for settings
const settingsMenuItems = [
  {
    key: '/settings/invites',
    icon: <UserAddOutlined />,
    label: 'User Invitations',
    // Add permissions check if needed later: requiresAdmin: true 
  },
  // Add other settings pages here later, e.g.:
  // {
  //   key: '/settings/profile',
  //   icon: <SettingOutlined />,
  //   label: 'Profile',
  // },
];

export default function SettingsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth(); // Get user info for potential permission checks
  const [collapsed, setCollapsed] = useState(false);

  // Determine selected key based on current path
  const selectedKeys = [pathname];

  const handleMenuClick = ({ key }) => {
    router.push(key);
  };

  // Filter menu items based on permissions (example)
  // const accessibleMenuItems = settingsMenuItems.filter(item => {
  //   if (!item.requiresAdmin) return true;
  //   return user?.is_staff; // Adjust based on your user object structure
  // });
  const accessibleMenuItems = settingsMenuItems; // For now, show all

  // Redirect if not logged in or still loading auth state
  // (Could add more robust checks here if needed)
  if (loading) return <Layout style={{ minHeight: '100vh' }}><Spin size="large" /></Layout>; 
  // if (!user && typeof window !== 'undefined') { router.push('/login'); return null; }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ThemeSwitch />
      <Layout>
        <Sider 
           width={220} 
           style={{ background: 'var(--card-background)' }} 
           collapsible 
           collapsed={collapsed} 
           onCollapse={(value) => setCollapsed(value)}
        >
          <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'var(--foreground)', lineHeight: '32px', borderRadius: '4px' }}>
             {collapsed ? 'S' : 'Settings'}
          </div>
          <Menu
            theme={ document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light' } // Basic theme matching
            mode="inline"
            selectedKeys={selectedKeys}
            items={accessibleMenuItems}
            onClick={handleMenuClick}
            style={{ background: 'var(--card-background)', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px', background: 'var(--background)' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: 'var(--card-background)',
              color: 'var(--foreground)',
              borderRadius: '8px'
            }}
          >
            {children} 
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
} 
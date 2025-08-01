'use client';

import React, { useState } from 'react';
import { Card, Typography, Space, Button, message } from 'antd';
import { ShoppingCartOutlined, ScanOutlined, QrcodeOutlined } from '@ant-design/icons';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManualCheckoutModal from '../../../components/ManualCheckoutModal';

const { Title, Paragraph } = Typography;

const ManualCheckoutPage = () => {
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  const handleCheckoutSuccess = (result) => {
    message.success(`Successfully processed ${result.total_processed} items`);
    if (result.errors && result.errors.length > 0) {
      message.warning(`Some items had errors: ${result.errors.join(', ')}`);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <Title level={2}>Manual Inventory Checkout</Title>
        
        <Paragraph>
          Use this tool to manually check out inventory items without scanning QR codes. 
          This is useful for bulk checkouts or when QR codes are not available.
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card 
            title="Manual Checkout" 
            extra={
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />}
                onClick={() => setIsCheckoutModalVisible(true)}
              >
                Start Checkout
              </Button>
            }
          >
            <Paragraph>
              Select multiple items and specify quantities for manual checkout. 
              You can choose the user, location, and action type (Check Out, Check In, or Audit).
            </Paragraph>
            
            <Space>
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />}
                onClick={() => setIsCheckoutModalVisible(true)}
                size="large"
              >
                Manual Checkout
              </Button>
            </Space>
          </Card>

          <Card title="Alternative Methods">
            <Space direction="vertical" size="middle">
              <div>
                <Title level={4}>QR Code Scanning</Title>
                <Paragraph>
                  For individual items, you can scan QR codes directly using the mobile app or web scanner.
                </Paragraph>
                <Space>
                  <Button icon={<ScanOutlined />} onClick={() => window.open('/scan', '_blank')}>
                    Web Scanner
                  </Button>
                  <Button icon={<QrcodeOutlined />} onClick={() => window.open('/inventory/qrcodes', '_blank')}>
                    View QR Codes
                  </Button>
                </Space>
              </div>
              
              <div>
                <Title level={4}>Inventory Management</Title>
                <Paragraph>
                  Manage your inventory items, categories, and locations.
                </Paragraph>
                <Space>
                  <Button onClick={() => window.open('/inventory/items', '_blank')}>
                    Manage Items
                  </Button>
                  <Button onClick={() => window.open('/inventory/categories', '_blank')}>
                    Manage Categories
                  </Button>
                  <Button onClick={() => window.open('/inventory/locations', '_blank')}>
                    Manage Locations
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        </Space>

        {/* Manual Checkout Modal */}
        <ManualCheckoutModal
          open={isCheckoutModalVisible}
          onCancel={() => setIsCheckoutModalVisible(false)}
          onSuccess={handleCheckoutSuccess}
        />
      </div>
    </ProtectedRoute>
  );
};

export default ManualCheckoutPage; 
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, message, Card, Spin, Typography, Result, Row, Col } from 'antd';
import { CheckOutlined, EnterOutlined, AuditOutlined } from '@ant-design/icons';
import { getDeviceId } from '../../utils/deviceId';
import { publicScanItem, fetchInventory } from '../../utils/InventoryApi';

const { Title, Text } = Typography;

const ScanContent = () => {
  const searchParams = useSearchParams();
  const qrId = searchParams.get('qrId');
  
  const [deviceId, setDeviceId] = useState(null);
  const [location, setLocation] = useState(null);
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, ready, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    if (!qrId) {
      setStatus('error');
      setErrorMessage('No QR Code ID was found in the URL. Please scan a valid code.');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos.coords),
        (err) => {
          console.error(err);
          message.error('Could not get location. Please enable location services.');
        }
      );
    }

    const fetchItemDetails = async () => {
        try {
            const allItems = await fetchInventory('items');
            const foundItem = allItems.find(i => i.qr_code === qrId);
            if (foundItem) {
                setItem(foundItem);
                setStatus('ready');
            } else {
                setErrorMessage(`No item found with QR Code: ${qrId}`);
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage('Failed to fetch item details.');
            setStatus('error');
        }
    };

    fetchItemDetails();
  }, [qrId]);

  const handleAction = async (action) => {
    if (!deviceId) {
      message.error("Device is not identified. Please try again.");
      return;
    }
    setActionLoading(true);
    try {
      await publicScanItem(qrId, deviceId, action, location?.latitude, location?.longitude);
      setStatus('success');
    } catch (error) {
        setErrorMessage(error.message || `Failed to perform action: ${action}`);
        setStatus('error');
    } finally {
        setActionLoading(false);
    }
  };

  if (status === 'loading') {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spin size="large" tip="Loading Item..." /></div>;
  }
  
  if (status === 'success') {
    return <Result status="success" title="Scan Successful!" subTitle="The item status has been updated. You can now close this page." />;
  }
  
  if (status === 'error') {
    return <Result status="error" title="Scan Failed" subTitle={errorMessage} />;
  }

  return (
    <div style={{ maxWidth: 500, margin: '100px auto' }}>
      <Card loading={actionLoading}>
        <Title level={3} style={{ textAlign: 'center' }}>{item?.name || 'Scan Item'}</Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Item: {item?.name} ({item?.category})
        </Text>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Button type="primary" icon={<EnterOutlined />} block size="large" onClick={() => handleAction('CHECK_IN')}>
              Check In
            </Button>
          </Col>
          <Col span={24}>
            <Button type="primary" danger icon={<CheckOutlined />} block size="large" onClick={() => handleAction('CHECK_OUT')}>
              Check Out
            </Button>
          </Col>
          <Col span={24}>
            <Button icon={<AuditOutlined />} block size="large" onClick={() => handleAction('AUDIT')}>
              Audit
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const PublicScanPage = () => (
    <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spin size="large" /></div>}>
        <ScanContent />
    </Suspense>
);

export default PublicScanPage; 
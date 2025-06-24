'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, message, Card, Spin, Typography, Result, Row, Col, Tag } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { getDeviceId } from '../../utils/deviceId';
import { publicScanItem, fetchInventory, updateScanAction } from '../../utils/InventoryApi';

const { Title, Text, Paragraph } = Typography;

const ScanContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrId = searchParams.get('qrId');
  
  const [deviceId, setDeviceId] = useState(null);
  const [location, setLocation] = useState(null);
  const [item, setItem] = useState(null);
  const [scanLog, setScanLog] = useState(null);
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

    const performInitialScan = async (currentDeviceId, loc) => {
      try {
        // Fetch item details first to show on the page
        const allItems = await fetchInventory('items');
        const foundItem = allItems.find(i => i.qr_code === qrId);
        if (!foundItem) {
          throw new Error(`No item found with QR Code: ${qrId}`);
        }
        setItem(foundItem);
        
        // Then, perform the automatic scan
        const initialScanLog = await publicScanItem(qrId, currentDeviceId, 'AUTO', loc?.latitude, loc?.longitude);
        setScanLog(initialScanLog);
        setStatus('ready');

      } catch (error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('device not found') || errorMessage.includes('no userdevice matches the given query')) {
          // If device is not registered, redirect to the registration page, passing the QR ID
          router.push(`/register-device?qrId=${qrId}`);
        } else {
          setErrorMessage(error.message || 'An unknown error occurred during the initial scan.');
          setStatus('error');
        }
      }
    };

    if (id) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation(pos.coords);
                performInitialScan(id, pos.coords);
            },
            (err) => {
                console.warn("Could not get location. Proceeding without it.", err);
                message.warn("Could not get location. Proceeding without it.");
                performInitialScan(id, null);
            }
          );
        } else {
          console.warn("Geolocation not supported. Proceeding without it.");
          message.warn("Geolocation not supported. Proceeding without it.");
          performInitialScan(id, null);
        }
    }
  }, [qrId, router]);

  const handleOverride = async () => {
    if (!scanLog) return;
    
    const oppositeAction = scanLog.action === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN';
    setActionLoading(true);
    
    try {
      const updatedLog = await updateScanAction(scanLog.id, oppositeAction);
      setScanLog(updatedLog); // Update the log with the new action
      setStatus('success'); // Show final success message
    } catch (error) {
      setErrorMessage(error.message || `Failed to update scan action.`);
      setStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusTag = (action) => {
    const color = action === 'CHECK_IN' ? 'green' : 'volcano';
    return <Tag color={color}>{action.replace('_', ' ').replace('CHECK','CHECKED')}</Tag>;
  };

  if (status === 'loading') {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spin size="large" tip="Processing Scan..." /></div>;
  }
  
  if (status === 'success') {
    return <Result status="success" title="Action Recorded!" subTitle={<>Item status updated to: {renderStatusTag(scanLog.action)}</>} />;
  }
  
  if (status === 'error') {
    return <Result status="error" title="Scan Failed" subTitle={errorMessage} />;
  }

  return (
    <div style={{ maxWidth: 500, margin: '100px auto' }}>
      <Card loading={actionLoading}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>{item?.name}</Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          {item?.category}
        </Text>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <Paragraph>Scan successful. Current status:</Paragraph>
            <div style={{transform: 'scale(1.5)', display: 'inline-block'}}>
                {renderStatusTag(scanLog.action)}
            </div>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Button icon={<SwapOutlined />} block size="large" onClick={handleOverride}>
              Change to: {scanLog.action === 'CHECK_IN' ? 'Checked Out' : 'Checked In'}
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
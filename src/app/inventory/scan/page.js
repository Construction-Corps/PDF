'use client';

import React, { useState, useEffect } from 'react';
import { Form, Select, Button, message, Card, Radio, Typography, Input } from 'antd';
import { QrcodeOutlined, MobileOutlined, CheckOutlined, EnterOutlined, AuditOutlined, AimOutlined } from '@ant-design/icons';
import { fetchInventory, scanItem } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';

const { Option } = Select;
const { Title, Text } = Typography;

const ScanSimulatorPage = () => {
  const [qrcodes, setQrcodes] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qrData, deviceData] = await Promise.all([
        fetchInventory('qrcodes'),
        fetchInventory('user-devices')
      ]);
      setQrcodes(qrData);
      setDevices(deviceData);
    } catch (error) {
      message.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const { qr_code_id, device_id, action, latitude, longitude } = values;
      await scanItem(qr_code_id, device_id, action, latitude, longitude);
      // Success message is shown by the API call
      form.resetFields(['qr_code_id', 'action']); // Keep device selected for multiple scans
    } catch (error) {
      // Error toast is shown by the API call
      console.error('Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        form.setFieldsValue({ latitude, longitude });
      },
      (err) => {
        console.error(err);
        message.error('Unable to retrieve your location');
      }
    );
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 600, margin: 'auto', paddingTop: 50 }}>
        <Card>
          <Title level={3} style={{ textAlign: 'center' }}>Scan Simulator</Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            This page simulates a mobile device scanning an item's QR code.
          </Text>
          <Form form={form} layout="vertical" onFinish={handleScan}>
            <Form.Item name="device_id" label="Scanning Device" rules={[{ required: true, message: 'Please select a device!' }]}>
              <Select
                showSearch
                placeholder="Select a registered device"
                loading={loading}
                prefix={<MobileOutlined />}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {devices.map(d => (
                  <Option key={d.device_id} value={d.device_id}>
                    {`${d.user?.username || 'Unknown User'}'s Device (${d.name || d.device_id.substring(0,8)})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item name="qr_code_id" label="Item QR Code" rules={[{ required: true, message: 'Please select a QR code!' }]}>
              <Select
                showSearch
                placeholder="Select an item's QR code to scan"
                loading={loading}
                prefix={<QrcodeOutlined />}
                optionFilterProp="children"
                 filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {qrcodes.map(qr => <Option key={qr.id} value={qr.id}>{qr.id}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Please select an action!' }]}>
                <Radio.Group buttonStyle="solid" style={{width: '100%', display: 'flex'}}>
                    <Radio.Button value="CHECK_IN" style={{flex: 1, textAlign: 'center'}}><EnterOutlined /> Check In</Radio.Button>
                    <Radio.Button value="CHECK_OUT" style={{flex: 1, textAlign: 'center'}}><CheckOutlined /> Check Out</Radio.Button>
                    <Radio.Button value="AUDIT" style={{flex: 1, textAlign: 'center'}}><AuditOutlined /> Audit</Radio.Button>
                </Radio.Group>
            </Form.Item>

            <Form.Item label="Latitude" name="latitude" rules={[{ required: true, message: 'Latitude is required' }]}>
              <Input type="number" placeholder="e.g., 32.7767" step="any" />
            </Form.Item>
            <Form.Item label="Longitude" name="longitude" rules={[{ required: true, message: 'Longitude is required' }]}>
              <Input type="number" placeholder="e.g., -96.7970" step="any" />
            </Form.Item>
            <Form.Item>
              <Button icon={<AimOutlined />} onClick={fillCurrentLocation} block style={{ marginBottom: 16 }}>
                Use Current Location
              </Button>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Submit Scan
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ScanSimulatorPage; 
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, message, Card, Select } from 'antd';
import { MobileOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDeviceId } from '../../utils/deviceId';
import { createInventory, fetchPublicUsers } from '../../utils/InventoryApi';

const { Option } = Select;

const RegisterContent = () => {
    const [form] = Form.useForm();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [deviceId, setLocalDeviceId] = useState('');

    useEffect(() => {
        const id = getDeviceId();
        if (id) {
            setLocalDeviceId(id);
        }

        const loadUsers = async () => {
            try {
                const usersData = await fetchPublicUsers();
                setUsers(usersData);
            } catch (error) {
                message.error("Could not load user list. Manual entry is required.");
            }
        };
        loadUsers();
    }, []);

    const handleRegister = async (values) => {
        setLoading(true);
        const deviceIdToRegister = getDeviceId(); // This gets existing or creates a new one
        setLocalDeviceId(deviceIdToRegister);

        const payload = {
            device_id: deviceIdToRegister,
            user: values.user_id,
            name: values.device_name || 'Unnamed Device'
        };

        try {
            await createInventory('user-devices', payload);
            message.success('Device registered successfully!');
            
            const qrId = searchParams.get('qrId');
            if (qrId) {
                // If we came from a scan, go back to it
                router.push(`/scan?qrId=${qrId}`);
            } else {
                // Otherwise, maybe go to a success page or home
                router.push('/');
            }

        } catch (error) {
            const errorMsg = error.message || 'Failed to register device.';
            message.error(errorMsg);
            // If registration fails, remove the newly generated device ID
            // so we can try again with a fresh one.
            if (typeof window !== 'undefined') {
                localStorage.removeItem('deviceId');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ maxWidth: 500, margin: '100px auto' }}>
            <Card>
                <h2 style={{ textAlign: 'center' }}>Register This Device</h2>
                <p style={{ textAlign: 'center', color: '#888' }}>
                    Your device needs to be associated with a user to scan items.
                </p>
                {deviceId && (
                    <p style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                        Your Device ID: {deviceId}
                    </p>
                )}
                <Form form={form} onFinish={handleRegister} layout="vertical">
                    <Form.Item
                        name="user_id"
                        label="Select Your Name"
                        rules={[{ required: true, message: 'Please select your name' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Find your name in the list"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={users.map(u => ({
                                value: u.id,
                                label: `${u.first_name} ${u.last_name}`.trim()
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="device_name"
                        label="Give this device a name (optional)"
                    >
                        <Input prefix={<MobileOutlined />} placeholder="e.g., John's iPhone" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Register Device
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};


const RegisterDevicePage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <RegisterContent />
    </Suspense>
);


export default RegisterDevicePage; 
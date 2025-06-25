'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';

const QrCodesPage = () => {
  const [qrcodes, setQrcodes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState(null);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qrData, itemsData] = await Promise.all([
        fetchInventory('qrcodes'),
        fetchInventory('items')
      ]);
      setQrcodes(qrData);
      setItems(itemsData);
    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createInventory('qrcodes', {});
      message.success('QR Code generated successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to generate QR Code');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('qrcodes', id);
      message.success('QR Code deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete QR Code');
    }
  };
  
  const showQrModal = (qrCode) => {
    setSelectedQrCode(qrCode);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedQrCode(null);
  };
  
  const assignedQrCodes = new Set(items.map(item => item.qr_code));

  const columns = [
    { 
      title: 'QR Code ID', 
      dataIndex: 'id', 
      key: 'id',
      render: (id) => (
        <Space>
          {/* <span>{id}</span> */}
          <Button icon={<QrcodeOutlined />} onClick={() => showQrModal(id)} />
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        assignedQrCodes.has(record.id) ? <Tag color="blue">Assigned</Tag> : <Tag color="green">Available</Tag>
      )
    },
    {
      title: 'Assigned Item',
      key: 'item',
      render: (_, record) => {
        const item = items.find(i => i.qr_code === record.id);
        return item ? item.name : 'N/A';
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          icon={<DeleteOutlined />} 
          danger 
          onClick={() => handleDelete(record.id)}
          disabled={assignedQrCodes.has(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{ marginBottom: 16 }}
        >
          Generate New QR Code
        </Button>
        <Table
          columns={columns}
          dataSource={qrcodes}
          loading={loading}
          rowKey="id"
        />
        <QRCodeModal
          open={isModalVisible}
          onCancel={handleModalCancel}
          qrCodeValue={selectedQrCode}
          register={false}  
        />
      </div>
    </ProtectedRoute>
  );
};

export default QrCodesPage; 
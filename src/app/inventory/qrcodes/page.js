'use client';

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, QrcodeOutlined } from '@ant-design/icons';
import { fetchInventory, createInventory, deleteInventory } from '../../../utils/InventoryApi';
import ProtectedRoute from '../../../components/ProtectedRoute';
import QRCodeModal from '../../../components/QRCodeModal';
import InventoryTable from '../../../components/InventoryTable';

const QrCodesPage = () => {
  const [qrcodes, setQrcodes] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [dataManager, setDataManager] = useState(null);

  useEffect(() => {
    fetchSupportingData();
    fetchQrCodesData();
  }, []);

  const fetchQrCodesData = async () => {
    try {
      const qrcodesData = await fetchInventory('qrcodes');
      setQrcodes(qrcodesData);
    } catch (error) {
      message.error('Failed to fetch QR codes');
    }
  };

  const fetchSupportingData = async () => {
    try {
      const itemsData = await fetchInventory('items');
      setItems(itemsData);
    } catch (error) {
      message.error('Failed to fetch supporting data');
    }
  };

  const handleCreate = async () => {
    try {
      const newQrCode = await createInventory('qrcodes', {});
      message.success('QR Code generated successfully');
      setQrcodes(prev => [...prev, newQrCode]);
      // Add to table data
      if (dataManager) {
        dataManager.addItem(newQrCode);
      }
    } catch (error) {
      message.error('Failed to generate QR Code');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory('qrcodes', id);
      message.success('QR Code deleted successfully');
      setQrcodes(prev => prev.filter(qr => qr.id !== id));
      // Remove from table data
      if (dataManager) {
        dataManager.removeItem(id);
      }
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
      sorter: true,
      render: (id) => (
        <Space>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {id.substring(0, 8)}...
          </span>
          <Button 
            icon={<QrcodeOutlined />} 
            size="small"
            onClick={() => showQrModal(id)} 
          />
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      sorter: true,
      filters: [
        { text: 'Assigned', value: 'assigned' },
        { text: 'Available', value: 'available' },
        { text: 'Printed', value: 'printed' },
        { text: 'Not Printed', value: 'not_printed' }
      ],
      render: (_, record) => (
        <Space>
          {assignedQrCodes.has(record.id) ? 
            <Tag color="blue">Assigned</Tag> : 
            <Tag color="green">Available</Tag>
          }
          {record.is_printed ? 
            <Tag color="orange">Printed</Tag> : 
            <Tag color="gray">Not Printed</Tag>
          }
        </Space>
      )
    },
    {
      title: 'Assigned Item',
      key: 'item',
      render: (_, record) => {
        const item = items.find(i => i.qr_code === record.id);
        return item ? (
          <span>
            <strong>{item.name}</strong>
            {item.category && <span style={{ color: '#666', marginLeft: 8 }}>
              ({item.category.name})
            </span>}
          </span>
        ) : '—';
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          icon={<DeleteOutlined />} 
          danger 
          size="small"
          onClick={() => handleDelete(record.id)}
          disabled={assignedQrCodes.has(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  const extraFilters = [
    {
      key: 'is_printed',
      label: 'Print Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Printed' },
        { value: 'false', label: 'Not Printed' }
      ]
    }
  ];

  const additionalActions = [
    <Button
      key="generate"
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleCreate}
    >
      Generate New QR Code
    </Button>
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: '50px' }}>
        <h1>QR Codes</h1>
        
        <InventoryTable
          resource="qrcodes"
          columns={columns}
          searchPlaceholder="Search QR codes by ID..."
          extraFilters={extraFilters}
          additionalActions={additionalActions}
          onDataChange={setDataManager}
        />

        {/* QR Code Display Modal */}
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
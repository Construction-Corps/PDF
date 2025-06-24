import React from 'react';
import { Modal } from 'antd';
import dynamic from 'next/dynamic';

// Dynamically load react-qr-code only on client side
const QRCode = dynamic(() => import('react-qr-code').then(mod => mod.default), { ssr: false });

const QRCodeModal = ({ open, onCancel, qrCodeValue, title = 'QR Code', register = false }) => {
  // Construct the full URL if it's for registration
  const finalQrValue = register && qrCodeValue 
    ? `${window.location.origin}/register-device?token=${qrCodeValue}`
    : qrCodeValue;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
    >
      {finalQrValue && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Scan this code</p>
          <div style={{ background: 'white', padding: '16px', display: 'inline-block' }}>
            <QRCode value={finalQrValue} size={180} />
          </div>
          <h3 style={{ marginTop: 16, wordBreak: 'break-all' }}>{finalQrValue}</h3>
        </div>
      )}
    </Modal>
  );
};

export default QRCodeModal; 
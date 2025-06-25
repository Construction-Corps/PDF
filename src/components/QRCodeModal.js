import React, { useEffect, useRef } from 'react';
import { Button, Modal } from 'antd';
import QRCode from 'qrcode';
import { CopyOutlined } from '@ant-design/icons';

const QRCodeModal = ({ open, onCancel, qrCodeValue, title = 'QR Code', register = false }) => {
  const canvasRef = useRef(null);
  const baseUrl = 'https://tools.constructioncorps.com';

  const finalQrValue = qrCodeValue
    ? (register
        ? `${baseUrl}/register-device?token=${qrCodeValue}`
        : `${baseUrl}/scan?qrId=${qrCodeValue}`)
    : null;

  useEffect(() => {
    if (finalQrValue && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      QRCode.toCanvas(canvas, finalQrValue, { width: 180, margin: 2 }, (error) => {
        if (error) console.error(error);

        // Center cutout for logo
        const logoSize = 45;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        context.fillStyle = 'white';
        context.fillRect(x, y, logoSize, logoSize);

        // Draw logo
        const logo = new Image();
        logo.src = '/images/cc-logo.webp';
        logo.onload = () => {
          const logoDisplayWidth = 40;
          const logoDisplayHeight = (logo.height / logo.width) * logoDisplayWidth;
          const logoX = (canvas.width - logoDisplayWidth) / 2;
          const logoY = (canvas.height - logoDisplayHeight) / 2;
          context.drawImage(logo, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        };
      });
    }
  }, [finalQrValue]);

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
          <div style={{ background: 'white', paddingTop: '16px', paddingRight: '16px', paddingLeft: '16px', display: 'inline-block' }}>
            <canvas ref={canvasRef} />
          </div>
          <p style={{ marginTop: 0 }}>Property of Construction Corps</p>
          <Button type="link" icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText(finalQrValue)}>Copy</Button>
          <h3 style={{ marginTop: 16, wordBreak: 'break-all' }}>{finalQrValue}</h3>
        </div>
      )}
    </Modal>
  );
};

export default QRCodeModal; 
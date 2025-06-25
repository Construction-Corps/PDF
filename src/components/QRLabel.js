import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRLabel = ({ item, onRendered }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!item) {
      if (onRendered) onRendered();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const qrCodeId = item.qr_code?.id;
    const qrCodeValue = qrCodeId ? `https://tools.constructioncorps.com/scan?qrId=${qrCodeId}` : 'No QR Code Assigned';

    if (!qrCodeId) {
        if(onRendered) onRendered();
        return;
    }

    const context = canvas.getContext('2d');
    
    QRCode.toCanvas(canvas, qrCodeValue, { width: 120, margin: 1 }, (error) => {
      if (error) {
        console.error(error);
        if (onRendered) onRendered();
        return;
      }

      const logoSize = 30;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      context.fillStyle = 'white';
      context.fillRect(x, y, logoSize, logoSize);

      const logo = new Image();
      logo.src = '/images/cc-logo.webp';
      logo.onload = () => {
        const logoDisplayWidth = 28;
        const logoDisplayHeight = (logo.height / logo.width) * logoDisplayWidth;
        const logoX = (canvas.width - logoDisplayWidth) / 2;
        const logoY = (canvas.height - logoDisplayHeight) / 2;
        context.drawImage(logo, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        if (onRendered) onRendered();
      };
      logo.onerror = () => {
        console.error("Logo failed to load.");
        if(onRendered) onRendered();
      }
    });
  }, [item, onRendered]);

  if (!item) {
    return (
      <div style={{
        border: '1px dashed #ccc',
        width: '150px',
        height: '180px',
        display: 'inline-block',
        margin: '5px',
        boxSizing: 'border-box'
      }}></div>
    );
  }

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      textAlign: 'center',
      width: '150px',
      height: '180px',
      display: 'inline-block',
      margin: '5px',
      boxSizing: 'border-box'
    }}>
      {item.qr_code?.id ? <canvas ref={canvasRef} width="120" height="120" /> : <div style={{width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa'}}>No QR</div>}
      <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '12px' }}>{item.name}</div>
      <div style={{ fontSize: '10px' }}>Property of Construction Corps</div>
    </div>
  );
};

export default QRLabel; 
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRLabel = ({ item, onRendered }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // If there's no item, it's a blank placeholder. Signal completion immediately.
    if (!item) {
      if (onRendered) onRendered();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const qrCodeValue = item.qr_code ? `https://tools.constructioncorps.com/scan?qrId=${item.qr_code}` : 'No QR Code Assigned';

    // If there's no QR code for the item, we are done.
    if (!item.qr_code) {
        if(onRendered) onRendered();
        return;
    }

    const context = canvas.getContext('2d');
    
    QRCode.toCanvas(canvas, qrCodeValue, { width: 132, margin: 1 }, (error) => {
      if (error) {
        console.error(error);
        if (onRendered) onRendered(); // Don't hang on error
        return;
      }

      // Center cutout for logo
      const logoSize = 30;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      context.fillStyle = 'white';
      context.fillRect(x, y, logoSize, logoSize);

      // Draw logo
      const logo = new Image();
      logo.src = '/images/cc-logo.webp';
      logo.onload = () => {
        const logoDisplayWidth = 28;
        const logoDisplayHeight = (logo.height / logo.width) * logoDisplayWidth;
        const logoX = (canvas.width - logoDisplayWidth) / 2;
        const logoY = (canvas.height - logoDisplayHeight) / 2;
        context.drawImage(logo, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        if (onRendered) onRendered(); // Signal completion
      };
      logo.onerror = () => {
        console.error("Logo failed to load.");
        if(onRendered) onRendered(); // Don't hang on error
      }
    });
  }, [item, onRendered]);

  if (!item) {
    return (
      <div style={{
        border: '1px dashed #ccc',
        width: '135px',
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
      padding: '0px',
      textAlign: 'center',
      width: '135px',
      height: '180px',
      display: 'inline-block',
      margin: '5px',
      boxSizing: 'border-box'
    }}>
      {item.qr_code ? <canvas ref={canvasRef} width="135" height="135" /> : <div style={{width: 135, height: 135, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa'}}>No QR</div>}
      <div style={{ fontWeight: 'bold', marginTop: '2px', fontSize: '12px' }}>{item.name}</div>
      <div style={{ fontSize: '8px',  }}>Property of Construction Corps</div>
    </div>
  );
};

export default QRLabel; 
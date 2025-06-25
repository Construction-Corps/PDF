import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import QRLabel from '../components/QRLabel';

export const generatePrintSheet = async ({ items, rows, columns, padding = 0.5 }) => {
  const totalCells = rows * columns;
  const printItems = [...items, ...Array(totalCells - items.length).fill(null)];

  const printContainer = document.createElement('div');
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px';
  document.body.appendChild(printContainer);

  let renderCount = 0;
  const renderPromise = new Promise(resolve => {
    const onLabelRendered = () => {
      renderCount++;
      if (renderCount === totalCells) {
        resolve();
      }
    };

    const page = (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1px',
        padding: '1px',
        backgroundColor: 'white',
        width: `${columns * 145}px`
      }}>
        {printItems.map((item, index) => (
          <QRLabel
            key={item ? item.id : `blank-${index}`}
            item={item}
            onRendered={onLabelRendered}
          />
        ))}
      </div>
    );
    
    const tempDiv = document.createElement('div');
    printContainer.appendChild(tempDiv);
    render(page, tempDiv);
  });

  await renderPromise;
  await new Promise(resolve => setTimeout(resolve, 500));

  const canvas = await html2canvas(printContainer.querySelector(':first-child'), {
    scale: 3,
    useCORS: true,
  });

  unmountComponentAtNode(printContainer.querySelector(':first-child'));
  document.body.removeChild(printContainer);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'in',
    format: 'letter'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width / 300;
  const canvasHeight = canvas.height / 300;
  
  const contentWidth = pdfWidth - (2 * padding);
  const contentHeight = pdfHeight - (2 * padding);
  
  const ratio = Math.min(contentWidth / canvasWidth, contentHeight / canvasHeight);
  
  const imgWidth = canvasWidth * ratio;
  const imgHeight = canvasHeight * ratio;
  
  const x = (pdfWidth - imgWidth) / 2;
  const y = (pdfHeight - imgHeight) / 2;
  
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(`qr-sheet-${Date.now()}.pdf`);
}; 
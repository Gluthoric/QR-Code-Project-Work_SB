// src/components/QRCodeGenerator.tsx

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  url: string;
  name: string;
  onNameChange: (newName: string) => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, name, onNameChange }) => {
  const handleDownload = () => {
    const svg = document.getElementById('qr-code') as SVGSVGElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 30;
      ctx?.drawImage(img, 0, 0);

      if (ctx) {
        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(name, canvas.width / 2, canvas.height - 10);
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${name || 'qrcode'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <QRCodeSVG id="qr-code" value={url} size={200} />
      <p className="text-lg font-semibold">Scan to view card list</p>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter QR code name"
        className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs"
      />
      <button
        onClick={handleDownload}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;

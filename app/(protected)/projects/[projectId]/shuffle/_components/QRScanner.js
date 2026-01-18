/**
 * Purpose: QR code scanner component for scanning container QR codes.
 * Exports: QRScanner component
 * Invariants:
 * - Uses camera capture via file input (Android-first).
 * - Parses QR codes from images using jsQR library.
 * - Calls onScan callback with QR payload on success.
 * - Calls onError callback on failure.
 */

'use client';

import { useState, useRef } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onError, label = 'Scan QR Code', color = 'blue' }) {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);

    try {
      // Read image file
      const imageData = await readImageFile(file);

      // Parse QR code using jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        // Successfully scanned QR code
        if (onScan) {
          onScan(code.data);
        }
      } else {
        // No QR code found in image
        if (onError) {
          onError('No QR code found in image. Please try again or use manual entry.');
        }
      }
    } catch (error) {
      console.error('QR scan error:', error);
      if (onError) {
        onError('Failed to scan QR code. Please try again or use manual entry.');
      }
    } finally {
      setScanning(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  // Helper function to read image file and extract ImageData
  const readImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Create canvas to extract image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve(imageData);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={scanning}
        className="hidden"
        id="qr-scanner-input"
      />
      <label
        htmlFor="qr-scanner-input"
        className={`block w-full px-6 py-4 ${colorClasses[color] || colorClasses.blue} text-white font-semibold text-center rounded-md cursor-pointer transition-colors ${
          scanning ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {scanning ? 'Scanning...' : label}
      </label>
    </div>
  );
}

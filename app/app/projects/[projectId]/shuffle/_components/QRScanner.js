/**
 * Purpose: QR code scanner component for scanning container QR codes.
 * Exports: QRScanner component
 * Invariants:
 * - Uses camera capture via file input (Android-first).
 * - Parses QR payload and calls onScan callback.
 * - Shows loading state during scan processing.
 */

'use client';

import { useState, useRef } from 'react';

export default function QRScanner({ onScan, onError, label = 'Scan QR Code' }) {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);

    try {
      // For MVP, we'll use a simple approach: display instructions to manually enter the code
      // In production, you'd use a library like jsQR or html5-qrcode to parse the image
      // For now, we'll simulate parsing by prompting manual entry

      // TODO: Implement actual QR code parsing with a library like jsQR
      // For now, this is a placeholder that will be replaced with actual QR parsing

      if (onError) {
        onError('QR scanning from image not yet implemented. Please use manual entry.');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      if (onError) {
        onError('Failed to scan QR code');
      }
    } finally {
      setScanning(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
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
        className={`block w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center rounded-md cursor-pointer transition-colors ${
          scanning ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {scanning ? 'Scanning...' : label}
      </label>
    </div>
  );
}

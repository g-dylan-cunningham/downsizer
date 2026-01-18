/**
 * Purpose: Live QR code scanner using BarcodeDetector API for Android PWA.
 * Exports: LiveQRScanner component
 * Invariants:
 * - Uses getUserMedia to access rear camera.
 * - Uses BarcodeDetector API for real-time QR detection.
 * - Shows video preview while scanning.
 * - Stops camera stream after successful scan.
 * - Validates QR payload format: container:{uuid}
 * - Falls back to manual entry if BarcodeDetector not supported.
 */

'use client';

import { useState, useRef, useEffect } from 'react';

export default function LiveQRScanner({
  onScan,
  onError,
  onClose,
  label = 'Scan QR Code',
  color = 'blue',
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasScannedRef = useRef(false);

  // Cleanup function
  const cleanup = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start scanning
  const startScanning = async () => {
    hasScannedRef.current = false;
    setError('');
    setPermissionDenied(false);
    setUnsupported(false);

    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
      setUnsupported(true);
      setError('QR scanning not supported in this browser. Please use manual entry.');
      if (onError) {
        onError('BarcodeDetector API not supported. Please use manual entry.');
      }
      return;
    }

    try {
      setScanning(true);

      // Initialize BarcodeDetector
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });

      // Request camera access (rear camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start detection loop
        detectQRCode();
      }
    } catch (err) {
      console.error('Camera access error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please try manual entry.');
      }

      if (onError) {
        onError(err.message || 'Failed to access camera');
      }

      setScanning(false);
      cleanup();
    }
  };

  // Detection loop
  const detectQRCode = async () => {
    if (!videoRef.current || !detectorRef.current || hasScannedRef.current) {
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);

      if (barcodes.length > 0 && !hasScannedRef.current) {
        const qrData = barcodes[0].rawValue;

        // Validate QR payload format: container:{uuid}
        const containerRegex = /^container:[0-9a-fA-F-]{36}$/;
        if (containerRegex.test(qrData)) {
          hasScannedRef.current = true;

          // Stop scanning
          cleanup();
          setScanning(false);

          // Call success callback
          if (onScan) {
            onScan(qrData);
          }
          return;
        } else {
          // Invalid format, keep scanning but show warning
          setError('Invalid QR code format. Expected: container:{uuid}');
        }
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }

    // Continue detection loop
    if (!hasScannedRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    hasScannedRef.current = true;
    cleanup();
    setScanning(false);
    if (onClose) {
      onClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  if (unsupported) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Live QR scanning is not supported in this browser. Please use manual entry below.
          </p>
        </div>
      </div>
    );
  }

  if (!scanning) {
    return (
      <div className="space-y-4">
        <button
          onClick={startScanning}
          className={`w-full px-6 py-4 ${colorClasses[color] || colorClasses.blue} text-white font-semibold text-center rounded-md transition-colors shadow-lg flex items-center justify-center gap-2`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          {label}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            {permissionDenied && (
              <button
                onClick={startScanning}
                className="mt-2 text-sm text-red-800 dark:text-red-200 underline hover:no-underline"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"></div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-center text-sm font-medium">
            Point camera at QR code
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Scanning...</span>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={stopScanning}
        className="w-full px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors"
      >
        Stop Scanning
      </button>
    </div>
  );
}

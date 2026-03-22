'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onCapture: (file: File, preview: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captured, setCaptured] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopCamera();
    setStarting(true);
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      setError('Camera access was denied. Please allow camera permission in your browser settings.');
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera(facingMode);
  };

  const handleUsePhoto = () => {
    if (!captured) return;
    const arr = captured.split(',');
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const file = new File([u8arr], `id-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file, captured);
    stopCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const flipCamera = () => {
    setCaptured(null);
    setFacingMode(m => m === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-3">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">📷 Camera</h3>
            <p className="text-xs text-gray-400">
              {captured ? 'Review your photo' : 'Position the ID within the frame'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Camera / Preview area */}
        <div className="relative bg-black" style={{ minHeight: '56vw', maxHeight: '55vh' }}>
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <span className="text-5xl">🚫</span>
              <p className="text-white text-base font-semibold">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl"
              >
                Try Again
              </button>
            </div>
          ) : captured ? (
            <img
              src={captured}
              alt="Captured"
              className="w-full h-full object-contain"
              style={{ maxHeight: '55vh' }}
            />
          ) : (
            <>
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2 animate-pulse">📷</div>
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ maxHeight: '55vh' }}
              />
              {/* ID guide frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="border-2 border-white/70 rounded-2xl relative"
                  style={{ width: '88%', aspectRatio: '1.6' }}
                >
                  {/* Corner markers */}
                  {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                    <div
                      key={i}
                      className={`absolute w-5 h-5 border-white border-[3px] rounded-sm ${pos}`}
                      style={{
                        borderBottom: pos.includes('top') ? 'none' : undefined,
                        borderTop: pos.includes('bottom') ? 'none' : undefined,
                        borderRight: pos.includes('left') ? 'none' : undefined,
                        borderLeft: pos.includes('right') ? 'none' : undefined,
                      }}
                    />
                  ))}
                  <p className="absolute -bottom-7 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">
                    Align ID card here
                  </p>
                </div>
              </div>
              {/* Flip camera button */}
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xl transition"
                title="Flip camera"
              >
                🔄
              </button>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Action buttons */}
        <div className="p-4">
          {!captured ? (
            <button
              onClick={handleCapture}
              disabled={!!error || starting}
              className="w-full flex items-center justify-center gap-3 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition text-xl"
            >
              📸 Take Photo
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition text-base"
              >
                🔄 Retake
              </button>
              <button
                onClick={handleUsePhoto}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-2xl transition text-base"
              >
                ✅ Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RotateCcw, Check, X } from 'lucide-react';
import * as React from 'react';

type WebcamCaptureProps = {
    onCapture: (imageFile: File) => void;
    onClose: () => void;
    isOpen: boolean;
};

export function WebcamCapture({ onCapture, onClose, isOpen }: WebcamCaptureProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = React.useState(false);
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Start camera when component opens
    React.useEffect(() => {
        if (isOpen && !isStreaming) {
            startCamera();
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    // Cleanup when component unmounts or closes
    React.useEffect(() => {
        if (!isOpen && stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsStreaming(false);
            setCapturedImage(null);
            setError(null);
        }
    }, [isOpen, stream]);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    setIsStreaming(true);
                };
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please check permissions and try again.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsStreaming(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !isStreaming) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image as data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const confirmPhoto = () => {
        if (!capturedImage) return;

        // Convert data URL to File
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const timestamp = Date.now();
                const file = new File([blob], `webcam-capture-${timestamp}.jpg`, { 
                    type: 'image/jpeg' 
                });
                onCapture(file);
                setCapturedImage(null);
                onClose();
            })
            .catch(err => {
                console.error('Error converting image:', err);
                setError('Failed to process captured image.');
            });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4">
                <div className="bg-black border border-white/20 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Take Photo
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white/60 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Camera View */}
                    <div className="relative aspect-video bg-black">
                        {error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                                <CameraOff className="h-12 w-12 mb-4" />
                                <p className="text-center px-4">{error}</p>
                                <Button
                                    onClick={startCamera}
                                    className="mt-4 bg-white text-black hover:bg-white/90"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured photo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                {!isStreaming && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="text-white/60 text-center">
                                            <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                                            <p>Starting camera...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Controls */}
                    <div className="p-4 bg-black/50">
                        {capturedImage ? (
                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    onClick={retakePhoto}
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Retake
                                </Button>
                                <Button
                                    onClick={confirmPhoto}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Use This Photo
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Button
                                    onClick={capturePhoto}
                                    disabled={!isStreaming}
                                    size="lg"
                                    className="bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
                                >
                                    <Camera className="h-5 w-5 mr-2" />
                                    Take Photo
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

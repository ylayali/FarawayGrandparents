'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Send, Grid, Download, Printer } from 'lucide-react';
import Image from 'next/image';

type ImageInfo = {
    path: string;
    filename: string;
};

type ImageOutputProps = {
    imageBatch: ImageInfo[] | null;
    viewMode: 'grid' | number;
    onViewChange: (view: 'grid' | number) => void;
    altText?: string;
    isLoading: boolean;
    onSendToEdit: (filename: string) => void;
    currentMode: 'generate' | 'edit';
    baseImagePreviewUrl: string | null;
};

const getGridColsClass = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3';
};

export function ImageOutput({
    imageBatch,
    viewMode,
    onViewChange,
    altText = 'Generated image output',
    isLoading,
    onSendToEdit,
    currentMode,
    baseImagePreviewUrl
}: ImageOutputProps) {
    const handleSendClick = () => {
        // Send to edit only works when a single image is selected
        if (typeof viewMode === 'number' && imageBatch && imageBatch[viewMode]) {
            onSendToEdit(imageBatch[viewMode].filename);
        }
    };

    const getCurrentImageUrl = () => {
        if (!imageBatch) return null;
        if (viewMode === 'grid') return null;
        if (typeof viewMode === 'number' && imageBatch[viewMode]) {
            return imageBatch[viewMode].path;
        }
        if (imageBatch.length === 1) {
            return imageBatch[0].path;
        }
        return null;
    };

    const getCurrentFilename = () => {
        if (!imageBatch) return 'coloring-page.png';
        if (viewMode === 'grid') return 'coloring-page.png';
        if (typeof viewMode === 'number' && imageBatch[viewMode]) {
            return imageBatch[viewMode].filename;
        }
        if (imageBatch.length === 1) {
            return imageBatch[0].filename;
        }
        return 'coloring-page.png';
    };

    const handleDownload = async () => {
        const imageUrl = getCurrentImageUrl();
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getCurrentFilename();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handlePrint = () => {
        const imageUrl = getCurrentImageUrl();
        if (!imageUrl) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Coloring Page</title>
                <style>
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    img {
                        width: 100vw;
                        height: 100vh;
                        object-fit: contain;
                        display: block;
                    }
                    @media print {
                        html, body {
                            width: 100% !important;
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        img {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: none !important;
                            max-height: none !important;
                            object-fit: contain !important;
                            page-break-inside: avoid !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${imageUrl}" onload="window.print(); window.close();" onerror="window.close();" />
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const showCarousel = imageBatch && imageBatch.length > 1;
    const isSingleImageView = typeof viewMode === 'number';
    const canSendToEdit = !isLoading && isSingleImageView && imageBatch && imageBatch[viewMode];
    const hasViewableImage = getCurrentImageUrl() !== null;

    return (
        <div className='flex h-full min-h-[300px] w-full flex-col items-center justify-between gap-4 overflow-hidden rounded-lg border border-white/20 bg-black p-4'>
            <div className='relative flex h-full w-full flex-grow items-center justify-center overflow-hidden'>
                {isLoading ? (
                    currentMode === 'edit' && baseImagePreviewUrl ? (
                        <div className='relative flex h-full w-full items-center justify-center'>
                            <Image
                                src={baseImagePreviewUrl}
                                alt='Base image for editing'
                                fill
                                style={{ objectFit: 'contain' }}
                                className='blur-md filter'
                                unoptimized
                            />
                            <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white/80'>
                                <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                                <p>Editing image...</p>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center text-white/60'>
                            <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                            <p>Generating image...</p>
                        </div>
                    )
                ) : imageBatch && imageBatch.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div
                            className={`grid ${getGridColsClass(imageBatch.length)} max-h-full w-full max-w-full gap-1 p-1`}>
                            {imageBatch.map((img, index) => (
                                <div
                                    key={img.filename}
                                    className='relative aspect-square overflow-hidden rounded border border-white/10'>
                                    <Image
                                        src={img.path}
                                        alt={`Generated image ${index + 1}`}
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    ) : imageBatch[viewMode] ? (
                        <Image
                            src={imageBatch[viewMode].path}
                            alt={altText}
                            width={512}
                            height={512}
                            className='max-h-full max-w-full object-contain'
                            unoptimized
                        />
                    ) : (
                        <div className='text-center text-white/40'>
                            <p>Error displaying image.</p>
                        </div>
                    )
                ) : (
                    <div className='text-center text-white/40'>
                        <p>Your generated image will appear here.</p>
                    </div>
                )}
            </div>

            <div className='w-full space-y-3'>
                {/* Download and Print buttons */}
                {hasViewableImage && (
                    <div className='flex items-center justify-center gap-3'>
                        <Button
                            onClick={handleDownload}
                            variant='outline'
                            size='sm'
                            className='border-white/20 text-white hover:bg-white/10 hover:text-white'>
                            <Download className='mr-2 h-4 w-4' />
                            Download Picture
                        </Button>
                        <Button
                            onClick={handlePrint}
                            variant='outline'
                            size='sm'
                            className='border-white/20 text-white hover:bg-white/10 hover:text-white'>
                            <Printer className='mr-2 h-4 w-4' />
                            Print Picture
                        </Button>
                    </div>
                )}
                
                {/* Carousel navigation */}
                <div className='flex h-10 items-center justify-center gap-4'>
                    {showCarousel && (
                        <div className='flex items-center gap-1.5 rounded-md border border-white/10 bg-neutral-800/50 p-1'>
                            <Button
                                variant='ghost'
                                size='icon'
                                className={cn(
                                    'h-8 w-8 rounded p-1',
                                    viewMode === 'grid'
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                                )}
                                onClick={() => onViewChange('grid')}
                                aria-label='Show grid view'>
                                <Grid className='h-4 w-4' />
                            </Button>
                            {imageBatch.map((img, index) => (
                                <Button
                                    key={img.filename}
                                    variant='ghost'
                                    size='icon'
                                    className={cn(
                                        'h-8 w-8 overflow-hidden rounded p-0.5',
                                        viewMode === index
                                            ? 'ring-2 ring-white ring-offset-1 ring-offset-black'
                                            : 'opacity-60 hover:opacity-100'
                                    )}
                                    onClick={() => onViewChange(index)}
                                    aria-label={`Select image ${index + 1}`}>
                                    <Image
                                        src={img.path}
                                        alt={`Thumbnail ${index + 1}`}
                                        width={28}
                                        height={28}
                                        className='h-full w-full object-cover'
                                        unoptimized
                                    />
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import type { HistoryMetadata } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    Layers,
    HardDrive,
    Database,
    FileImage,
    Trash2
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

type HistoryPanelProps = {
    history: HistoryMetadata[];
    onSelectImage: (item: HistoryMetadata) => void;
    onClearHistory: () => void;
    getImageSrc: (filename: string) => string | undefined;
    onDeleteItemRequest: (item: HistoryMetadata) => void;
    itemPendingDeleteConfirmation: HistoryMetadata | null;
    onConfirmDeletion: () => void;
    onCancelDeletion: () => void;
    deletePreferenceDialogValue: boolean;
    onDeletePreferenceDialogChange: (isChecked: boolean) => void;
};

export function HistoryPanel({
    history,
    onSelectImage,
    onClearHistory,
    getImageSrc,
    onDeleteItemRequest,
    itemPendingDeleteConfirmation,
    onConfirmDeletion,
    onCancelDeletion,
    deletePreferenceDialogValue,
    onDeletePreferenceDialogChange
}: HistoryPanelProps) {
    const totalImages = React.useMemo(() => {
        let images = 0;
        history.forEach((item) => {
            images += item.images?.length ?? 0;
        });
        return images;
    }, [history]);

    return (
        <Card className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black'>
            <CardHeader className='flex flex-row items-center justify-between gap-4 border-b border-white/10 px-4 py-3'>
                <div className='flex items-center gap-2'>
                    <CardTitle className='text-lg font-medium text-white'>History</CardTitle>
                </div>
                {history.length > 0 && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={onClearHistory}
                        className='h-auto rounded-md px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white'>
                        Clear
                    </Button>
                )}
            </CardHeader>
            <CardContent className='flex-grow overflow-y-auto p-4'>
                {history.length === 0 ? (
                    <div className='flex h-full items-center justify-center text-white/40'>
                        <p>Generated images will appear here.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                        {[...history].map((item) => {
                            const firstImage = item.images?.[0];
                            const imageCount = item.images?.length ?? 0;
                            const isMultiImage = imageCount > 1;
                            const itemKey = item.timestamp;
                            const originalStorageMode = item.storageModeUsed || 'fs';
                            const outputFormat = item.output_format || 'png';

                            let thumbnailUrl: string | undefined;
                            if (firstImage) {
                                if (originalStorageMode === 'indexeddb') {
                                    thumbnailUrl = getImageSrc(firstImage.filename);
                                } else {
                                    thumbnailUrl = `/api/image/${firstImage.filename}`;
                                }
                            }

                            return (
                                <div key={itemKey} className='flex flex-col'>
                                    <div className='group relative'>
                                        <button
                                            onClick={() => onSelectImage(item)}
                                            className='relative block aspect-square w-full overflow-hidden rounded-t-md border border-white/20 transition-all duration-150 group-hover:border-white/40 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black focus:outline-none'
                                            aria-label={`View image batch from ${new Date(item.timestamp).toLocaleString()}`}>
                                            {thumbnailUrl ? (
                                                <Image
                                                    src={thumbnailUrl}
                                                    alt={`Preview for batch generated at ${new Date(item.timestamp).toLocaleString()}`}
                                                    width={150}
                                                    height={150}
                                                    className='h-full w-full object-cover'
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className='flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-500'>
                                                    ?
                                                </div>
                                            )}
                                            {isMultiImage && (
                                                <div className='pointer-events-none absolute right-1 bottom-1 z-10 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[12px] text-white'>
                                                    <Layers size={16} />
                                                    {imageCount}
                                                </div>
                                            )}
                                            <div className='pointer-events-none absolute bottom-1 left-1 z-10 flex items-center gap-1'>
                                                <div className='flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/80 px-1 py-0.5 text-[11px] text-white/70'>
                                                    {originalStorageMode === 'fs' ? (
                                                        <HardDrive size={12} className='text-neutral-400' />
                                                    ) : (
                                                        <Database size={12} className='text-blue-400' />
                                                    )}
                                                    <span>{originalStorageMode === 'fs' ? 'file' : 'db'}</span>
                                                </div>
                                                {item.output_format && (
                                                    <div className='flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/80 px-1 py-0.5 text-[11px] text-white/70'>
                                                        <FileImage size={12} className='text-neutral-400' />
                                                        <span>{outputFormat.toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    <div className='flex justify-end rounded-b-md border border-t-0 border-neutral-700 bg-black p-1'>
                                        <Dialog
                                            open={itemPendingDeleteConfirmation?.timestamp === item.timestamp}
                                            onOpenChange={(isOpen) => {
                                                if (!isOpen) onCancelDeletion();
                                            }}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className='h-6 w-6 bg-red-700/60 text-white hover:bg-red-600/60'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteItemRequest(item);
                                                    }}
                                                    aria-label='Delete history item'>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className='border-neutral-700 bg-neutral-900 text-white sm:max-w-md'>
                                                <DialogHeader>
                                                    <DialogTitle className='text-white'>
                                                        Confirm Deletion
                                                    </DialogTitle>
                                                    <DialogDescription className='pt-2 text-neutral-300'>
                                                        Are you sure you want to delete this history entry? This
                                                        will remove {item.images.length} image(s). This action
                                                        cannot be undone.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className='flex items-center space-x-2 py-2'>
                                                    <Checkbox
                                                        id={`dont-ask-${item.timestamp}`}
                                                        checked={deletePreferenceDialogValue}
                                                        onCheckedChange={(checked) =>
                                                            onDeletePreferenceDialogChange(!!checked)
                                                        }
                                                        className='border-neutral-400 bg-white data-[state=checked]:border-neutral-700 data-[state=checked]:bg-white data-[state=checked]:text-black dark:border-neutral-500 dark:!bg-white'
                                                    />
                                                    <label
                                                        htmlFor={`dont-ask-${item.timestamp}`}
                                                        className='text-sm leading-none font-medium text-neutral-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                                                        Don&apos;t ask me again
                                                    </label>
                                                </div>
                                                <DialogFooter className='gap-2 sm:justify-end'>
                                                    <Button
                                                        type='button'
                                                        variant='outline'
                                                        size='sm'
                                                        onClick={onCancelDeletion}
                                                        className='border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white'>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='destructive'
                                                        size='sm'
                                                        onClick={onConfirmDeletion}
                                                        className='bg-red-600 text-white hover:bg-red-500'>
                                                        Delete
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

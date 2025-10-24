'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
    Upload,
    X,
    Loader2,
    Lock,
    LockOpen,
    ImageIcon,
    Users,
    Palette,
    Camera
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { ColoringPageFormData, ColoringPageType, BackgroundType, OrientationType } from '@/types/coloring-page';
import { WebcamCapture } from '@/components/webcam-capture';

export type { ColoringPageFormData };

type ColoringPageFormProps = {
    onSubmitAction: (data: ColoringPageFormData) => void;
    isLoading: boolean;
    isPasswordRequiredByBackend: boolean | null;
    clientPasswordHash: string | null;
    onOpenPasswordDialogAction: () => void;
};

const RadioItemWithIcon = ({
    value,
    id,
    label,
    Icon
}: {
    value: string;
    id: string;
    label: string;
    Icon: React.ElementType;
}) => (
    <div className='flex items-center space-x-2'>
        <RadioGroupItem
            value={value}
            id={id}
            className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
        />
        <Label htmlFor={id} className='flex cursor-pointer items-center gap-2 text-base text-white/80'>
            <Icon className='h-5 w-5 text-white/60' />
            {label}
        </Label>
    </div>
);

export function ColoringPageForm({
    onSubmitAction,
    isLoading,
    isPasswordRequiredByBackend,
    clientPasswordHash,
    onOpenPasswordDialogAction
}: ColoringPageFormProps) {
    const [type, setType] = React.useState<ColoringPageType>('straight-copy');
    const [imageFiles, setImageFiles] = React.useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
    const [background, setBackground] = React.useState<BackgroundType>('plain');
    const [orientation, setOrientation] = React.useState<OrientationType>('portrait');
    const [nameOrMessage, setNameOrMessage] = React.useState('');
    const [individualNames, setIndividualNames] = React.useState<string[]>(['']);
    const [sceneDescription, setSceneDescription] = React.useState('');
    const [isWebcamOpen, setIsWebcamOpen] = React.useState(false);

    // Determine max images based on type
    const maxImages = type === 'straight-copy' ? 1 : 4;

    // Update individual names array when image count changes
    React.useEffect(() => {
        const currentCount = imageFiles.length;
        if (type !== 'straight-copy') {
            setIndividualNames(prev => {
                const newArray = [...prev];
                // Ensure we have exactly as many name fields as images
                while (newArray.length < currentCount) {
                    newArray.push('');
                }
                while (newArray.length > currentCount) {
                    newArray.pop();
                }
                return newArray;
            });
        }
    }, [imageFiles.length, type]);

    // Reset form when type changes
    React.useEffect(() => {
        setImageFiles([]);
        setImagePreviewUrls([]);
        setIndividualNames(['']);
        setNameOrMessage('');
        setSceneDescription('');
        // Reset background to plain if scene was selected and switching to straight-copy
        if (type === 'straight-copy' && background === 'scene') {
            setBackground('plain');
        }
    }, [type]);

    // Clean up preview URLs
    React.useEffect(() => {
        return () => {
            imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviewUrls]);

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const totalFiles = imageFiles.length + newFiles.length;

            if (totalFiles > maxImages) {
                alert(`You can only select up to ${maxImages} image${maxImages > 1 ? 's' : ''} for this type.`);
                const allowedNewFiles = newFiles.slice(0, maxImages - imageFiles.length);
                if (allowedNewFiles.length === 0) {
                    event.target.value = '';
                    return;
                }
                newFiles.splice(allowedNewFiles.length);
            }

            setImageFiles(prev => [...prev, ...newFiles]);

            const newFilePromises = newFiles.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newFilePromises)
                .then(newUrls => {
                    setImagePreviewUrls(prev => [...prev, ...newUrls]);
                })
                .catch(error => {
                    console.error('Error reading image files:', error);
                });

            event.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setImagePreviewUrls(prev => {
            const newUrls = prev.filter((_, index) => index !== indexToRemove);
            // Revoke the removed URL
            if (prev[indexToRemove]) {
                URL.revokeObjectURL(prev[indexToRemove]);
            }
            return newUrls;
        });
    };

    const handleIndividualNameChange = (index: number, value: string) => {
        setIndividualNames(prev => {
            const newArray = [...prev];
            newArray[index] = value;
            return newArray;
        });
    };

    const handleWebcamCapture = (imageFile: File) => {
        if (imageFiles.length >= maxImages) {
            alert(`You can only select up to ${maxImages} image${maxImages > 1 ? 's' : ''} for this type.`);
            return;
        }

        setImageFiles(prev => [...prev, imageFile]);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(imageFile);
    };

    const handleOpenWebcam = () => {
        if (imageFiles.length >= maxImages) {
            alert(`You can only select up to ${maxImages} image${maxImages > 1 ? 's' : ''} for this type.`);
            return;
        }
        setIsWebcamOpen(true);
    };

    const handleCloseWebcam = () => {
        setIsWebcamOpen(false);
    };

    const getTypeDescription = () => {
        switch (type) {
            case 'straight-copy':
                return 'Direct conversion of a single photo into a line drawing coloring page';
            case 'facial-portrait':
                return 'Multiple facial portraits arranged in boxes with individual names';
            case 'cartoon-portrait':
                return 'Cartoon-style characters with activities based on uploaded photos';
        }
    };

    const getNameLabel = () => {
        switch (type) {
            case 'straight-copy':
                return 'Name/Short Message (optional)';
            case 'facial-portrait':
                return 'Family Name/Short Message (optional)';
            case 'cartoon-portrait':
                return 'Name/Short Message (optional)';
        }
    };

    const getIndividualLabel = () => {
        switch (type) {
            case 'facial-portrait':
                return 'Name';
            case 'cartoon-portrait':
                return 'Activity/Interest';
            default:
                return '';
        }
    };

    const displayFileNames = (files: File[]) => {
        if (files.length === 0) return 'No file selected.';
        if (files.length === 1) return files[0].name;
        return `${files.length} files selected`;
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (imageFiles.length === 0) {
            alert('Please select at least one image.');
            return;
        }

        if (background === 'scene' && !sceneDescription.trim()) {
            alert('Please provide a scene description when "Scene" background is selected.');
            return;
        }

        const formData: ColoringPageFormData = {
            type,
            imageFiles,
            background,
            orientation,
            nameOrMessage,
            individualNames: type === 'straight-copy' ? [] : individualNames,
            sceneDescription: background === 'scene' ? sceneDescription : undefined
        };

        onSubmitAction(formData);
    };

    return (
        <>
            <Card className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black'>
            <CardHeader className='flex items-start justify-between border-b border-white/10 pb-4'>
                <div>
                    <div className='flex items-center'>
                        <CardTitle className='py-1 text-lg font-medium text-white'>Photo Coloring Page Generator</CardTitle>
                        {isPasswordRequiredByBackend && (
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={onOpenPasswordDialogAction}
                                className='ml-2 text-white/60 hover:text-white'
                                aria-label='Configure Password'>
                                {clientPasswordHash ? <Lock className='h-4 w-4' /> : <LockOpen className='h-4 w-4' />}
                            </Button>
                        )}
                    </div>
                    <CardDescription className='mt-1 text-white/60'>
                        Convert your photos into custom coloring pages.
                    </CardDescription>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className='flex h-full flex-1 flex-col overflow-hidden'>
                <CardContent className='flex-1 space-y-5 overflow-y-auto p-4'>
                    {/* Generation Time Warning */}
                    <div className='rounded-lg border border-orange-500/50 bg-orange-900/20 p-4'>
                        <div className='flex items-center gap-2'>
                            <div className='h-2 w-2 rounded-full bg-orange-400'></div>
                            <p className='text-sm font-medium text-orange-200'>Important Notice</p>
                        </div>
                        <p className='mt-1 text-sm text-orange-300'>
                            Each coloring page takes 2-3 minutes to generate. Please be patient and avoid clicking around while processing.
                        </p>
                    </div>
                    {/* Type Selection */}
                    <div className='space-y-3'>
                        <Label className='block text-white'>Type of Coloring Page</Label>
                        <RadioGroup
                            value={type}
                            onValueChange={(value) => setType(value as ColoringPageType)}
                            disabled={isLoading}
                            className='space-y-3'>
                            <RadioItemWithIcon
                                value='straight-copy'
                                id='type-straight-copy'
                                label='Straight Copy of Photo'
                                Icon={ImageIcon}
                            />
                            <RadioItemWithIcon
                                value='facial-portrait'
                                id='type-facial-portrait'
                                label='Facial Portrait'
                                Icon={Users}
                            />
                            <RadioItemWithIcon
                                value='cartoon-portrait'
                                id='type-cartoon-portrait'
                                label='Cartoon Portrait'
                                Icon={Palette}
                            />
                        </RadioGroup>
                        <p className='text-xs text-white/60'>{getTypeDescription()}</p>
                    </div>

                    {/* Image Upload */}
                    <div className='space-y-2'>
                        <Label className='text-white'>
                            Photo{maxImages > 1 ? 's' : ''} [Max: {maxImages}]
                        </Label>
                        <Label
                            htmlFor='image-files-input'
                            className='flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-white/20 bg-black px-3 py-2 text-sm transition-colors hover:bg-white/5'>
                            <span className='truncate pr-2 text-white/60'>{displayFileNames(imageFiles)}</span>
                            <span className='flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/20'>
                                <Upload className='h-3 w-3' /> Browse...
                            </span>
                        </Label>
                        <Input
                            id='image-files-input'
                            type='file'
                            accept='image/png, image/jpeg, image/webp'
                            multiple={maxImages > 1}
                            onChange={handleImageFileChange}
                            disabled={isLoading || imageFiles.length >= maxImages}
                            className='sr-only'
                        />

                        {/* Take Photo Button */}
                        <div className='flex justify-center pt-2'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleOpenWebcam}
                                disabled={isLoading || imageFiles.length >= maxImages}
                                className='border-white/20 text-white hover:bg-white/10 hover:text-white disabled:border-white/10 disabled:text-white/30'
                            >
                                <Camera className='mr-2 h-4 w-4' />
                                Take Photo with Camera
                            </Button>
                        </div>
                        
                        {/* Image Previews with Labels */}
                        {imagePreviewUrls.length > 0 && (
                            <div className='space-y-2 pt-2'>
                                <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                                    {imagePreviewUrls.map((url, index) => (
                                        <div key={url} className='relative'>
                                            <div className='relative overflow-hidden rounded border border-white/10'>
                                                <Image
                                                    src={url}
                                                    alt={`Preview ${index + 1}`}
                                                    width={100}
                                                    height={100}
                                                    className='h-20 w-full object-cover'
                                                    unoptimized
                                                />
                                                <div className='absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-center'>
                                                    <span className='text-xs font-medium text-white'>
                                                        Image {index + 1}
                                                    </span>
                                                </div>
                                                <Button
                                                    type='button'
                                                    variant='destructive'
                                                    size='icon'
                                                    className='absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-700'
                                                    onClick={() => handleRemoveImage(index)}
                                                    aria-label={`Remove image ${index + 1}`}>
                                                    <X className='h-3 w-3' />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Individual Names/Activities (for multi-photo types) */}
                    {type !== 'straight-copy' && imageFiles.length > 0 && (
                        <div className='space-y-3'>
                            <Label className='block text-white'>{getIndividualLabel()}s for Each Image</Label>
                            {imageFiles.map((_, index) => (
                                <div key={index} className='space-y-1'>
                                    <Label className='text-sm text-white/80'>
                                        Image {index + 1} - {getIndividualLabel()}
                                    </Label>
                                    <Input
                                        type='text'
                                        placeholder={type === 'facial-portrait' ? 'e.g., John' : 'e.g., Playing soccer'}
                                        value={individualNames[index] || ''}
                                        onChange={(e) => handleIndividualNameChange(index, e.target.value)}
                                        disabled={isLoading}
                                        className='rounded-md border border-white/20 bg-black text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50'
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Main Name/Message Field */}
                    <div className='space-y-1.5'>
                        <Label htmlFor='name-message' className='text-white'>
                            {getNameLabel()}
                        </Label>
                        <Input
                            id='name-message'
                            type='text'
                            placeholder='e.g., Happy Birthday!'
                            value={nameOrMessage}
                            onChange={(e) => setNameOrMessage(e.target.value)}
                            disabled={isLoading}
                            className='rounded-md border border-white/20 bg-black text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50'
                        />
                    </div>

                    {/* Background Selection */}
                    <div className='space-y-3'>
                        <Label className='block text-white'>Background</Label>
                        <RadioGroup
                            value={background}
                            onValueChange={(value) => setBackground(value as BackgroundType)}
                            disabled={isLoading}
                            className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem
                                    value='plain'
                                    id='bg-plain'
                                    className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <Label htmlFor='bg-plain' className='cursor-pointer text-base text-white/80'>
                                    Plain White
                                </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem
                                    value='mindful-pattern'
                                    id='bg-mindful'
                                    className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <Label htmlFor='bg-mindful' className='cursor-pointer text-base text-white/80'>
                                    Mindful Coloring
                                </Label>
                            </div>
                            {type !== 'straight-copy' && (
                                <div className='flex items-center space-x-2'>
                                    <RadioGroupItem
                                        value='scene'
                                        id='bg-scene'
                                        className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                    />
                                    <Label htmlFor='bg-scene' className='cursor-pointer text-base text-white/80'>
                                        Scene
                                    </Label>
                                </div>
                            )}
                        </RadioGroup>

                        {/* Scene Description (only shown when scene is selected) */}
                        {background === 'scene' && (
                            <div className='space-y-1.5 pt-2'>
                                <Label htmlFor='scene-description' className='text-white'>
                                    Scene Description
                                </Label>
                                <Textarea
                                    id='scene-description'
                                    placeholder='e.g., by a river, in a football stadium, at the beach'
                                    value={sceneDescription}
                                    onChange={(e) => setSceneDescription(e.target.value)}
                                    disabled={isLoading}
                                    className='min-h-[60px] rounded-md border border-white/20 bg-black text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50'
                                />
                            </div>
                        )}
                    </div>

                    {/* Orientation Selection */}
                    <div className='space-y-3'>
                        <Label className='block text-white'>Orientation</Label>
                        <RadioGroup
                            value={orientation}
                            onValueChange={(value) => setOrientation(value as OrientationType)}
                            disabled={isLoading}
                            className='flex gap-x-5'>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem
                                    value='portrait'
                                    id='orientation-portrait'
                                    className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <Label htmlFor='orientation-portrait' className='cursor-pointer text-base text-white/80'>
                                    Portrait (1024×1536)
                                </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <RadioGroupItem
                                    value='landscape'
                                    id='orientation-landscape'
                                    className='border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <Label htmlFor='orientation-landscape' className='cursor-pointer text-base text-white/80'>
                                    Landscape (1536×1024)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>

                <CardFooter className='border-t border-white/10 p-4'>
                    <Button
                        type='submit'
                        disabled={isLoading || imageFiles.length === 0}
                        className='flex w-full items-center justify-center gap-2 rounded-md bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40'>
                        {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                        {isLoading ? 'Creating Coloring Page...' : 'Create Coloring Page'}
                    </Button>
                </CardFooter>
            </form>
        </Card>

        {/* Webcam Capture Modal */}
        <WebcamCapture
            isOpen={isWebcamOpen}
            onCapture={handleWebcamCapture}
            onClose={handleCloseWebcam}
        />
        </>
    );
}

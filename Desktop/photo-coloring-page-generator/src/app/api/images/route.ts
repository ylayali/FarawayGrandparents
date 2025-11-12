import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getStorage } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL
});

// Define valid output formats for type safety
const VALID_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const;
type ValidOutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];

// Validate and normalize output format
function validateOutputFormat(format: unknown): ValidOutputFormat {
    const normalized = String(format || 'png').toLowerCase();

    // Handle jpg -> jpeg normalization
    const mapped = normalized === 'jpg' ? 'jpeg' : normalized;

    if (VALID_OUTPUT_FORMATS.includes(mapped as ValidOutputFormat)) {
        return mapped as ValidOutputFormat;
    }

    return 'png'; // default fallback
}

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to generate coloring page prompts based on type and parameters
// This function implements the EXACT prompt specifications provided by the user
function generateColoringPagePrompt(
    type: string,
    nameOrMessage: string,
    individualNames: string[],
    background: string,
    sceneDescription?: string
): string {
    const hasName = nameOrMessage.trim().length > 0;
    const hasActivity = individualNames.length > 0 && individualNames[0]?.trim().length > 0;

    switch (type) {
        case 'straight-copy':
            if (!hasName) {
                return 'turn the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result, as large as possible whilst still looking elegant, centered vertically and horizontally on a plain white background';
            } else {
                return `turn the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. place the writing unobtrusively on top of the line drawing, ensuring it doesn't obscure the subject's face. finally center the whole thing, as large as possible whilst still looking elegant, on a plain white background.`;
            }

        case 'facial-portrait':
            // Check if multiple photos
            const numPhotos = individualNames.length;
            const isMultiplePhotos = numPhotos > 1;
            
            // Build individual names description for multiple photos
            let namesDesc = '';
            if (isMultiplePhotos && individualNames.some(name => name.trim())) {
                const names = individualNames
                    .map((name, idx) => name.trim() ? `below the box from photo ${idx + 1} write ${name}` : '')
                    .filter(s => s)
                    .join(', ');
                if (names) {
                    namesDesc = ` ${names} in friendly white letters with black outline.`;
                }
            }
            
            if (background === 'plain') {
                if (!hasName) {
                    if (isMultiplePhotos) {
                        return `turn the faces from the attached ${numPhotos} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result inside its own plain white box with a black outline.${namesDesc} arrange all boxes elegantly on a plain white background`;
                    } else {
                        return 'turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result, as large as possible whilst still looking elegant, inside a plain white box with a black outline. center this horizontally and vertically on a plain white background';
                    }
                } else {
                    if (isMultiplePhotos) {
                        return `turn the faces from the attached ${numPhotos} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result inside its own plain white box with a black outline.${namesDesc} arrange all boxes elegantly and write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive on a plain white background`;
                    } else {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result, as large as possible whilst still looking elegant, inside a plain white box with a black outline. below this box write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. center this collection of objects horizontally and vertically on a plain white background`;
                    }
                }
            } else if (background === 'mindful-pattern') {
                if (!hasName) {
                    if (isMultiplePhotos) {
                        return `turn the faces from the attached ${numPhotos} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result inside its own plain white box with a black outline.${namesDesc} arrange all boxes elegantly on top of an abstract pattern suitable for mindful coloring`;
                    } else {
                        return 'turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result, as large as possible whilst still looking elegant, inside a plain white box with a black outline. center this collection of objects horizontally and vertically on top of an abstract pattern suitable for mindful coloring';
                    }
                } else {
                    if (isMultiplePhotos) {
                        return `turn the faces from the attached ${numPhotos} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result inside its own plain white box with a black outline.${namesDesc} arrange all boxes elegantly and write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive on top of an abstract pattern suitable for mindful coloring`;
                    } else {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result, as large as possible whilst still looking elegant, inside a plain white box with a black outline. below this box write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. center this collection of objects horizontally and vertically on top of an abstract pattern suitable for mindful coloring`;
                    }
                }
            }
            break;

        case 'cartoon-portrait':
            // Check if multiple photos
            const numPhotosCartoon = individualNames.length;
            const isMultiplePhotosCartoon = numPhotosCartoon > 1;
            
            // Build activities description for multiple photos
            let activitiesDesc = '';
            if (isMultiplePhotosCartoon && individualNames.some(name => name.trim())) {
                const acts = individualNames
                    .map((act, idx) => act.trim() ? `the figure from photo ${idx + 1} engaged in ${act}` : `the figure from photo ${idx + 1}`)
                    .join(', ');
                activitiesDesc = acts;
            } else if (!isMultiplePhotosCartoon && hasActivity) {
                activitiesDesc = individualNames[0];
            }
            
            if (background === 'scene' && sceneDescription) {
                // Special case for scene backgrounds with multiple photos
                if (isMultiplePhotosCartoon) {
                    if (activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style, with ${activitiesDesc}. show all entire figures arranged in a way that makes sense in a ${sceneDescription} background`;
                    } else {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style. show all entire figures arranged in a way that makes sense in a ${sceneDescription} background`;
                    }
                } else {
                    return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style engaged in ${activitiesDesc}. show the entire figure. place the result in a way that makes sense in a ${sceneDescription} background`;
                }
            } else if (background === 'plain') {
                if (isMultiplePhotosCartoon) {
                    // Multiple photos on plain background
                    if (!hasName && activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style, with ${activitiesDesc}. show all entire figures. arrange them elegantly on a plain white background`;
                    } else if (hasName && activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style, with ${activitiesDesc}. show all entire figures. write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive. arrange everything elegantly on a plain white background`;
                    } else if (!hasName && !activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style. show all entire figures. arrange them elegantly on a plain white background`;
                    } else {
                        // hasName && !activitiesDesc
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style. show all entire figures. write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive. arrange everything elegantly on a plain white background`;
                    }
                } else {
                    // Single photo on plain background
                    if (!hasName && !hasActivity) {
                        return 'turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style. place this result as large as possible whilst still showing the entire figure, centered horizontally and vertically on a plain white background';
                    } else if (hasName && !hasActivity) {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style. show the entire body. below this write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. finally place this collection of objects as large as possible whilst still looking elegant, centered horizontally and vertically on a plain white background`;
                    } else if (!hasName && hasActivity) {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style engaged in ${activitiesDesc}. show the entire figure. place this result as large as possible whilst still looking elegant, centered horizontally and vertically on a plain white background`;
                    } else {
                        // hasName && hasActivity
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style engaged in ${activitiesDesc}. show the entire figure. below this write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. finally place this collection of objects as large as possible whilst still looking elegant, centered horizontally and vertically on a plain white background`;
                    }
                }
            } else if (background === 'mindful-pattern') {
                if (isMultiplePhotosCartoon) {
                    // Multiple photos on mindful coloring background
                    if (!hasName && activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style, with ${activitiesDesc}. show all entire figures. arrange them elegantly on top of an abstract pattern suitable for mindful coloring`;
                    } else if (hasName && activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style, with ${activitiesDesc}. show all entire figures. write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive. arrange everything elegantly on top of an abstract pattern suitable for mindful coloring`;
                    } else if (!hasName && !activitiesDesc) {
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style. show all entire figures. arrange them elegantly on top of an abstract pattern suitable for mindful coloring`;
                    } else {
                        // hasName && !activitiesDesc
                        return `turn the faces from the attached ${numPhotosCartoon} photos into line drawings suitable for a coloring page, ensuring accurate facial features are maintained. place each result onto a cartoon style line drawing body in the same coloring page style. show all entire figures. write ${nameOrMessage} in friendly white letters with black outline somewhere unobtrusive. arrange everything elegantly on top of an abstract pattern suitable for mindful coloring`;
                    }
                } else {
                    // Single photo on mindful coloring background
                    if (!hasName && !hasActivity) {
                        return 'turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style. show the entire figure. place this result as large as possible whilst still looking elegant, centered horizontally and vertically on top of an abstract pattern suitable for mindful coloring';
                    } else if (hasName && !hasActivity) {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style. show the entire figure. below this write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. finally place this collection of objects as large as possible whilst still looking elegant, centered horizontally and vertically on top of an abstract pattern suitable for mindful coloring`;
                    } else if (!hasName && hasActivity) {
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style engaged in ${activitiesDesc}. show the entire figure. place this result as large as possible whilst still looking elegant, centered horizontally and vertically on top of an abstract pattern suitable for mindful coloring`;
                    } else {
                        // hasName && hasActivity
                        return `turn the face from the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained. place the result onto a cartoon style line drawing body in the same coloring page style engaged in ${activitiesDesc}. show the entire figure. below this write ${nameOrMessage} in friendly white letters with black outline, suited to a coloring page. finally place this collection of objects as large as possible whilst still looking elegant, centered horizontally and vertically on top of an abstract pattern suitable for mindful coloring`;
                    }
                }
            }
            break;
    }

    // Fallback (should never reach here)
    return 'turn the attached photo into a line drawing suitable for a coloring page, ensuring accurate facial features are maintained';
}

export async function POST(request: NextRequest) {
    console.log('Received POST request to /api/images');

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set.');
        return NextResponse.json({ error: 'Server configuration error: API key not found.' }, { status: 500 });
    }
    try {
        let effectiveStorageMode: 'appwrite' | 'indexeddb';
        const explicitMode = process.env.NEXT_PUBLIC_IMAGE_STORAGE_MODE;
        const isOnVercel = process.env.VERCEL === '1';

        // Always use Appwrite storage on server, unless explicitly set to indexeddb
        if (explicitMode === 'indexeddb') {
            effectiveStorageMode = 'indexeddb';
        } else {
            effectiveStorageMode = 'appwrite';
        }
        console.log(
            `Effective Image Storage Mode: ${effectiveStorageMode} (Explicit: ${explicitMode || 'unset'}, Vercel: ${isOnVercel})`
        );

        const formData = await request.formData();

        if (process.env.APP_PASSWORD) {
            const clientPasswordHash = formData.get('passwordHash') as string | null;
            if (!clientPasswordHash) {
                console.error('Missing password hash.');
                return NextResponse.json({ error: 'Unauthorized: Missing password hash.' }, { status: 401 });
            }
            const serverPasswordHash = sha256(process.env.APP_PASSWORD);
            if (clientPasswordHash !== serverPasswordHash) {
                console.error('Invalid password hash.');
                return NextResponse.json({ error: 'Unauthorized: Invalid password.' }, { status: 401 });
            }
        }

        const mode = formData.get('mode') as 'generate' | 'edit' | null;
        const prompt = formData.get('prompt') as string | null;

        console.log(`Mode: ${mode}, Prompt: ${prompt ? prompt.substring(0, 50) + '...' : 'N/A'}`);

        if (!mode || !prompt) {
            return NextResponse.json({ error: 'Missing required parameters: mode and prompt' }, { status: 400 });
        }

        let result: OpenAI.Images.ImagesResponse;
        const model = 'gpt-image-1';

        if (mode === 'generate') {
            const n = parseInt((formData.get('n') as string) || '1', 10);
            const size = (formData.get('size') as OpenAI.Images.ImageGenerateParams['size']) || '1024x1024';
            const quality = (formData.get('quality') as OpenAI.Images.ImageGenerateParams['quality']) || 'high';
            const output_format =
                (formData.get('output_format') as OpenAI.Images.ImageGenerateParams['output_format']) || 'png';
            const output_compression_str = formData.get('output_compression') as string | null;
            const background =
                (formData.get('background') as OpenAI.Images.ImageGenerateParams['background']) || 'auto';
            const moderation =
                (formData.get('moderation') as OpenAI.Images.ImageGenerateParams['moderation']) || 'auto';

            const params: OpenAI.Images.ImageGenerateParams = {
                model,
                prompt,
                n: Math.max(1, Math.min(n || 1, 10)),
                size,
                quality,
                output_format,
                background,
                moderation
            };

            if ((output_format === 'jpeg' || output_format === 'webp') && output_compression_str) {
                const compression = parseInt(output_compression_str, 10);
                if (!isNaN(compression) && compression >= 0 && compression <= 100) {
                    params.output_compression = compression;
                }
            }

            console.log('Calling OpenAI generate with params:', params);
            result = await openai.images.generate(params);
        } else if (mode === 'edit') {
            // Check if this is a coloring page request
            const coloringPageType = formData.get('coloringPageType') as string | null;
            const nameOrMessage = formData.get('nameOrMessage') as string | null;
            const background = formData.get('background') as string | null;
            const sceneDescription = formData.get('sceneDescription') as string | null;
            const orientation = formData.get('orientation') as string | null;
            
            let actualPrompt = prompt;
            let actualSize: string | undefined = 'auto';
            let actualQuality: OpenAI.Images.ImageEditParams['quality'] = 'high'; // Force high quality for coloring pages
            let n = 1; // Always generate 1 image for coloring pages

            if (coloringPageType) {
                // This is a coloring page request - handle specially
                const individualNamesJson = formData.get('individualNames') as string | null;
                let individualNames: string[] = [];
                
                if (individualNamesJson) {
                    try {
                        individualNames = JSON.parse(individualNamesJson);
                    } catch (e) {
                        console.error('Error parsing individual names:', e);
                        individualNames = [];
                    }
                }

                // Generate coloring page specific prompt
                actualPrompt = generateColoringPagePrompt(
                    coloringPageType,
                    nameOrMessage || '',
                    individualNames,
                    background || 'plain',
                    sceneDescription || undefined
                );

                // Set size based on orientation
                if (orientation === 'landscape') {
                    actualSize = '1536x1024';
                } else {
                    actualSize = '1024x1536'; // default to portrait
                }

                console.log('Coloring page request detected:', {
                    type: coloringPageType,
                    orientation,
                    background,
                    nameOrMessage,
                    individualNames
                });
                console.log('Generated prompt:', actualPrompt);
            } else {
                // Regular edit mode
                n = parseInt((formData.get('n') as string) || '1', 10);
                const size = formData.get('size') as string || 'auto';
                const quality = (formData.get('quality') as OpenAI.Images.ImageEditParams['quality']) || 'high';
                
                actualSize = size;
                actualQuality = quality;
            }

            const imageFiles: File[] = [];
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('image_') && value instanceof File) {
                    imageFiles.push(value);
                }
            }

            if (imageFiles.length === 0) {
                return NextResponse.json({ error: 'No image file provided for editing.' }, { status: 400 });
            }

            const maskFile = formData.get('mask') as File | null;

            const params: OpenAI.Images.ImageEditParams = {
                model,
                prompt: actualPrompt,
                image: imageFiles,
                n: Math.max(1, Math.min(n, 10)),
                size: actualSize === 'auto' ? undefined : (actualSize as OpenAI.Images.ImageEditParams['size']),
                quality: actualQuality === 'auto' ? undefined : actualQuality
            };

            if (maskFile) {
                params.mask = maskFile;
            }

            console.log('Calling OpenAI edit with params:', {
                ...params,
                image: `[${imageFiles.map((f) => f.name).join(', ')}]`,
                mask: maskFile ? maskFile.name : 'N/A',
                prompt: actualPrompt.substring(0, 100) + '...'
            });
            result = await openai.images.edit(params);
        } else {
            return NextResponse.json({ error: 'Invalid mode specified' }, { status: 400 });
        }

        console.log('OpenAI API call successful.');

        if (!result || !Array.isArray(result.data) || result.data.length === 0) {
            console.error('Invalid or empty data received from OpenAI API:', result);
            return NextResponse.json({ error: 'Failed to retrieve image data from API.' }, { status: 500 });
        }

        const savedImagesData = await Promise.all(
            result.data.map(async (imageData, index) => {
                if (!imageData.b64_json) {
                    console.error(`Image data ${index} is missing b64_json.`);
                    throw new Error(`Image data at index ${index} is missing base64 data.`);
                }
                const buffer = Buffer.from(imageData.b64_json, 'base64');
                const timestamp = Date.now();

                const fileExtension = validateOutputFormat(formData.get('output_format'));
                const filename = `${timestamp}-${index}.${fileExtension}`;

                let fileId: string | undefined;
                
                if (effectiveStorageMode === 'appwrite') {
                    try {
                        // Upload to Appwrite Storage
                        const storage = await getStorage();
                        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID!;
                        
                        // Create a File object from the buffer
                        const mimeType = fileExtension === 'png' ? 'image/png' : fileExtension === 'jpeg' ? 'image/jpeg' : 'image/webp';
                        const file = new File([buffer], filename, { type: mimeType });
                        
                        const uploadResult = await storage.createFile(
                            bucketId,
                            ID.unique(),
                            file
                        );
                        
                        fileId = uploadResult.$id;
                        console.log(`Successfully uploaded image to Appwrite: ${fileId}`);
                    } catch (error) {
                        console.error('Error uploading to Appwrite Storage:', error);
                        // Fall back to base64 if upload fails
                    }
                }

                const imageResult: { filename: string; b64_json: string; fileId?: string; path?: string; output_format: string } = {
                    filename: filename,
                    b64_json: imageData.b64_json,
                    output_format: fileExtension
                };

                if (fileId) {
                    imageResult.fileId = fileId;
                    imageResult.path = `/api/image/${fileId}`;
                }

                return imageResult;
            })
        );

        console.log(`All images processed. Mode: ${effectiveStorageMode}`);

        return NextResponse.json({ images: savedImagesData, usage: result.usage });
    } catch (error: unknown) {
        console.error('Error in /api/images:', error);

        let errorMessage = 'An unexpected error occurred.';
        let status = 500;

        if (error instanceof Error) {
            errorMessage = error.message;
            if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
                status = error.status;
            }
        } else if (typeof error === 'object' && error !== null) {
            if ('message' in error && typeof error.message === 'string') {
                errorMessage = error.message;
            }
            if ('status' in error && typeof error.status === 'number') {
                status = error.status;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}

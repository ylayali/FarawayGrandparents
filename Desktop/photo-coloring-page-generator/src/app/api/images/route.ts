import crypto from 'crypto';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL
});

const outputDir = path.resolve(process.cwd(), 'generated-images');

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

async function ensureOutputDirExists() {
    try {
        await fs.access(outputDir);
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
            try {
                await fs.mkdir(outputDir, { recursive: true });
                console.log(`Created output directory: ${outputDir}`);
            } catch (mkdirError) {
                console.error(`Error creating output directory ${outputDir}:`, mkdirError);
                throw new Error('Failed to create image output directory.');
            }
        } else {
            console.error(`Error accessing output directory ${outputDir}:`, error);
            throw new Error(
                `Failed to access or ensure image output directory exists. Original error: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Function to generate coloring page prompts based on type and parameters
function generateColoringPagePrompt(
    type: string,
    nameOrMessage: string,
    individualNames: string[],
    background: string,
    sceneDescription?: string
): string {
    // Determine background text
    let backgroundText: string;
    if (background === 'plain') {
        backgroundText = 'plain white';
    } else if (background === 'mindful-pattern') {
        backgroundText = 'abstract pattern suitable for mindful coloring';
    } else if (background === 'scene' && sceneDescription) {
        backgroundText = sceneDescription;
    } else {
        backgroundText = 'plain white'; // fallback
    }

    switch (type) {
        case 'straight-copy':
            return `turn the attached photo into a bold black and white line drawing suitable for a coloring page, using ONLY pure black lines on white background with NO gray shades or gradients. ensure accurate facial features are maintained with clear, bold black outlines. write ${nameOrMessage || '[NAME]'} in friendly white letters with thick black outline, suited to a coloring page. place the writing unobtrusively on top of the line drawing, ensuring it doesn't obscure the subject's face. finally center the whole thing, as large as possible whilst still looking elegant, on a ${backgroundText} background. use only black and white - no gray tones whatsoever.`;

        case 'facial-portrait':
            let facialPrompt = `turn the attached photos into bold black and white line drawings suitable for a coloring page, using ONLY pure black lines on white background with NO gray shades or gradients. ensure accurate facial features are maintained with clear, bold black outlines. place each result inside its own white box with thick black outline.`;
            
            // Add individual names for each photo
            individualNames.forEach((name, index) => {
                if (name.trim()) {
                    facialPrompt += ` directly below the box containing PHOTO(${index + 1}) write ${name} in friendly white letters with thick black outline, suited to a coloring page.`;
                }
            });

            facialPrompt += ` arrange all these elements elegantly`;
            
            if (nameOrMessage.trim()) {
                facialPrompt += ` and write ${nameOrMessage} using the same style letters as individual names and position it somewhere unobtrusive`;
            }

            facialPrompt += `. place all of this on top of a ${backgroundText} background. use only pure black and white - no gray tones whatsoever.`;

            return facialPrompt;

        case 'cartoon-portrait':
            let cartoonPrompt = `turn the attached photos into bold black and white line drawings suitable for a coloring page, using ONLY pure black lines on white background with NO gray shades or gradients. ensure accurate facial features are maintained with clear, bold black outlines.`;
            
            // Add activities for each photo
            individualNames.forEach((activity, index) => {
                if (activity.trim()) {
                    cartoonPrompt += ` Give the result from PHOTO(${index + 1}) a cartoony body engaged in ${activity}.`;
                }
            });

            cartoonPrompt += ` the body should be drawn in a matching style suitable for a colouring page with bold black outlines only. position the figures elegantly and in a way that makes sense on top of a ${backgroundText} background.`;
            
            if (nameOrMessage.trim()) {
                cartoonPrompt += ` finally write ${nameOrMessage} in friendly white letters with thick black outline suitable for a colouring page and place it somewhere in the picture that it doesn't cover anything important`;
            }

            cartoonPrompt += `. use only pure black and white - no gray tones whatsoever.`;

            return cartoonPrompt;

        default:
            return 'turn the attached photo into a bold black and white line drawing suitable for a coloring page, using ONLY pure black lines on white background with NO gray shades or gradients';
    }
}

export async function POST(request: NextRequest) {
    console.log('Received POST request to /api/images');

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set.');
        return NextResponse.json({ error: 'Server configuration error: API key not found.' }, { status: 500 });
    }
    try {
        let effectiveStorageMode: 'fs' | 'indexeddb';
        const explicitMode = process.env.NEXT_PUBLIC_IMAGE_STORAGE_MODE;
        const isOnVercel = process.env.VERCEL === '1';

        if (explicitMode === 'fs') {
            effectiveStorageMode = 'fs';
        } else if (explicitMode === 'indexeddb') {
            effectiveStorageMode = 'indexeddb';
        } else if (isOnVercel) {
            effectiveStorageMode = 'indexeddb';
        } else {
            effectiveStorageMode = 'fs';
        }
        console.log(
            `Effective Image Storage Mode: ${effectiveStorageMode} (Explicit: ${explicitMode || 'unset'}, Vercel: ${isOnVercel})`
        );

        if (effectiveStorageMode === 'fs') {
            await ensureOutputDirExists();
        }

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
            const quality = (formData.get('quality') as OpenAI.Images.ImageGenerateParams['quality']) || 'auto';
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
            let actualQuality: OpenAI.Images.ImageEditParams['quality'] = 'medium'; // Force medium quality for coloring pages
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
                const quality = (formData.get('quality') as OpenAI.Images.ImageEditParams['quality']) || 'auto';
                
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

                if (effectiveStorageMode === 'fs') {
                    const filepath = path.join(outputDir, filename);
                    console.log(`Attempting to save image to: ${filepath}`);
                    await fs.writeFile(filepath, buffer);
                    console.log(`Successfully saved image: ${filename}`);
                } else {
                }

                const imageResult: { filename: string; b64_json: string; path?: string; output_format: string } = {
                    filename: filename,
                    b64_json: imageData.b64_json,
                    output_format: fileExtension
                };

                if (effectiveStorageMode === 'fs') {
                    imageResult.path = `/api/image/${filename}`;
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

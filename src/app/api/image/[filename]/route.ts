import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/appwrite-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
    const { filename } = await params;

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Basic security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    try {
        // Get file from Appwrite Storage
        const storage = await getStorage();
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID!;
        
        // Get file preview/download
        const fileView = await storage.getFileView(bucketId, filename);
        
        // The fileView is a Buffer, so we can return it directly
        return new NextResponse(fileView, {
            status: 200,
            headers: {
                'Content-Type': 'image/png', // Default to PNG, Appwrite will handle correct type
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error: unknown) {
        console.error(`Error serving image ${filename}:`, error);
        if (typeof error === 'object' && error !== null && 'code' in error && (error.code === 404 || error.code === 'ENOENT')) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

# Static Website + Appwrite Backend Setup

## Overview

You can host your form on **any static web server** (your own server, GitHub Pages, Netlify, etc.) and use **Appwrite Functions** for all backend logic.

## Architecture

```
Your Static Website (HTML/CSS/JS)
          ↓
    Calls Functions
          ↓
   Appwrite Functions (Backend)
          ↓
   Appwrite Storage + Database
```

## What You Need

### 1. Convert Next.js to Static HTML/CSS/JS

Your Next.js app will be converted to pure static files that can be hosted anywhere.

### 2. Create Appwrite Functions

Replace each API route with an Appwrite Function:
- Image generation
- Image serving  
- Image deletion
- Stripe checkout
- Stripe webhooks

### 3. Update Frontend

Change all API calls to use Appwrite Functions instead of Next.js API routes.

---

## Step-by-Step Implementation

### Step 1: Convert Next.js to Static Export

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // This generates static HTML
  images: {
    unoptimized: true,  // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Important: Set your base path if hosting in a subdirectory
  // basePath: '/my-app',  // Uncomment if needed
};

export default nextConfig;
```

Build static files:

```bash
npm run build
# Generates 'out' directory with static files
```

### Step 2: Create Appwrite Functions

#### Function 1: Image Generation

Create in Appwrite Console → Functions:

```javascript
// File: functions/image-generation/src/main.js
import { Client, Storage, ID } from 'node-appwrite';
import OpenAI from 'openai';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(client);
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  try {
    const data = JSON.parse(req.body);
    const { prompt, mode, coloringPageType, orientation } = data;

    log('Generating image with OpenAI...');

    // Generate image with OpenAI
    let result;
    if (mode === 'edit') {
      // For edit mode with image upload
      // You'll need to handle file uploads differently
      result = await openai.images.edit({
        model: 'gpt-image-1',
        prompt,
        // ... other params
      });
    } else {
      result = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: orientation === 'landscape' ? '1536x1024' : '1024x1536',
        quality: 'high',
        output_format: 'png',
      });
    }

    // Upload to Appwrite Storage
    const buffer = Buffer.from(result.data[0].b64_json, 'base64');
    const filename = `${Date.now()}.png`;
    
    const file = await storage.createFile(
      process.env.BUCKET_ID,
      ID.unique(),
      new File([buffer], filename, { type: 'image/png' })
    );

    log('Image uploaded successfully');

    return res.json({
      success: true,
      fileId: file.$id,
      filename: filename
    });

  } catch (err) {
    error('Error: ' + err.message);
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
};
```

**package.json** for this function:
```json
{
  "name": "image-generation",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^20.1.0",
    "openai": "^4.96.0"
  }
}
```

#### Function 2: Image Deletion

```javascript
// File: functions/image-deletion/src/main.js
import { Client, Storage } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(client);

  try {
    const { fileIds } = JSON.parse(req.body);

    const results = await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          await storage.deleteFile(process.env.BUCKET_ID, fileId);
          return { fileId, success: true };
        } catch (err) {
          return { fileId, success: false, error: err.message };
        }
      })
    );

    return res.json({
      success: true,
      results
    });

  } catch (err) {
    error('Error: ' + err.message);
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
};
```

### Step 3: Update Frontend to Call Appwrite Functions

Update your React components to call Appwrite Functions:

```typescript
// Before (API route)
const response = await fetch('/api/images', {
  method: 'POST',
  body: formData
});
const data = await response.json();

// After (Appwrite Function)
import { Client, Functions } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const functions = new Functions(client);

// For image generation
const execution = await functions.createExecution(
  'your-image-generation-function-id',
  JSON.stringify({
    prompt,
    mode,
    coloringPageType,
    orientation
  }),
  false // async
);

const data = JSON.parse(execution.responseBody);
```

### Step 4: Handle Image Display

Images from Appwrite Storage can be accessed via:

```typescript
// Get image URL
const imageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID}/files/${fileId}/view`;

// Or use Appwrite SDK
import { Storage } from 'appwrite';
const storage = new Storage(client);
const imageUrl = storage.getFileView(bucketId, fileId);

// Display in React
<img src={imageUrl} alt="Generated coloring page" />
```

### Step 5: Build and Deploy Static Site

```bash
# Build static files
npm run build

# This creates 'out' directory with:
# - index.html
# - _next/static/...
# - All your static assets

# Deploy to your static host
# For example:
scp -r out/* user@yourserver.com:/var/www/html/
```

---

## Static Hosting Options

### Option A: Your Own Server

Upload the `out` directory to your web server:

```bash
# Using SSH/SCP
scp -r out/* user@yourserver.com:/var/www/html/

# Or using FTP client
# Upload all files in 'out' directory
```

Nginx config example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option B: GitHub Pages

1. Push `out` directory to GitHub
2. Enable GitHub Pages in repository settings
3. Point to the branch with your `out` directory

### Option C: Netlify (Free)

```bash
npm install -g netlify-cli
netlify deploy --dir=out --prod
```

### Option D: AWS S3 + CloudFront

Upload to S3 bucket configured for static website hosting.

---

## Environment Variables

### For Building (next.config.ts)

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_bucket_id
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_IMAGE_GENERATION_FUNCTION_ID=your_function_id
```

### For Appwrite Functions

Set in Appwrite Console for each function:
```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
BUCKET_ID=your_bucket_id
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key (if using Stripe)
```

---

## Complete Migration Checklist

- [ ] Update next.config.ts for static export
- [ ] Create Appwrite Function for image generation
- [ ] Create Appwrite Function for image deletion
- [ ] Create Appwrite Function for Stripe checkout (if needed)
- [ ] Create Appwrite Function for Stripe webhook (if needed)
- [ ] Update all fetch('/api/...') calls to use Appwrite Functions
- [ ] Update image display to use Appwrite Storage URLs
- [ ] Test locally with `npm run build` and serve the `out` directory
- [ ] Deploy static files to your hosting
- [ ] Configure environment variables
- [ ] Test all functionality

---

## Example: Update a Component

**Before (with API route):**
```typescript
// src/components/coloring-page-form.tsx
const handleSubmit = async () => {
  const response = await fetch('/api/images', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  setGeneratedImage(data.images[0]);
};
```

**After (with Appwrite Function):**
```typescript
// src/components/coloring-page-form.tsx
import { Functions } from 'appwrite';
import { getClient } from '@/lib/appwrite';

const handleSubmit = async () => {
  const client = getClient();
  const functions = new Functions(client);
  
  const execution = await functions.createExecution(
    process.env.NEXT_PUBLIC_IMAGE_GENERATION_FUNCTION_ID!,
    JSON.stringify({
      prompt,
      mode: 'edit',
      coloringPageType,
      orientation,
      // ... other params
    }),
    false
  );
  
  const data = JSON.parse(execution.responseBody);
  if (data.success) {
    setGeneratedImage({
      fileId: data.fileId,
      url: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID}/files/${data.fileId}/view`
    });
  }
};
```

---

## Advantages of This Approach

✅ **Host anywhere**: Your own server, GitHub Pages, Netlify, etc.
✅ **Full control**: Complete control over static files
✅ **Cost-effective**: Static hosting is cheap/free
✅ **Scalable backend**: Appwrite Functions auto-scale
✅ **Separation**: Frontend and backend are separate

## Disadvantages

❌ **More setup**: Need to create multiple Appwrite Functions
❌ **No SSR**: Lose server-side rendering benefits
❌ **File uploads**: More complex with static sites + functions
❌ **Development time**: 20-40 hours to migrate

---

## Quick Decision Guide

**Choose Static Site + Appwrite Functions IF:**
- You want to host on your own server
- You don't need SSR (Server-Side Rendering)
- You're comfortable with Appwrite Functions
- You want everything in Appwrite ecosystem

**Choose Vercel + Appwrite (current setup) IF:**
- You want the easiest deployment
- You need SSR capabilities
- You want automatic deployments
- You want to minimize development time (it's already done!)

---

## Need Help Migrating?

I can help you:
1. Create all required Appwrite Functions
2. Update your frontend components
3. Set up the build process
4. Deploy to your static host

Just let me know and I'll start with creating the functions!

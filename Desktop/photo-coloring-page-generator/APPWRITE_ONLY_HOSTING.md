# Hosting on Appwrite Only

## Important: Appwrite Limitations

**Appwrite does NOT natively support Next.js hosting** the way Vercel does. Appwrite is a Backend-as-a-Service (BaaS) platform, not a frontend hosting platform.

## Your Options for Appwrite-Only Hosting

### Option 1: Convert to Appwrite Functions (Recommended)

Convert your Next.js API routes into Appwrite Cloud Functions and host the frontend as a static site.

#### What Needs to Change:

1. **Convert Next.js to Static Export**
   ```js
   // next.config.ts
   const nextConfig = {
     output: 'export',  // Generate static HTML
     images: {
       unoptimized: true  // Required for static export
     }
   }
   ```

2. **Migrate API Routes to Appwrite Functions**
   
   Each API route becomes an Appwrite Function:
   - `src/app/api/images/route.ts` → Appwrite Function
   - `src/app/api/image/[filename]/route.ts` → Appwrite Function
   - `src/app/api/image-delete/route.ts` → Appwrite Function
   - `src/app/api/stripe/webhook/route.ts` → Appwrite Function
   - `src/app/api/stripe/checkout/route.ts` → Appwrite Function

3. **Update Frontend to Call Appwrite Functions**
   ```typescript
   // Instead of fetch('/api/images')
   const response = await functions.createExecution(
     'image-generation-function',
     JSON.stringify(data)
   );
   ```

#### Steps:

1. **Create Appwrite Functions** (one per API route)
2. **Deploy each function** with your logic
3. **Build static Next.js**: `npm run build`
4. **Upload static files** to Appwrite Storage or use Appwrite's hosting (if available)
5. **Update all API calls** in frontend to use Appwrite Functions

**Estimated Effort**: 20-40 hours (significant refactoring required)

---

### Option 2: Hybrid Approach (Easier)

Keep using current code structure but deploy differently:

1. **Frontend**: Deploy Next.js to Vercel (free tier)
2. **Backend**: Use Appwrite for storage, database, auth
3. **Benefits**:
   - No code changes needed
   - Best of both platforms
   - Easier to maintain

**Estimated Effort**: 1 hour (just follow existing setup)

---

### Option 3: Self-Hosted Appwrite + Docker

Host both Appwrite AND your Next.js app on your own server:

1. **Setup Docker Compose** with:
   - Appwrite (self-hosted)
   - Next.js app container
   - Nginx reverse proxy

2. **Requirements**:
   - VPS/Server (DigitalOcean, AWS, etc.)
   - Docker knowledge
   - Server maintenance

**Estimated Effort**: 10-20 hours for setup and configuration

---

## Detailed: Option 1 Implementation

If you want to go fully Appwrite, here's what to do:

### Step 1: Install Appwrite Functions SDK

```bash
npm install node-appwrite
```

### Step 2: Create Appwrite Function for Image Generation

Create a new function in Appwrite Console:

```javascript
// Appwrite Function: image-generation
import { Client, Storage, ID } from 'node-appwrite';
import OpenAI from 'openai';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(client);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { prompt, mode } = JSON.parse(req.body);
    
    // Call OpenAI
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      // ... other params
    });

    // Upload to storage
    const buffer = Buffer.from(result.data[0].b64_json, 'base64');
    const file = await storage.createFile(
      process.env.BUCKET_ID,
      ID.unique(),
      new File([buffer], 'image.png', { type: 'image/png' })
    );

    return res.json({ fileId: file.$id });
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message }, 500);
  }
};
```

### Step 3: Update Frontend Calls

```typescript
// Before (API route)
const response = await fetch('/api/images', {
  method: 'POST',
  body: formData
});

// After (Appwrite Function)
import { Functions } from 'appwrite';

const functions = new Functions(client);
const execution = await functions.createExecution(
  'image-generation-function-id',
  JSON.stringify({ prompt, mode }),
  false // async
);
```

### Step 4: Convert Next.js to Static

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

### Step 5: Build and Deploy

```bash
# Build static site
npm run build

# Upload 'out' directory to Appwrite Storage
# Configure as static website hosting
```

---

## Comparison Table

| Feature | Vercel + Appwrite | Appwrite Only (Functions) | Self-Hosted |
|---------|------------------|--------------------------|-------------|
| Setup Time | 1 hour | 20-40 hours | 10-20 hours |
| Code Changes | Minimal | Extensive | Minimal |
| SSR Support | ✅ Yes | ❌ No | ✅ Yes |
| API Routes | ✅ Native | ⚠️ Must convert | ✅ Native |
| Cost (small) | Free | Free | $5-20/month |
| Maintenance | Easy | Medium | Complex |
| Performance | Excellent | Good | Variable |
| Scalability | Automatic | Manual | Manual |

---

## My Recommendation

**Use Option 2: Hybrid Approach (Vercel + Appwrite)**

**Why:**
1. ✅ Your current code works as-is
2. ✅ Best performance (Vercel's Edge Network + Appwrite)
3. ✅ Both platforms have free tiers
4. ✅ Easy to maintain and update
5. ✅ Automatic deployments
6. ✅ No complex refactoring needed

**When to use Appwrite Functions:**
- You need everything in one platform for compliance
- You have team expertise in Appwrite Functions
- You're willing to invest significant development time

**When to use Self-Hosted:**
- You need complete control
- You have DevOps expertise
- You're comfortable managing servers

---

## If You Still Want Appwrite-Only

I can help you:
1. Create Appwrite Functions for each API route
2. Convert Next.js to static export
3. Set up deployment scripts
4. Update all frontend API calls

But I strongly recommend the hybrid approach unless you have specific requirements that mandate Appwrite-only hosting.

---

## Appwrite Static Hosting

**Note**: As of December 2024, Appwrite doesn't have built-in static site hosting like Vercel. You would need to:

1. **Use Appwrite Storage for static files** (with public bucket)
2. **Set up a CDN** in front of it
3. **Configure proper MIME types** for HTML/CSS/JS files

This is significantly more complex than using Vercel.

---

## Questions?

Let me know if you want to proceed with:
- Option 1: Full Appwrite migration (I'll create the functions)
- Option 2: Hybrid approach (current setup - recommended)
- Option 3: Self-hosted setup (I'll create Docker configs)

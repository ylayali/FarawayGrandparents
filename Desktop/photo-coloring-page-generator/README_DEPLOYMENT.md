# Photo Coloring Page Generator - Deployment Instructions

## Quick Start: Push to GitHub and Deploy

### Step 1: Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
```

### Step 2: Create `.env.example` Template

Create a template file so others know what environment variables are needed:

```bash
# Create .env.example (without actual values)
cat > .env.example << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_bucket_id
APPWRITE_API_KEY=your_api_key

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Image Storage Mode
NEXT_PUBLIC_IMAGE_STORAGE_MODE=appwrite
EOF
```

### Step 3: Verify Sensitive Files Are Excluded

Your `.gitignore` already excludes:
- ✅ `.env*` files (API keys safe)
- ✅ `node_modules/` (dependencies)
- ✅ `.next/` and `/out/` (build files)
- ✅ `generated-images/` (local images)

**IMPORTANT**: Double-check `.env.local` won't be committed:

```bash
# This should show no .env files
git status --ignored | grep .env

# If you see .env files listed, they're correctly ignored
```

### Step 4: Add All Files to Git

```bash
# Add all files
git add .

# Verify what will be committed (should NOT include .env.local)
git status

# Check no sensitive files are staged
git diff --cached --name-only | grep -E ".env|api.*key|secret"
# This should return nothing
```

### Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: Photo coloring page generator with Appwrite integration

- Fixed filesystem operations for Vercel deployment
- Integrated Appwrite Storage for image management
- Added comprehensive deployment documentation
- Configured for Vercel + Appwrite hosting"
```

### Step 6: Create GitHub Repository

**Option A: Via GitHub Website**
1. Go to https://github.com/new
2. Repository name: `photo-coloring-page-generator` (or your choice)
3. Description: "AI-powered photo to coloring page generator"
4. Choose Public or Private
5. **Don't** initialize with README (you already have files)
6. Click "Create repository"

**Option B: Via GitHub CLI** (if installed)
```bash
gh repo create photo-coloring-page-generator --public --source=. --remote=origin
```

### Step 7: Push to GitHub

GitHub will show you commands, but here they are:

```bash
# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/photo-coloring-page-generator.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/photo-coloring-page-generator.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 8: Set Up Appwrite (5 minutes)

Before deploying to Vercel, set up Appwrite:

1. **Create Storage Bucket**
   - Go to https://cloud.appwrite.io
   - Storage → Create Bucket
   - Name: `generated-images`
   - Max size: 10MB
   - Allowed: `png, jpg, jpeg, webp`
   - **Copy Bucket ID**

2. **Create API Key**
   - Settings → API Keys → Create
   - Scopes: `files.read`, `files.write`, `files.delete`
   - **Copy API Key**

3. **Save these values** - you'll need them for Vercel

### Step 9: Deploy to Vercel

**Option A: Via Vercel Website (Recommended)**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=68baa022000486a3c1e2
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=68fb69920001f8b307dd
   NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
   NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=[your bucket id from step 8]
   APPWRITE_API_KEY=[your api key from step 8]
   OPENAI_API_KEY=[your openai key]
   NEXT_PUBLIC_IMAGE_STORAGE_MODE=appwrite
   ```

5. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

### Step 10: Configure Domain (Optional)

In Vercel Dashboard:
1. Go to your project
2. Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Environment Variables Reference

### Required for All Deployments

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Appwrite endpoint | `https://cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Your project ID | Appwrite Console → Settings |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | Your database ID | Appwrite Console → Databases |
| `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID` | Storage bucket ID | Appwrite Console → Storage |
| `APPWRITE_API_KEY` | Server API key | Appwrite Console → Settings → API Keys |
| `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` | Profiles collection | `profiles` |
| `NEXT_PUBLIC_IMAGE_STORAGE_MODE` | Storage mode | `appwrite` |

### Optional (for Stripe payments)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | https://dashboard.stripe.com/apikeys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret | https://dashboard.stripe.com/webhooks |

---

## Post-Deployment Testing

### 1. Test Image Generation
- Visit your deployed URL
- Upload a photo
- Generate a coloring page
- Verify image displays

### 2. Check Logs
- **Vercel**: Dashboard → Your Project → Logs
- **Appwrite**: Console → Storage → Your Bucket

### 3. Verify Storage
- Go to Appwrite Console → Storage
- Check your bucket has the generated files

---

## Continuous Deployment

Once set up, future deployments are automatic:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys!
```

---

## Troubleshooting

### "API key not found"
- Verify all environment variables are set in Vercel
- Check for typos in variable names
- Redeploy after adding variables

### "Bucket not found"
- Ensure bucket ID is correct
- Verify bucket exists in Appwrite
- Check API key has storage permissions

### Build fails
- Check Vercel build logs
- Verify all dependencies in package.json
- Ensure TypeScript errors don't block build

### Images not displaying
- Check Appwrite bucket permissions
- Verify bucket allows public read access
- Check browser console for errors

---

## Security Checklist

Before pushing to GitHub, verify:

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in committed files
- [ ] `.env.example` has placeholder values only
- [ ] Sensitive data excluded from repository

After deployment:

- [ ] All environment variables set in Vercel
- [ ] Variables marked as "sensitive" in Vercel
- [ ] Appwrite bucket has appropriate permissions
- [ ] API keys have minimal required scopes

---

## Repository Structure

```
photo-coloring-page-generator/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── lib/             # Utilities (Appwrite, etc.)
├── public/              # Static assets
├── .env.example         # Environment template
├── .gitignore          # Excluded files
├── package.json        # Dependencies
├── next.config.ts      # Next.js configuration
├── DEPLOYMENT_GUIDE.md # Comprehensive deployment guide
├── QUICK_SETUP.md      # 5-minute setup guide
└── README_DEPLOYMENT.md # This file (GitHub setup)
```

---

## Need Help?

- **Deployment Issues**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Setup**: See [QUICK_SETUP.md](./QUICK_SETUP.md)
- **Static Hosting**: See [STATIC_SITE_WITH_APPWRITE.md](./STATIC_SITE_WITH_APPWRITE.md)
- **Appwrite Only**: See [APPWRITE_ONLY_HOSTING.md](./APPWRITE_ONLY_HOSTING.md)

---

## What's Already Fixed

✅ File system operations removed (Vercel-compatible)
✅ Appwrite Storage integration complete
✅ All API routes updated for serverless
✅ Environment variables configured
✅ Security: .gitignore properly configured

**You're ready to deploy!** Just follow the steps above.

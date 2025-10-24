# Appwrite Setup Guide for Photo Coloring Page Generator

This guide will walk you through setting up Appwrite from scratch for your application.

## 📋 Step 1: Create Your Appwrite Project

### 1.1 Sign Up / Log In
1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up for a free account or log in
3. You'll get 300 credits per month on the free tier (perfect for hundreds of users!)

### 1.2 Create a New Project
1. Click **"Create Project"**
2. Name it: `Photo Coloring Page Generator` (or your preferred name)
3. **Copy and save your Project ID** - you'll need this!

Example: `67abc123def456789ghi`

---

## 📊 Step 2: Create Your Database

### 2.1 Create a Database
1. In your Appwrite Console, click **"Databases"** in the left sidebar
2. Click **"Create Database"**
3. Name it: `main`
4. **Copy and save your Database ID**

Example: `main_db_67xyz123`

### 2.2 Create the Profiles Collection
1. Inside your `main` database, click **"Create Collection"**
2. Name it: `profiles`
3. **Copy and save your Collection ID**

Example: `profiles_67abc789`

### 2.3 Add Attributes to Profiles Collection

Click on your `profiles` collection, then click **"Attributes"** tab, then **"Create Attribute"** for each:

| Attribute Name | Type | Size | Required | Default | Array |
|----------------|------|------|----------|---------|-------|
| `email` | String | 255 | ✅ Yes | - | ❌ No |
| `full_name` | String | 255 | ✅ Yes | - | ❌ No |
| `credits` | Integer | - | ✅ Yes | 3 | ❌ No |
| `subscription_tier` | String | 50 | ✅ Yes | "free" | ❌ No |
| `created_at` | DateTime | - | ✅ Yes | - | ❌ No |
| `updated_at` | DateTime | - | ✅ Yes | - | ❌ No |

**Important:** Click **"Create"** after adding each attribute!

### 2.4 Set Collection Permissions

Still in your `profiles` collection, go to the **"Settings"** tab:

1. Scroll to **"Permissions"**
2. Click **"Add Role"**
3. Add these permissions:

#### For READ permission:
- Select: **"Any authenticated user"** (or use document permissions)
- This allows users to read their own profile

#### For CREATE permission:
- Select: **"Any"**
- This allows new user registration

#### For UPDATE permission:
- Select: **"Any authenticated user"** (or use document permissions)
- This allows users to update their own profile

#### For DELETE permission:
- Select: **"None"** (only admins should delete)

**Alternatively**, you can use **Document Security** which is better:
1. Enable "Document Security" toggle
2. Then when creating documents, you'll set permissions per user like:
   - Read: `user:[USER_ID]`
   - Update: `user:[USER_ID]`

---

## 🔐 Step 3: Configure Authentication

### 3.1 Enable Email/Password Authentication
1. In Appwrite Console, click **"Auth"** in the left sidebar
2. Click on **"Settings"** tab
3. Find **"Email/Password"** method
4. Toggle it **ON** (should be enabled by default)

### 3.2 Configure Session Settings (Optional but Recommended)
1. Still in Auth > Settings
2. Set **"Session Length"**: 31536000 (1 year in seconds)
3. Save changes

---

## 🌐 Step 4: Add Your Platform

### 4.1 Add Web Platform
1. In Appwrite Console, click **"Settings"** at the bottom of the left sidebar
2. Go to **"Platforms"** tab
3. Click **"Add Platform"**
4. Select **"Web App"**
5. Configure:
   - **Name**: `Coloring Page App` (or your preferred name)
   - **Hostname**: `localhost` (for development)
   - For production, add: `yourdomain.com` (without http://)

**Note:** You'll need to add production hostname before deploying!

---

## 🔑 Step 5: Update Your Environment Variables

Now that you have all the IDs, update your `.env.local` file:

```bash
# ========================================
# APPWRITE CONFIGURATION
# ========================================
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=your_profiles_collection_id_here

# ========================================
# OPENAI CONFIGURATION
# ========================================
OPENAI_API_KEY=your_existing_openai_key

# ========================================
# STRIPE CONFIGURATION
# ========================================
STRIPE_PUBLISHABLE_KEY=your_existing_stripe_key
STRIPE_SECRET_KEY=your_existing_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_existing_stripe_key

# ========================================
# OTHER CONFIGURATION
# ========================================
NODE_ENV=development
NEXT_PUBLIC_VERCEL_ENV=development
NEXT_PUBLIC_IMAGE_STORAGE_MODE=fs
```

**Replace these with your actual IDs:**
- `your_project_id_here` → Your Project ID from Step 1.2
- `your_database_id_here` → Your Database ID from Step 2.1
- `your_profiles_collection_id_here` → Your Collection ID from Step 2.2

---

## ✅ Step 6: Test Your Setup

### 6.1 Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C in terminal)
npm run dev
```

### 6.2 Test Sign Up
1. Go to http://localhost:3000
2. Click **"Sign In"** button
3. Click **"Sign Up"** tab
4. Create a test account:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `testpassword123`

### 6.3 Verify in Appwrite Console
1. Go to Appwrite Console
2. Click **"Auth"** → **"Users"**
3. You should see your test user!
4. Click **"Databases"** → `main` → `profiles`
5. You should see a profile document for your user with 10 credits!

### 6.4 Test the App
1. Upload a photo
2. Select a coloring page type
3. Generate a coloring page
4. Check your credits decreased by 1-2
5. Verify in Appwrite Console that credits were deducted

---

## 🚀 Step 7: Deploy to Production

### 7.1 Choose a Hosting Platform
Options:
- **Vercel** (recommended for Next.js) - https://vercel.com
- **Netlify** - https://netlify.com
- **Railway** - https://railway.app

### 7.2 For Vercel Deployment:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Appwrite setup complete"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables in Vercel**
   - In Vercel project settings, go to "Environment Variables"
   - Add ALL variables from your `.env.local`:
     ```
     NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
     NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
     NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=...
     OPENAI_API_KEY=...
     STRIPE_PUBLISHABLE_KEY=...
     STRIPE_SECRET_KEY=...
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
     ```

4. **Update Appwrite Platform**
   - Go to Appwrite Console → Settings → Platforms
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

5. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for deployment to complete
   - Test your production app!

### 7.3 Configure Stripe Webhook for Production
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook secret and add to Vercel environment variables

---

## 🔧 Troubleshooting

### Issue: "User not authenticated" error
**Solution:**
- Check that you've added `localhost` in Appwrite Platforms
- Clear browser cache and cookies
- Try signing out and in again

### Issue: Cannot create profile document
**Solution:**
- Verify Collection has CREATE permission set to "Any"
- Check that all required attributes exist
- Ensure attribute types match (credits = Integer, not String)

### Issue: Credits not updating
**Solution:**
- Check UPDATE permissions on profiles collection
- Verify the document ID matches the user ID
- Check browser console for errors

### Issue: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📚 Additional Resources

- **Appwrite Docs**: https://appwrite.io/docs
- **Appwrite Console**: https://cloud.appwrite.io/console
- **Community Discord**: https://appwrite.io/discord
- **Next.js + Appwrite Guide**: https://appwrite.io/docs/quick-starts/nextjs

---

## 🎯 Quick Checklist

- [ ] Created Appwrite project and saved Project ID
- [ ] Created database and saved Database ID
- [ ] Created profiles collection and saved Collection ID
- [ ] Added all 6 attributes to profiles collection
- [ ] Set collection permissions (READ, CREATE, UPDATE)
- [ ] Enabled Email/Password authentication
- [ ] Added localhost to Platforms
- [ ] Updated .env.local with all Appwrite IDs
- [ ] Tested sign up with test user
- [ ] Verified profile created in Appwrite Console
- [ ] Tested credit deduction
- [ ] Ready for production deployment!

---

## 💡 Pro Tips

1. **Free Tier Limits**: Appwrite Cloud free tier includes:
   - 75K API requests/month
   - 2GB bandwidth/month
   - Perfect for hundreds of users!

2. **Backup Your IDs**: Save your Project ID, Database ID, and Collection ID somewhere safe!

3. **Monitor Usage**: Check Appwrite Console dashboard to monitor your API usage

4. **Security**: Never commit `.env.local` to git - it's in `.gitignore` already

5. **Testing**: Use Appwrite's built-in API testing tools in the Console

---

Need help? Check the Appwrite docs or join their Discord community!

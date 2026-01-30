# GrooveSell Integration Setup Guide

This guide will help you integrate GrooveSell webhooks with your coloring page generator app.

## Overview

The integration uses GrooveSell webhooks to:
1. Create user accounts when customers purchase
2. Add credits to user accounts
3. Handle recurring monthly subscription payments
4. Enable affiliate commission tracking

## Prerequisites

- A GrooveSell account with products set up
- Your GrooveSell checkout URL (e.g., https://faraway.groovesell.com/checkout/f522b93c6f9a5b208da2eb3cd4787776)
- Appwrite project configured (already done)

## Step 1: Configure GrooveSell Products

### Product Setup
For each credit package in GrooveSell, you'll need to collect:

1. **Trial Package** (5 credits for $7.99)
   - Product ID: (Get from GrooveSell dashboard)
   - Checkout: Creates account with 5 credits
   - After 15 days: Automatically charges $14.99 and adds 10 credits

2. **Monthly Package** (10 credits for $14.99/month)
   - Product ID: (Get from GrooveSell dashboard)
   - Checkout: Adds 10 credits each month

3. **Annual Package** (120 credits for $249/year)
   - Product ID: (Get from GrooveSell dashboard)
   - Checkout: Adds 120 credits once per year

### Collect Product IDs
1. Log in to your GrooveSell dashboard
2. Navigate to Products
3. Click on each product
4. Copy the Product ID from the URL or product details
5. Save these IDs for Step 3

## Step 2: Configure Your GrooveSell Checkout Form

### Required Fields in Your GrooveSell Order Form

Your 2-step order form in GrooveSell must collect:

1. **Email Address** (required) - Used to find/create user account
2. **Password** (required) - Used to create account on first purchase
3. **Full Name** (optional) - Display name in the app

### Custom Fields (Optional)
If you want to track additional information, you can add custom fields in GrooveSell and pass them through webhooks.

## Step 3: Update Your App Configuration

### 1. Add GrooveSell Product IDs to Webhook Handler

Edit `src/app/api/groovesell/webhook/route.ts` and add your product IDs:

```typescript
const PRODUCT_CREDITS_MAP: Record<string, { credits: number; tier: string }> = {
  'your-trial-product-id-here': { credits: 5, tier: 'trial' },
  'your-monthly-product-id-here': { credits: 10, tier: 'premium' },
  'your-annual-product-id-here': { credits: 120, tier: 'pro' },
};
```

### 2. Add Webhook Secret to Environment Variables

Add to your `.env.local` file:

```bash
# GrooveSell Webhook Configuration
GROOVESELL_WEBHOOK_SECRET=your_webhook_secret_here
```

Get your webhook secret from GrooveSell dashboard (Settings > Webhooks).

## Step 4: Configure GrooveSell Webhooks

### Webhook URL
Your webhook endpoint is:
```
https://your-domain.com/api/groovesell/webhook
```

For local development, you can use ngrok or similar:
```
https://your-ngrok-url.ngrok.io/api/groovesell/webhook
```

### Events to Configure

In your GrooveSell dashboard, set up webhooks for these events:

1. **Purchase Completed** (or `purchase`)
   - Fires when someone completes initial purchase
   - Creates user account + adds trial credits

2. **Subscription Created** (or `subscription_created`)
   - Alternative event for new subscriptions

3. **Payment Completed** (or `payment_completed`)
   - Fires for all successful payments

4. **Subscription Renewed** (or `subscription_renewed` / `rebill`)
   - Fires on recurring monthly payments
   - Adds 10 credits each month

5. **Refund** (optional)
   - Track refunds (no credit action taken currently)

### Webhook Signature Verification

GrooveSell sends a signature in the `x-groovesell-signature` header. The webhook handler verifies this signature using your `GROOVESELL_WEBHOOK_SECRET` to ensure the webhook is legitimate.

## Step 5: Test the Integration

### Test 1: Webhook Endpoint Health Check
```bash
curl https://your-domain.com/api/groovesell/webhook
```

Expected response:
```json
{
  "message": "GrooveSell webhook endpoint is active",
  "status": "ready",
  "configured_products": ["trial-product-id", "monthly-product-id", ...]
}
```

### Test 2: Test Purchase Flow
1. Click "Buy Credits" in your app
2. Complete a test purchase in GrooveSell
3. Check server logs for webhook processing
4. Verify user was created in Appwrite
5. Verify credits were added

### Test 3: Test Recurring Payment
1. Use GrooveSell's test mode to simulate a rebill
2. Verify webhook receives `subscription_renewed` event
3. Verify 10 additional credits added to user account

## Step 6: Monitor Webhook Logs

The webhook handler logs all activity to the console. In production, you should:

1. Use a logging service (e.g., Sentry, LogRocket)
2. Monitor for failed webhooks
3. Set up alerts for errors

Check your server logs for:
```
Received GrooveSell webhook
Webhook payload: {...}
Processing transaction abc123 for user@example.com
Updated user xyz456: 0 + 5 = 5 credits (tier: trial)
Successfully processed transaction abc123
```

## Troubleshooting

### Issue: Webhook returns 401 Unauthorized
**Cause:** Invalid webhook signature
**Solution:** 
- Verify `GROOVESELL_WEBHOOK_SECRET` matches GrooveSell dashboard
- Check that GrooveSell is sending the signature header

### Issue: User not found
**Cause:** Email mismatch or user doesn't exist
**Solution:**
- Ensure customer email is collected in GrooveSell checkout
- For recurring payments, user must exist from initial purchase

### Issue: Credits not added
**Cause:** Product ID not mapped
**Solution:**
- Check server logs for "Unknown product ID" warning
- Add the product ID to `PRODUCT_CREDITS_MAP`

### Issue: Duplicate credit additions
**Cause:** Webhook sent multiple times
**Solution:** 
- Current implementation allows duplicates (idempotency not implemented)
- Consider adding transaction ID tracking in Appwrite

## GrooveSell Webhook Payload Format

Based on GrooveSell's webhook format, expect something like:

```json
{
  "event": "purchase",
  "data": {
    "transaction_id": "abc123",
    "product_id": "your-product-id",
    "customer_email": "user@example.com",
    "customer_name": "John Doe",
    "password": "user-password",
    "amount": 799,
    "status": "completed"
  }
}
```

## Security Best Practices

1. **Always verify webhook signatures** in production
2. **Use HTTPS** for your webhook endpoint
3. **Never log sensitive data** (full credit card numbers)
4. **Set rate limiting** on webhook endpoint
5. **Monitor webhook activity** for suspicious patterns

## Affiliate Commission Setup

GrooveSell has built-in affiliate management. To enable:

1. In GrooveSell dashboard, go to Affiliates
2. Enable affiliate program for your products
3. Set commission rates (e.g., 20% of first sale)
4. Create affiliate signup page
5. Provide affiliates with their unique links

Webhook integration automatically works with affiliate tracking - no additional code needed!

## Next Steps

1. ✅ Add your GrooveSell product IDs to the webhook handler
2. ✅ Configure webhooks in GrooveSell dashboard
3. ✅ Test the purchase flow
4. ✅ Monitor first real purchase
5. ✅ Set up affiliate program in GrooveSell

## Support

If you encounter issues:
- Check server logs for detailed error messages
- Test webhook endpoint with curl
- Verify GrooveSell webhook configuration
- Check Appwrite database for user creation

## Related Files

- Webhook handler: `src/app/api/groovesell/webhook/route.ts`
- Purchase modal: `src/components/purchase-credits-modal.tsx`
- Credit packages: `src/lib/credit-packages.ts`
- Environment: `.env.local`
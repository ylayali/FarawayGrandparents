# Pricing Implementation Guide

## Overview
This guide explains the new pricing structure and how to implement it with Stripe.

## Pricing Structure

### 1. Trial Package ($7.99)
- **Price**: $7.99 one-time
- **Credits**: 5 credits
- **Duration**: Valid for 15 days
- **Auto-converts**: Automatically becomes a monthly subscription after 15 days
- **Cancellation**: Users can cancel anytime during the trial period

### 2. Monthly Subscription ($14.99/month)
- **Price**: $14.99 per month
- **Credits**: 10 credits per month
- **Rollover**: Unused credits roll over for 1 month only
- **Cancellation**: Cancel anytime

### 3. Premium Annual Package ($249/year)
- **Price**: $249 per year
- **Credits**: 120 credits per year (equivalent to 10/month)
- **Type**: "Don't Worry About It" Done-For-You package
- **Features**: Premium support, automatic delivery
- **Upgrade**: Available as an upgrade option

## Stripe Setup Instructions

### Step 1: Create Products in Stripe Dashboard

#### Product 1: Trial with Auto-Subscription
1. Go to Stripe Dashboard → Products → Add Product
2. **Name**: "Coloring Pages Trial"
3. **Pricing Model**: Recurring
4. **Price**: $14.99 USD
5. **Billing Period**: Monthly
6. **Add Trial Period**: 15 days
7. **Trial Configuration**:
   - Trial requires payment method: Yes
   - Charge $7.99 upfront for the trial
8. **Product ID**: Copy this ID and add to `.env.local` as:
   ```
   STRIPE_TRIAL_PRICE_ID=price_xxxxx
   ```

#### Product 2: Monthly Subscription (Direct)
1. Go to Stripe Dashboard → Products → Add Product
2. **Name**: "Coloring Pages Monthly"
3. **Pricing Model**: Recurring
4. **Price**: $14.99 USD
5. **Billing Period**: Monthly
6. **Product ID**: Copy this ID and add to `.env.local` as:
   ```
   STRIPE_MONTHLY_PRICE_ID=price_xxxxx
   ```

#### Product 3: Premium Annual Package
1. Go to Stripe Dashboard → Products → Add Product
2. **Name**: "Premium Annual Package"
3. **Pricing Model**: Recurring
4. **Price**: $249 USD
5. **Billing Period**: Yearly
6. **Product ID**: Copy this ID and add to `.env.local` as:
   ```
   STRIPE_ANNUAL_PRICE_ID=price_xxxxx
   ```

### Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Price IDs
STRIPE_TRIAL_PRICE_ID=price_xxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_ANNUAL_PRICE_ID=price_xxxxx

# Stripe Keys (already configured)
STRIPE_SECRET_KEY=sk_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 3: Update Stripe Checkout API

The checkout API needs to be updated to handle:
1. Trial periods with upfront payments
2. Subscription creation
3. Proper metadata for credit allocation

### Step 4: Update Webhook Handler

The webhook needs to handle these events:

#### For Trial ($7.99)
- `checkout.session.completed`: 
  - Add 5 credits
  - Set trial_end timestamp (15 days from now)
  - Create subscription record
  
#### For Subscriptions
- `customer.subscription.updated`:
  - Check if trial ended → subscription activated
  - Add 10 credits for monthly
  - Add 120 credits for annual
  
- `customer.subscription.deleted`:
  - Mark subscription as cancelled
  - Keep any remaining credits

- `invoice.payment_succeeded`:
  - For recurring payments (after trial)
  - Add monthly credits (10)
  - Handle credit rollover logic

#### Credit Rollover Logic
```
1. When new billing period starts:
   - Check credits from previous period
   - If > 0 and < 1 month old: Keep them
   - Add new period credits (10 for monthly)
   - Mark rollover timestamp

2. Credits older than 1 month expire
```

## Database Schema Updates Needed

### Add to profiles collection:
```javascript
{
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired',
  subscription_id: string, // Stripe subscription ID
  subscription_price_id: string, // Which plan they're on
  trial_end: timestamp,
  billing_cycle_start: timestamp,
  credits_last_added: timestamp,
  rollover_credits: number, // Credits from previous period
  rollover_date: timestamp // When rollover credits were added
}
```

## Implementation Checklist

### Backend Changes:
- [ ] Update `/api/stripe/checkout/route.ts` to create subscriptions with trials
- [ ] Update `/api/stripe/webhook/route.ts` to handle all subscription events
- [ ] Implement credit rollover logic in webhook
- [ ] Add subscription management endpoints
- [ ] Update Appwrite database schema

### Frontend Changes:
- [x] Update `src/lib/credit-packages.ts` with new packages
- [x] Update `src/components/purchase-credits-modal.tsx` UI
- [ ] Add subscription management to user profile
- [ ] Add "Upgrade to Premium" button for existing subscribers
- [ ] Add cancellation flow

### Stripe Dashboard:
- [ ] Create trial product with $7.99 upfront + $14.99 monthly
- [ ] Create monthly subscription product ($14.99)
- [ ] Create annual premium product ($249)
- [ ] Configure webhook endpoints
- [ ] Test in test mode

### Testing:
- [ ] Test trial purchase and credit allocation (5 credits)
- [ ] Test trial → subscription conversion after 15 days
- [ ] Test monthly subscription credit allocation (10 credits)
- [ ] Test credit rollover logic
- [ ] Test annual package purchase
- [ ] Test subscription cancellation
- [ ] Test upgrade from monthly to annual

## User Experience Flow

### New User Journey:
1. Signs up → Sees 3 options (Trial, Monthly, Premium)
2. Selects **Trial** ($7.99)
3. Pays $7.99 → Gets 5 credits immediately
4. Uses credits over 15 days
5. After 15 days:
   - If not cancelled: Charged $14.99, gets 10 more credits
   - If cancelled during trial: Keeps initial 5 credits until used

### Existing Monthly Subscriber:
1. Has active monthly subscription
2. Sees "Upgrade to Premium" button in profile
3. Clicks upgrade → Prorates remaining time → Switches to annual
4. Gets immediate credit allocation for annual plan

### Credit Management:
- Month 1: Buy monthly → 10 credits
- Use 3 credits → 7 remaining
- Month 2: Billing cycle → Get 10 new credits
- Total: 7 (rollover) + 10 (new) = 17 credits
- Month 3: If month 1 credits not used → They expire
- Keep only month 2 rollover + month 3 new credits

## Cancellation Policy

### Easy Cancellation Process:
1. User Profile → "Manage Subscription" button
2. Shows current plan, next billing date, credit balance
3. "Cancel Subscription" button (prominent, easy to find)
4. Confirmation modal: "Are you sure? You'll keep your credits until used"
5. Cancels immediately (or at end of period, configurable)
6. User keeps all existing credits until they expire naturally

## Notes

- **Stripe Test Mode**: Test everything thoroughly in Stripe test mode first
- **Webhook Testing**: Use Stripe CLI for local webhook testing
- **Credit Expiry**: Implement a cron job to expire old rollover credits
- **Email Notifications**: Consider sending emails for:
  - Trial ending soon (3 days before)
  - Subscription renewed
  - Credits added
  - Subscription cancelled

## Next Steps

1. Review this implementation plan
2. Create Stripe products in test mode
3. Update checkout and webhook code
4. Test the full flow in Stripe test mode
5. Add subscription management UI
6. Deploy to production
7. Create real Stripe products
8. Update environment variables
9. Test live payments (small amounts first)
10. Monitor for issues

## Support Resources

- [Stripe Subscriptions Docs](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Trials Docs](https://stripe.com/docs/billing/subscriptions/trials)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe Testing Docs](https://stripe.com/docs/testing)

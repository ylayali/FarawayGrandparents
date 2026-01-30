import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDatabases } from '@/lib/appwrite-server';
import { Query } from 'appwrite';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('=== Cancel Subscription API Called ===');
    
    const { userId } = await request.json();
    console.log('User ID:', userId);

    if (!userId) {
      console.error('Missing userId');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile to find Stripe customer ID
    const databases = await getDatabases();
    const profile = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
      userId
    );

    if (!profile || !profile.stripe_customer_id) {
      console.error('No Stripe customer found for user:', userId);
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    console.log('Stripe Customer ID:', profile.stripe_customer_id);

    // Find active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id as string,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      console.log('No active subscriptions found');
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel the subscription (at period end)
    const subscription = subscriptions.data[0];
    console.log('Cancelling subscription:', subscription.id);

    const cancelledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    const subData = cancelledSubscription as any;
    console.log('Subscription will cancel at period end:', subData.current_period_end);

    // Update profile to mark subscription as cancelling
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
      userId,
      {
        subscription_cancelling: true,
        subscription_end_date: new Date(subData.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    const periodEndDate = new Date(subData.current_period_end * 1000);
    const formattedDate = periodEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('✅ Subscription cancellation scheduled');

    return NextResponse.json({
      success: true,
      message: `Subscription will be cancelled on ${formattedDate}`,
      cancelDate: formattedDate,
      keepAccessUntil: formattedDate
    });

  } catch (error) {
    console.error('=== Cancel Subscription Error ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
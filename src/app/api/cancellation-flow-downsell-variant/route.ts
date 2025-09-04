import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        if (typeof userId !== 'string') {
            return NextResponse.json({
                error: 'User ID must be a string',
            }, { status: 400 });
        }

        const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin.from("subscriptions").select("*").eq("user_id", userId);
        if (subscriptionError) {
            console.log(subscriptionError);
            return NextResponse.json({
                error: 'Failed to fetch subscription',
            }, { status: 500 });
        }
        if (subscriptionData.length === 0) {
            return NextResponse.json({
                error: 'Subscription not found',
            }, { status: 404 });
        }


        const { data, error } = await supabaseAdmin.from("cancellations").select("*").eq("user_id", userId);
        if (error) {
            return NextResponse.json({
                error: 'Failed to fetch cancellation flow state',
            }, { status: 500 });
        }
        if (data.length > 0) {
            return NextResponse.json({
                downsellVariant: data[0].downsell_variant,
                monthlyPrice: subscriptionData[0].monthly_price,
            });
        } else {
            const downsellVariant = Math.random() < 0.5 ? "A" : "B";
            const { error: insertError } = await supabaseAdmin.from("cancellations").insert({
                downsell_variant: downsellVariant,
                state_json_array: [],
                user_id: userId,
                subscription_id: subscriptionData[0].id,
            });
            if (insertError) {
                return NextResponse.json({
                    error: 'Failed to insert cancellation flow state',
                }, { status: 500 });
            }
            return NextResponse.json({
                downsellVariant: downsellVariant,
                monthlyPrice: subscriptionData[0].monthly_price,
            });
        }
    } catch (error) {
        console.error('Error updating cancellation flow state:', error);
        return NextResponse.json(
            { error: 'Failed to update cancellation flow state' },
            { status: 500 }
        );
    }
}

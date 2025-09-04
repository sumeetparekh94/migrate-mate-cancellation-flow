import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const userId = body["userId"];
        const state = body["state"];

        if (typeof userId !== 'string') {
            return NextResponse.json({
                error: 'User ID must be a string',
            }, { status: 400 });
        }

        if (typeof state !== 'object' || !Array.isArray(state)) {
            return NextResponse.json({
                error: 'State must be a valid JSON array',
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
            const { error: updateError } = await supabaseAdmin.from("cancellations").update({
                state_json_array: state,
                updated_at: new Date().toISOString(),
            }).eq("id", data[0].id);
            if (updateError) {
                return NextResponse.json({
                    error: 'Failed to update cancellation flow state',
                }, { status: 500 });
            }
        } else {
            const { error: insertError } = await supabaseAdmin.from("cancellations").insert({
                state_json_array: state,
                user_id: userId,
                subscription_id: subscriptionData[0].id,
            });
            if (insertError) {
                return NextResponse.json({
                    error: 'Failed to insert cancellation flow state',
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cancellation flow state updated',
        });
    } catch (error) {
        console.error('Error updating cancellation flow state:', error);
        return NextResponse.json(
            { error: 'Failed to update cancellation flow state' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
    try {
        // Get the authorization header
        const authorization = request.headers.get('authorization');

        if (!authorization) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extract the token from the authorization header
        const token = authorization.replace('Bearer ', '');

        // Set the session for this request
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user settings
        const { data: userData, error } = await supabase
            .from('users')
            .select('reading_settings')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        return NextResponse.json({
            settings: userData?.reading_settings || null
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the authorization header
        const authorization = request.headers.get('authorization');

        if (!authorization) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extract the token from the authorization header
        const token = authorization.replace('Bearer ', '');

        // Set the session for this request
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { settings } = await request.json();

        if (!settings) {
            return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
        }

        // Update user settings
        const { error } = await supabase
            .from('users')
            .update({ reading_settings: settings })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

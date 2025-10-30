import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleAuthSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log(session)

        if (error) {
            console.error('Error checking session:', error.message);
            return null;
        }

        // If there's a session, user is logged in
        if (session) {
            redirect('/discover');  // Redirect to main app page
        }

        return session;
    } catch (error) {
        console.error('Error in handleAuthSession:', error);
        return null;
    }
};

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Error fetching user:', error.message);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return null;
    }
};

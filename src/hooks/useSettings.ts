import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface UserSettings {
    fontSize: number;
    speechRate: number;
    speechVoiceName: string;
    readingTheme: 'dark' | 'light' | 'sepia';
    autoAdvanceAudio: boolean;
}

export const defaultSettings: UserSettings = {
    fontSize: 16,
    speechRate: 1.0,
    speechVoiceName: '',
    readingTheme: 'dark',
    autoAdvanceAudio: true
};

export const useSettings = () => {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session }, error: authError } = await supabase.auth.getSession();

            if (authError || !session?.user) {
                setSettings(defaultSettings);
                return;
            }

            const response = await fetch('/api/settings', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load settings');
            }

            if (data.settings) {
                setSettings({ ...defaultSettings, ...data.settings });
            } else {
                setSettings(defaultSettings);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load settings');
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async (newSettings: UserSettings) => {
        try {
            setError(null);

            const { data: { session }, error: authError } = await supabase.auth.getSession();

            if (authError || !session?.user) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ settings: newSettings }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            setSettings(newSettings);
            return { success: true };
        } catch (err) {
            console.error('Error saving settings:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    const updateSettings = useCallback((updates: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading,
        error,
        loadSettings,
        saveSettings,
        updateSettings,
        resetSettings,
    };
};

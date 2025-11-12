'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserSettings {
    fontSize: number;
    speechRate: number;
    speechVoiceName: string;
    readingTheme: 'dark' | 'light' | 'sepia';
    autoAdvanceAudio: boolean;
}

const defaultSettings: UserSettings = {
    fontSize: 16,
    speechRate: 1.0,
    speechVoiceName: '',
    readingTheme: 'dark',
    autoAdvanceAudio: true
};

const SettingsPage = () => {
    const router = useRouter();
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
        initializeVoices();
    }, []);

    const initializeVoices = () => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);

            // If no voice is set, prefer English voices
            if (!settings.speechVoiceName && voices.length > 0) {
                const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
                const preferredVoice = englishVoices.length > 0 ? englishVoices[0] : voices[0];
                setSettings(prev => ({ ...prev, speechVoiceName: preferredVoice.name }));
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    };

    const loadSettings = async () => {
        try {
            const { data: { session }, error: authError } = await supabase.auth.getSession();

            if (authError || !session?.user) {
                router.push('/auth/login');
                return;
            }

            const response = await fetch('/api/settings', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.settings) {
                setSettings({ ...defaultSettings, ...data.settings });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const { data: { session }, error: authError } = await supabase.auth.getSession();

            if (authError || !session?.user) {
                router.push('/auth/login');
                return;
            }

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ settings }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            showMessage('success', 'Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    }; const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        showMessage('success', 'Settings reset to defaults');
    };

    const testAudio = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const testText = "This is a test of your audio settings. The voice and speed you've selected will be used for reading books.";
        const utterance = new SpeechSynthesisUtterance(testText);

        utterance.rate = settings.speechRate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const selectedVoice = availableVoices.find(v => v.name === settings.speechVoiceName);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-semibold">⚙️ Reading Settings</h1>
                        <button
                            onClick={() => router.push('/library')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                            ← Back to Library
                        </button>
                    </div>
                    <p className="text-gray-500">Customize your reading and audio preferences</p>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Reading Settings */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
                            📖 Reading Settings
                        </h2>

                        {/* Font Size */}
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-300 mb-3">
                                Font Size: {settings.fontSize}px
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSettings(prev => ({
                                        ...prev,
                                        fontSize: Math.max(12, prev.fontSize - 2)
                                    }))}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    A−
                                </button>
                                <input
                                    type="range"
                                    min="12"
                                    max="24"
                                    step="2"
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        fontSize: parseInt(e.target.value)
                                    }))}
                                    className="flex-1 mx-4"
                                />
                                <button
                                    onClick={() => setSettings(prev => ({
                                        ...prev,
                                        fontSize: Math.min(24, prev.fontSize + 2)
                                    }))}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    A+
                                </button>
                            </div>
                            <div
                                className="mt-4 p-4 bg-gray-800 rounded-lg text-gray-100"
                                style={{ fontSize: `${settings.fontSize}px` }}
                            >
                                Sample text: "The quick brown fox jumps over the lazy dog."
                            </div>
                        </div>

                        {/* Reading Theme */}
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-300 mb-3">
                                Reading Theme
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: 'dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-gray-100' },
                                    { value: 'light', label: 'Light', bg: 'bg-gray-100', text: 'text-gray-900' },
                                    { value: 'sepia', label: 'Sepia', bg: 'bg-yellow-50', text: 'text-yellow-900' }
                                ].map((theme) => (
                                    <button
                                        key={theme.value}
                                        onClick={() => setSettings(prev => ({
                                            ...prev,
                                            readingTheme: theme.value as any
                                        }))}
                                        className={`p-4 rounded-lg border-2 transition ${settings.readingTheme === theme.value
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-gray-600 hover:border-gray-500'
                                            } ${theme.bg} ${theme.text}`}
                                    >
                                        <div className="font-medium">{theme.label}</div>
                                        <div className="text-sm mt-1">Sample text</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Audio Settings */}
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
                            🎧 Audio Settings
                        </h2>

                        {/* Speech Rate */}
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-300 mb-3">
                                Speaking Rate: {settings.speechRate.toFixed(1)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={settings.speechRate}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    speechRate: parseFloat(e.target.value)
                                }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                                <span>Slower (0.5x)</span>
                                <span>Normal (1.0x)</span>
                                <span>Faster (2.0x)</span>
                            </div>
                        </div>

                        {/* Voice Selection */}
                        <div className="mb-6">
                            <label className="block text-lg font-medium text-gray-300 mb-3">
                                Voice
                            </label>
                            <select
                                value={settings.speechVoiceName}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    speechVoiceName: e.target.value
                                }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">Select a voice...</option>
                                {availableVoices.map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Auto Advance */}
                        <div className="mb-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoAdvanceAudio}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        autoAdvanceAudio: e.target.checked
                                    }))}
                                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <div>
                                    <div className="text-lg font-medium text-gray-300">Auto-advance to next page</div>
                                    <div className="text-sm text-gray-400">Automatically go to the next page when audio finishes</div>
                                </div>
                            </label>
                        </div>

                        {/* Test Audio Button */}
                        <button
                            onClick={testAudio}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Test Audio Settings
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className={`flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2 ${saving
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                } text-white`}
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Settings
                                </>
                            )}
                        </button>
                        <button
                            onClick={resetSettings}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;

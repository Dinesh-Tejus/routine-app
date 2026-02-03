import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const VoiceContext = createContext(null);

const STORAGE_KEY = 'voice_settings';

const defaultSettings = {
    voiceEnabled: true,
    autoReadResponses: false,
    voiceRate: 1.0,
    selectedVoice: null
};

export const VoiceProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    const [availableVoices, setAvailableVoices] = useState([]);
    const [isSupported, setIsSupported] = useState(true);

    // Load available voices
    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setIsSupported(false);
            return;
        }

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Filter to English voices for better quality
            const englishVoices = voices.filter(v => v.lang.startsWith('en'));
            setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Persist settings
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('Failed to save voice settings:', err);
        }
    }, [settings]);

    const updateSettings = useCallback((updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const setVoiceEnabled = useCallback((enabled) => {
        updateSettings({ voiceEnabled: enabled });
    }, [updateSettings]);

    const setAutoReadResponses = useCallback((enabled) => {
        updateSettings({ autoReadResponses: enabled });
    }, [updateSettings]);

    const setVoiceRate = useCallback((rate) => {
        updateSettings({ voiceRate: Math.max(0.5, Math.min(2.0, rate)) });
    }, [updateSettings]);

    const setSelectedVoice = useCallback((voiceName) => {
        updateSettings({ selectedVoice: voiceName });
    }, [updateSettings]);

    // Get the actual voice object
    const getSelectedVoice = useCallback(() => {
        if (!settings.selectedVoice) return null;
        return availableVoices.find(v => v.name === settings.selectedVoice) || null;
    }, [settings.selectedVoice, availableVoices]);

    const value = {
        // Settings
        voiceEnabled: settings.voiceEnabled,
        autoReadResponses: settings.autoReadResponses,
        voiceRate: settings.voiceRate,
        selectedVoice: settings.selectedVoice,

        // Setters
        setVoiceEnabled,
        setAutoReadResponses,
        setVoiceRate,
        setSelectedVoice,

        // Helpers
        availableVoices,
        getSelectedVoice,
        isSupported
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoice must be used within a VoiceProvider');
    }
    return context;
};

export default VoiceContext;

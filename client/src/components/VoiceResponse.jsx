import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

const VoiceResponse = ({
    text,
    autoPlay = false,
    onStart,
    onEnd,
    size = 14,
    className = ''
}) => {
    const { voiceEnabled, voiceRate, getSelectedVoice, isSupported } = useVoice();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const utteranceRef = useRef(null);
    const hasAutoPlayed = useRef(false);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (utteranceRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Handle auto-play
    useEffect(() => {
        if (autoPlay && voiceEnabled && text && !hasAutoPlayed.current && isSupported) {
            hasAutoPlayed.current = true;
            speak();
        }
    }, [autoPlay, voiceEnabled, text, isSupported]);

    const speak = useCallback(() => {
        if (!voiceEnabled || !text || !isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        setIsLoading(true);

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Configure voice settings
        utterance.rate = voiceRate;
        utterance.pitch = 1.0;

        const selectedVoice = getSelectedVoice();
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
            setIsLoading(false);
            setIsSpeaking(true);
            onStart?.();
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsLoading(false);
            onEnd?.();
        };

        utterance.onerror = (e) => {
            console.error('TTS error:', e);
            setIsSpeaking(false);
            setIsLoading(false);
            onEnd?.();
        };

        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled, text, voiceRate, getSelectedVoice, isSupported, onStart, onEnd]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    const handleClick = useCallback(() => {
        if (isSpeaking) {
            stop();
        } else {
            speak();
        }
    }, [isSpeaking, speak, stop]);

    // Don't render if voice features are disabled or not supported
    if (!voiceEnabled || !isSupported || !text) {
        return null;
    }

    const getButtonStyles = () => {
        const base = 'p-1 rounded transition-all flex items-center justify-center';

        if (isLoading) {
            return `${base} text-indigo-400 cursor-wait`;
        }
        if (isSpeaking) {
            return `${base} text-indigo-400 bg-indigo-500/10`;
        }
        return `${base} text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10`;
    };

    const getIcon = () => {
        if (isLoading) {
            return <Loader2 size={size} className="animate-spin" />;
        }
        if (isSpeaking) {
            return <VolumeX size={size} />;
        }
        return <Volume2 size={size} />;
    };

    const getTitle = () => {
        if (isLoading) return 'Loading...';
        if (isSpeaking) return 'Click to stop';
        return 'Read aloud';
    };

    return (
        <button
            onClick={handleClick}
            className={`${getButtonStyles()} ${className}`}
            title={getTitle()}
            aria-label={getTitle()}
        >
            {getIcon()}
        </button>
    );
};

export default VoiceResponse;

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useVoice } from '../contexts/VoiceContext';

const VoiceInput = ({
    onTranscription,
    disabled = false,
    size = 16,
    className = '',
    showTooltip = true
}) => {
    const { voiceEnabled } = useVoice();
    const [state, setState] = useState('idle'); // idle, listening, processing
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = useCallback(async () => {
        if (disabled || !voiceEnabled) return;

        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            // Determine supported MIME type
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                if (chunksRef.current.length === 0) {
                    setState('idle');
                    return;
                }

                setState('processing');

                try {
                    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                    const response = await api.transcribeAudio(audioBlob);

                    if (response.data && response.data.text) {
                        onTranscription(response.data.text);
                    } else {
                        setError('No speech detected');
                    }
                } catch (err) {
                    console.error('Transcription error:', err);
                    setError(err.response?.data?.error || 'Transcription failed');
                } finally {
                    setState('idle');
                    chunksRef.current = [];
                }
            };

            mediaRecorder.onerror = (e) => {
                console.error('MediaRecorder error:', e);
                setError('Recording error');
                setState('idle');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setState('listening');

        } catch (err) {
            console.error('Microphone access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone access denied');
            } else {
                setError('Could not access microphone');
            }
            setState('idle');
        }
    }, [disabled, voiceEnabled, onTranscription]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'listening') {
            mediaRecorderRef.current.stop();
        }
    }, [state]);

    const handleClick = useCallback(() => {
        if (state === 'idle') {
            startRecording();
        } else if (state === 'listening') {
            stopRecording();
        }
        // Do nothing if processing
    }, [state, startRecording, stopRecording]);

    // Don't render if voice is disabled
    if (!voiceEnabled) {
        return null;
    }

    const getButtonStyles = () => {
        const base = 'p-1.5 rounded-lg transition-all flex items-center justify-center';

        switch (state) {
            case 'listening':
                return `${base} bg-red-500/20 text-red-400 animate-pulse border border-red-500/30`;
            case 'processing':
                return `${base} bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-wait`;
            default:
                return `${base} text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        }
    };

    const getIcon = () => {
        switch (state) {
            case 'listening':
                return <MicOff size={size} />;
            case 'processing':
                return <Loader2 size={size} className="animate-spin" />;
            default:
                return <Mic size={size} />;
        }
    };

    const getTitle = () => {
        if (error) return error;
        switch (state) {
            case 'listening':
                return 'Click to stop recording';
            case 'processing':
                return 'Processing...';
            default:
                return 'Click to speak';
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || state === 'processing'}
            className={`${getButtonStyles()} ${className}`}
            title={showTooltip ? getTitle() : undefined}
            aria-label={getTitle()}
        >
            {getIcon()}
        </button>
    );
};

export default VoiceInput;

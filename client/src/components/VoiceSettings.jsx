import React from 'react';
import { Settings, Volume2, Mic, X } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

const VoiceSettings = ({ isOpen, onClose }) => {
    const {
        voiceEnabled,
        autoReadResponses,
        voiceRate,
        selectedVoice,
        setVoiceEnabled,
        setAutoReadResponses,
        setVoiceRate,
        setSelectedVoice,
        availableVoices,
        isSupported
    } = useVoice();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">Voice Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {!isSupported && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <p className="text-sm text-amber-300">
                                Text-to-speech is not supported in your browser. Voice input will still work.
                            </p>
                        </div>
                    )}

                    {/* Master Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Mic size={18} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Voice Features</p>
                                <p className="text-xs text-slate-400">Enable voice input & output</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={voiceEnabled}
                            onChange={setVoiceEnabled}
                        />
                    </div>

                    {voiceEnabled && (
                        <>
                            {/* Auto-read Responses */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Volume2 size={18} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Auto-read Responses</p>
                                        <p className="text-xs text-slate-400">Automatically speak AI responses</p>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    enabled={autoReadResponses}
                                    onChange={setAutoReadResponses}
                                    disabled={!isSupported}
                                />
                            </div>

                            {/* Speech Rate */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-white">Speech Speed</p>
                                    <span className="text-xs text-indigo-400 font-mono">{voiceRate.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={voiceRate}
                                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                                    disabled={!isSupported}
                                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Slow</span>
                                    <span>Normal</span>
                                    <span>Fast</span>
                                </div>
                            </div>

                            {/* Voice Selection */}
                            {availableVoices.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-white">Voice</p>
                                    <select
                                        value={selectedVoice || ''}
                                        onChange={(e) => setSelectedVoice(e.target.value || null)}
                                        disabled={!isSupported}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        <option value="">System Default</option>
                                        {availableVoices.map((voice) => (
                                            <option key={voice.name} value={voice.name}>
                                                {voice.name} ({voice.lang})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Test Voice */}
                            {isSupported && (
                                <button
                                    onClick={() => {
                                        const utterance = new SpeechSynthesisUtterance('This is a test of the voice settings.');
                                        utterance.rate = voiceRate;
                                        if (selectedVoice) {
                                            const voice = availableVoices.find(v => v.name === selectedVoice);
                                            if (voice) utterance.voice = voice;
                                        }
                                        window.speechSynthesis.speak(utterance);
                                    }}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <Volume2 size={16} />
                                    Test Voice
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false }) => {
    return (
        <button
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? 'bg-indigo-500' : 'bg-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
};

export default VoiceSettings;

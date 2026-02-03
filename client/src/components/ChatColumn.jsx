import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ExternalLink, BookOpen, Plus, Check } from 'lucide-react';
import VoiceInput from './VoiceInput';
import VoiceResponse from './VoiceResponse';
import { useVoice } from '../contexts/VoiceContext';

const ChatColumn = ({ onSearch, onAddArticle, initialMessages = [] }) => {
    const { autoReadResponses } = useVoice();
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState(initialMessages);
    const [loading, setLoading] = useState(false);
    const [addedArticles, setAddedArticles] = useState(new Set());
    const [animatingButtons, setAnimatingButtons] = useState(new Set());
    const clickTimers = useRef({});

    useEffect(() => {
        if (initialMessages.length > messages.length) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    const handleSearch = async (voiceText = null) => {
        const searchQuery = voiceText || query;
        if (!searchQuery.trim() || loading) return;

        const userMessage = { type: 'user', text: searchQuery };
        setMessages([...messages, userMessage]);
        if (!voiceText) setQuery('');
        setLoading(true);

        try {
            const data = await onSearch(searchQuery);
            const botMessage = {
                type: 'bot',
                answer: data.answer,
                articles: data.articles || []
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Article search error:', error);
            const errorMessage = {
                type: 'error',
                text: 'Failed to fetch articles. Check your Tavily API key configuration.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = async (text) => {
        setQuery(text);
        await handleSearch(text);
    };

    const handleAddClick = async (article, status = 'read') => {
        if (addedArticles.has(article.url)) return;

        try {
            const result = await onAddArticle(article, status);
            if (result?.success !== false) {
                // Trigger animation
                setAnimatingButtons(prev => new Set([...prev, article.url]));
                setTimeout(() => {
                    setAnimatingButtons(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(article.url);
                        return newSet;
                    });
                }, 600);
                setAddedArticles(prev => new Set([...prev, article.url]));
            }
        } catch (error) {
            // Error already handled in Parent
        }
    };

    const handleButtonClick = (article, e) => {
        if (addedArticles.has(article.url)) return;

        const articleKey = article.url;

        // If there's already a pending single click, this is a double click
        if (clickTimers.current[articleKey]) {
            clearTimeout(clickTimers.current[articleKey]);
            delete clickTimers.current[articleKey];
            handleAddClick(article, 'saved');
        } else {
            // Set up single click timer
            clickTimers.current[articleKey] = setTimeout(() => {
                delete clickTimers.current[articleKey];
                handleAddClick(article, 'read');
            }, 300);
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-[600px]">
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={18} className="text-emerald-400" />
                    <h2 className="text-base font-bold text-white">ML Article Finder</h2>
                </div>
                <p className="text-xs text-emerald-300/60">Search for machine learning articles</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-slate-500 text-sm text-center">
                            Ask me to find ML articles!<br />
                            <span className="text-xs">e.g., "Latest papers on transformers"</span>
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx}>
                            {msg.type === 'user' && (
                                <div className="flex justify-end">
                                    <div className="bg-emerald-500/20 text-emerald-100 px-3 py-2 rounded-lg max-w-[80%] text-sm border border-emerald-500/30">
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                            {msg.type === 'bot' && (
                                <div className="space-y-3">
                                    {msg.answer && (
                                        <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                                            <div className="flex items-start gap-2">
                                                <span className="flex-1">{msg.answer}</span>
                                                <VoiceResponse
                                                    text={msg.answer}
                                                    autoPlay={autoReadResponses && idx === messages.length - 1}
                                                    size={14}
                                                    className="flex-shrink-0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-slate-400">Related articles:</p>
                                        {!msg.articles || msg.articles.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic px-2">No specific articles found for this topic.</p>
                                        ) : (
                                            msg.articles.map((article, i) => (
                                                <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all flex items-stretch">
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 p-3 flex items-start gap-2 group border-r border-slate-700/30"
                                                    >
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-400 transition-colors">
                                                                {article.title}
                                                            </h4>
                                                            {article.snippet && (
                                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.snippet}</p>
                                                            )}
                                                        </div>
                                                        <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400 flex-shrink-0 mt-0.5" />
                                                    </a>
                                                    <button
                                                        onClick={(e) => handleButtonClick(article, e)}
                                                        disabled={addedArticles.has(article.url)}
                                                        className={`px-3 flex items-center justify-center transition-all ${
                                                            animatingButtons.has(article.url)
                                                                ? 'text-emerald-400 bg-emerald-500/20 animate-pulse scale-110'
                                                                : addedArticles.has(article.url)
                                                                ? 'text-emerald-500 bg-emerald-500/5 cursor-default'
                                                                : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                                                        }`}
                                                        title={addedArticles.has(article.url) ? "Added to reading list" : "Click: Read | Double-click: Save for Later"}
                                                    >
                                                        {addedArticles.has(article.url) ? (
                                                            <Check size={16} className={animatingButtons.has(article.url) ? 'animate-bounce' : ''} />
                                                        ) : (
                                                            <Plus size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {msg.type === 'error' && (
                                <div className="bg-red-500/10 text-red-300 px-3 py-2 rounded-lg text-sm border border-red-500/30">
                                    {msg.text}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/50 px-4 py-3 rounded-lg flex items-center gap-2 border border-slate-700/50">
                            <Loader2 size={16} className="text-emerald-400 animate-spin" />
                            <span className="text-sm text-slate-400">Searching...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2 items-center">
                <VoiceInput
                    onTranscription={handleVoiceInput}
                    disabled={loading}
                    size={16}
                    className="flex-shrink-0"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for ML articles..."
                    className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500"
                    disabled={loading}
                />
                <button
                    onClick={() => handleSearch()}
                    disabled={loading || !query.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
            </div>
        </div>
    );
};

export default ChatColumn;

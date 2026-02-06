import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Loader2, ExternalLink, RefreshCw, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import VoiceInput from './VoiceInput';

const NewsDigest = ({ onAddArticle }) => {
    const [digest, setDigest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addedArticles, setAddedArticles] = useState(new Set());
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [customTopics, setCustomTopics] = useState('');
    const [animatingButtons, setAnimatingButtons] = useState(new Set());
    const clickTimers = useRef({});

    const defaultTopics = ['AI agents', 'LLMs', 'RAG'];

    // Load persisted digest on mount
    useEffect(() => {
        const loadPersistedDigest = async () => {
            try {
                const response = await api.getResearchData();
                const { weeklyDigest } = response.data;

                if (weeklyDigest?.topics?.length > 0) {
                    setDigest({
                        generatedAt: weeklyDigest.generatedAt,
                        topics: weeklyDigest.topics
                    });
                    // Expand all topics by default
                    setExpandedTopics(new Set(weeklyDigest.topics.map(t => t.topic)));
                }
            } catch (err) {
                console.error('Failed to load persisted digest:', err);
                const detail = err.response?.data?.details || err.response?.data?.error || err.message;
                setError(detail);
            } finally {
                setInitialLoading(false);
            }
        };

        loadPersistedDigest();
    }, []);

    const generateDigest = async (voiceTopics = null) => {
        setLoading(true);
        setError(null);

        try {
            const topicsToUse = voiceTopics || (customTopics.trim()
                ? customTopics.split(',').map(t => t.trim()).filter(Boolean)
                : defaultTopics);

            console.log('[NewsDigest] Sending topics:', topicsToUse);
            const response = await api.getNewsDigest(topicsToUse);
            console.log('[NewsDigest] Raw response:', response.data);
            setDigest(response.data);
            // Expand all topics by default
            setExpandedTopics(new Set(topicsToUse));

            // Check if all topics failed
            if (response.data?.topics?.length > 0 && response.data.topics.every(t => !t.success)) {
                console.log('[NewsDigest] All topics failed:', response.data.topics.map(t => ({ topic: t.topic, success: t.success, summary: t.summary })));
                setError('All topics failed to fetch. Please check your Tavily API key or try again later.');
            }
        } catch (err) {
            console.error('News digest error:', err);
            setError(err.response?.data?.details || err.response?.data?.error || 'Failed to generate news digest');
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = async (text) => {
        // Parse voice input as comma-separated topics
        const topics = text.split(/,|and/).map(t => t.trim()).filter(Boolean);
        if (topics.length > 0) {
            setCustomTopics(topics.join(', '));
            await generateDigest(topics);
        }
    };

    const handleAddClick = async (article, status = 'read') => {
        // Block new adds for already-added articles, but allow 'saved' status changes
        if (addedArticles.has(article.url) && status !== 'saved') return;

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
            console.error('Failed to add article:', error);
        }
    };

    const handleButtonClick = (article, e) => {
        const articleKey = article.url;
        const alreadyAdded = addedArticles.has(article.url);

        // If there's already a pending single click, this is a double click
        if (clickTimers.current[articleKey]) {
            clearTimeout(clickTimers.current[articleKey]);
            delete clickTimers.current[articleKey];
            handleAddClick(article, 'saved');
        } else if (!alreadyAdded) {
            // Set up single click timer (only for new articles)
            clickTimers.current[articleKey] = setTimeout(() => {
                delete clickTimers.current[articleKey];
                handleAddClick(article, 'read');
            }, 300);
        }
    };

    const toggleTopic = (topic) => {
        setExpandedTopics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topic)) {
                newSet.delete(topic);
            } else {
                newSet.add(topic);
            }
            return newSet;
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    const formatGeneratedDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    if (initialLoading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-[600px]">
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="text-blue-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-[600px]">
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Newspaper size={18} className="text-blue-400" />
                        <h2 className="text-base font-bold text-white">Weekly AI News</h2>
                    </div>
                    {digest && (
                        <button
                            onClick={() => generateDigest()}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Refresh digest"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>
                <p className="text-xs text-blue-300/60">Latest news from the AI world (resets weekly)</p>
            </div>

            {!digest && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2">Get your weekly AI news digest</p>
                        <p className="text-slate-500 text-xs">Summaries and top articles from the past week</p>
                    </div>

                    <div className="w-full max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <VoiceInput
                                onTranscription={handleVoiceInput}
                                disabled={loading}
                                size={18}
                                className="flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={customTopics}
                                onChange={(e) => setCustomTopics(e.target.value)}
                                placeholder="Custom topics (comma-separated)"
                                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500 text-center mb-3">
                            Default: {defaultTopics.join(', ')}
                        </p>
                    </div>

                    <button
                        onClick={() => generateDigest()}
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Newspaper size={16} />
                                Generate Digest
                            </>
                        )}
                    </button>
                </div>
            )}

            {loading && !digest && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={32} className="text-blue-400 animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Fetching latest AI news...</p>
                        <p className="text-slate-500 text-xs mt-1">This may take a moment</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 text-red-300 px-3 py-2 rounded-lg text-sm border border-red-500/30 mb-3 flex items-start justify-between gap-2">
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300 flex-shrink-0 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {digest && (
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="text-xs text-slate-500">
                        Generated: {formatGeneratedDate(digest.generatedAt)}
                    </div>

                    {digest.topics.map((topicData, idx) => (
                        <div key={idx} className="bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <button
                                onClick={() => toggleTopic(topicData.topic)}
                                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-700/20 transition-colors rounded-t-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-blue-300">
                                        {topicData.topic}
                                    </span>
                                    {!topicData.success && (
                                        <span className="text-xs text-red-400">(error)</span>
                                    )}
                                    <span className="text-xs text-slate-500">
                                        ({topicData.articles?.length || 0} articles)
                                    </span>
                                </div>
                                {expandedTopics.has(topicData.topic) ? (
                                    <ChevronUp size={16} className="text-slate-400" />
                                ) : (
                                    <ChevronDown size={16} className="text-slate-400" />
                                )}
                            </button>

                            {expandedTopics.has(topicData.topic) && (
                                <div className="px-3 pb-3 space-y-3">
                                    {topicData.summary && topicData.summary !== 'No summary available' && (
                                        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-sm text-slate-200 leading-relaxed">
                                            {topicData.summary}
                                        </div>
                                    )}

                                    {topicData.articles && topicData.articles.length > 0 ? (
                                        <div className="space-y-2">
                                            {topicData.articles.map((article, i) => (
                                                <div key={i} className="bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-all flex items-stretch">
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 p-2.5 flex items-start gap-2 group border-r border-slate-700/30"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-blue-300 group-hover:text-blue-400 transition-colors truncate">
                                                                {article.title}
                                                            </h4>
                                                            {article.snippet && (
                                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.snippet}</p>
                                                            )}
                                                            {article.publishedDate && (
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {formatDate(article.publishedDate)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ExternalLink size={12} className="text-slate-500 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    </a>
                                                    <button
                                                        onClick={(e) => handleButtonClick(article, e)}
                                                        className={`px-2.5 flex items-center justify-center transition-all ${
                                                            animatingButtons.has(article.url)
                                                                ? 'text-blue-400 bg-blue-500/20 animate-pulse scale-110'
                                                                : addedArticles.has(article.url)
                                                                ? 'text-blue-500 bg-blue-500/5 hover:bg-blue-500/15'
                                                                : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'
                                                        }`}
                                                        title={addedArticles.has(article.url) ? "Double-click to save for later" : "Click: Read | Double-click: Save for Later"}
                                                    >
                                                        {addedArticles.has(article.url) ? (
                                                            <Check size={14} className={animatingButtons.has(article.url) ? 'animate-bounce' : ''} />
                                                        ) : (
                                                            <Plus size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">No articles found for this topic.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsDigest;

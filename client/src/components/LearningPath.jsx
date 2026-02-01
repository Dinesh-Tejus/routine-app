import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, Loader2, ExternalLink, Plus, Check, ChevronDown, ChevronUp, BookOpen, Globe, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const LearningPath = ({ onAddArticle }) => {
    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState('basic');
    const [learningPath, setLearningPath] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addedArticles, setAddedArticles] = useState(new Set());
    const [expandedSources, setExpandedSources] = useState(new Set());
    const [completedItems, setCompletedItems] = useState(new Set());
    const [animatingButtons, setAnimatingButtons] = useState(new Set());
    const clickTimers = useRef({});

    // Load persisted learning path on mount
    useEffect(() => {
        const loadPersistedPath = async () => {
            try {
                const response = await api.getResearchData();
                const { currentLearningPath } = response.data;

                if (currentLearningPath?.topic) {
                    setLearningPath(currentLearningPath);
                    setCompletedItems(new Set(currentLearningPath.completedItems || []));
                    // Expand first source by default
                    if (currentLearningPath.structure?.length > 0) {
                        setExpandedSources(new Set([currentLearningPath.structure[0].domain]));
                    }
                }
            } catch (err) {
                console.error('Failed to load persisted learning path:', err);
            } finally {
                setInitialLoading(false);
            }
        };

        loadPersistedPath();
    }, []);

    // Save progress when completed items change
    const saveProgress = useCallback(async (items) => {
        if (!learningPath?.topic) return;

        try {
            await api.updateLearningProgress(Array.from(items));
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    }, [learningPath?.topic]);

    const generatePath = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.generateLearningPath(topic, depth);
            setLearningPath(response.data);
            setCompletedItems(new Set());
            // Expand first source by default
            if (response.data.structure?.length > 0) {
                setExpandedSources(new Set([response.data.structure[0].domain]));
            }
        } catch (err) {
            console.error('Learning path error:', err);
            setError(err.response?.data?.error || 'Failed to generate learning path');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        try {
            await api.clearLearningPath();
            setLearningPath(null);
            setCompletedItems(new Set());
            setAddedArticles(new Set());
            setTopic('');
        } catch (err) {
            console.error('Failed to clear learning path:', err);
        }
    };

    const handleAddClick = async (item, status = 'read') => {
        const article = {
            title: item.title,
            url: item.url,
            snippet: item.reason || item.excerpt || ''
        };

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
            console.error('Failed to add article:', error);
        }
    };

    const handleButtonClick = (item, e) => {
        if (addedArticles.has(item.url)) return;

        const articleKey = item.url;

        // If there's already a pending single click, this is a double click
        if (clickTimers.current[articleKey]) {
            clearTimeout(clickTimers.current[articleKey]);
            delete clickTimers.current[articleKey];
            handleAddClick(item, 'saved');
        } else {
            // Set up single click timer
            clickTimers.current[articleKey] = setTimeout(() => {
                delete clickTimers.current[articleKey];
                handleAddClick(item, 'read');
            }, 300);
        }
    };

    const handleAddAll = async () => {
        if (!learningPath?.suggestedOrder) return;

        for (const item of learningPath.suggestedOrder) {
            if (!addedArticles.has(item.url)) {
                try {
                    await onAddArticle({
                        title: item.title,
                        url: item.url,
                        snippet: item.reason || ''
                    });
                    setAddedArticles(prev => new Set([...prev, item.url]));
                } catch (error) {
                    console.error('Failed to add article:', error);
                }
            }
        }
    };

    const toggleSource = (domain) => {
        setExpandedSources(prev => {
            const newSet = new Set(prev);
            if (newSet.has(domain)) {
                newSet.delete(domain);
            } else {
                newSet.add(domain);
            }
            return newSet;
        });
    };

    const toggleCompleted = (url) => {
        setCompletedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(url)) {
                newSet.delete(url);
            } else {
                newSet.add(url);
            }
            // Save progress to backend
            saveProgress(newSet);
            return newSet;
        });
    };

    const completedCount = completedItems.size;
    const totalCount = learningPath?.suggestedOrder?.length || 0;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (initialLoading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-[600px]">
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="text-purple-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-[600px]">
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <GraduationCap size={18} className="text-purple-400" />
                    <h2 className="text-base font-bold text-white">Learning Path</h2>
                </div>
                <p className="text-xs text-purple-300/60">Deep dive into any AI/ML topic</p>
            </div>

            {!learningPath && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2">Create a structured learning path</p>
                        <p className="text-slate-500 text-xs">We'll find the best resources and organize them for you</p>
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && generatePath()}
                            placeholder="e.g., RAG pipelines, fine-tuning LLMs, vector databases..."
                            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-500"
                        />

                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setDepth('basic')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${depth === 'basic'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-purple-500/30'
                                    }`}
                            >
                                Basic
                            </button>
                            <button
                                onClick={() => setDepth('deep')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${depth === 'deep'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-purple-500/30'
                                    }`}
                            >
                                Deep Dive
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                            {depth === 'basic' ? 'Quick overview with top resources' : 'Comprehensive with extracted content'}
                        </p>
                    </div>

                    <button
                        onClick={generatePath}
                        disabled={loading || !topic.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generate Path
                            </>
                        )}
                    </button>
                </div>
            )}

            {loading && !learningPath && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={32} className="text-purple-400 animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Building your learning path...</p>
                        <p className="text-slate-500 text-xs mt-1">
                            {depth === 'deep' ? 'Extracting content from sources...' : 'Finding the best resources...'}
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 text-red-300 px-3 py-2 rounded-lg text-sm border border-red-500/30 mb-3">
                    {error}
                </div>
            )}

            {learningPath && (
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                    {/* Header with topic and progress */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-purple-300">{learningPath.topic}</h3>
                            <p className="text-xs text-slate-500">
                                {learningPath.sources?.length || 0} sources found
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
                        >
                            New Path
                        </button>
                    </div>

                    {/* Progress bar */}
                    {totalCount > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">Progress</span>
                                <span className="text-xs text-purple-300">{completedCount}/{totalCount} ({progressPercent}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Overview */}
                    {learningPath.overview && (
                        <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 text-sm text-slate-200 leading-relaxed">
                            {learningPath.overview}
                        </div>
                    )}

                    {/* Suggested Learning Order */}
                    {learningPath.suggestedOrder && learningPath.suggestedOrder.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-purple-400" />
                                    <span className="text-xs font-medium text-slate-300">Suggested Order</span>
                                </div>
                                <button
                                    onClick={handleAddAll}
                                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Add all to reading
                                </button>
                            </div>

                            {learningPath.suggestedOrder.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-slate-800/50 rounded-lg border transition-all flex items-stretch ${completedItems.has(item.url)
                                        ? 'border-purple-500/30 bg-purple-500/5'
                                        : 'border-slate-700/50 hover:border-purple-500/30'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleCompleted(item.url)}
                                        className={`px-2.5 flex items-center justify-center border-r border-slate-700/30 transition-all ${completedItems.has(item.url)
                                            ? 'text-purple-400 bg-purple-500/10'
                                            : 'text-slate-600 hover:text-purple-400 hover:bg-purple-500/5'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${completedItems.has(item.url)
                                            ? 'border-purple-400 bg-purple-500/20'
                                            : 'border-slate-600'
                                            }`}>
                                            {completedItems.has(item.url) && <Check size={10} />}
                                        </div>
                                    </button>

                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 p-2.5 flex items-start gap-2 group border-r border-slate-700/30"
                                    >
                                        <span className="text-xs font-bold text-purple-400 mt-0.5">{item.order}.</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`text-sm font-medium group-hover:text-purple-400 transition-colors truncate ${completedItems.has(item.url) ? 'text-slate-400 line-through' : 'text-purple-300'
                                                    }`}>
                                                    {item.title}
                                                </h4>
                                                {item.level && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                                                        item.level === 'beginner' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        item.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        item.level === 'advanced' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                    }`}>
                                                        {item.level}
                                                    </span>
                                                )}
                                            </div>
                                            {item.reason && (
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.reason}</p>
                                            )}
                                        </div>
                                        <ExternalLink size={12} className="text-slate-500 group-hover:text-purple-400 flex-shrink-0 mt-0.5" />
                                    </a>

                                    <button
                                        onClick={(e) => handleButtonClick(item, e)}
                                        disabled={addedArticles.has(item.url)}
                                        className={`px-2.5 flex items-center justify-center transition-all ${
                                            animatingButtons.has(item.url)
                                                ? 'text-purple-400 bg-purple-500/20 animate-pulse scale-110'
                                                : addedArticles.has(item.url)
                                                ? 'text-purple-500 bg-purple-500/5 cursor-default'
                                                : 'text-slate-500 hover:text-purple-400 hover:bg-purple-500/10'
                                        }`}
                                        title={addedArticles.has(item.url) ? "Added to reading list" : "Click: Read | Double-click: Save for Later"}
                                    >
                                        {addedArticles.has(item.url) ? (
                                            <Check size={14} className={animatingButtons.has(item.url) ? 'animate-bounce' : ''} />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Site Structure */}
                    {learningPath.structure && learningPath.structure.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Globe size={14} className="text-purple-400" />
                                <span className="text-xs font-medium text-slate-300">Source Structure</span>
                            </div>

                            {learningPath.structure.map((source, idx) => (
                                <div key={idx} className="bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <button
                                        onClick={() => toggleSource(source.domain)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700/20 transition-colors rounded-t-lg"
                                    >
                                        <span className="text-xs font-medium text-slate-300">{source.domain}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{source.pages?.length || 0} pages</span>
                                            {expandedSources.has(source.domain) ? (
                                                <ChevronUp size={14} className="text-slate-400" />
                                            ) : (
                                                <ChevronDown size={14} className="text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {expandedSources.has(source.domain) && source.pages && (
                                        <div className="px-3 pb-2 space-y-1">
                                            {source.pages.slice(0, 8).map((url, i) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-xs text-slate-400 hover:text-purple-400 truncate transition-colors"
                                                >
                                                    {url.replace(/^https?:\/\/[^/]+/, '')}
                                                </a>
                                            ))}
                                            {source.pages.length > 8 && (
                                                <p className="text-xs text-slate-500">+{source.pages.length - 8} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Extracted Content (Deep mode only) */}
                    {learningPath.content && learningPath.content.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-400" />
                                <span className="text-xs font-medium text-slate-300">Extracted Content</span>
                            </div>

                            {learningPath.content.map((item, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-purple-300 hover:text-purple-400 transition-colors"
                                    >
                                        {item.title}
                                    </a>
                                    {item.excerpt && (
                                        <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-4">
                                            {item.excerpt}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LearningPath;

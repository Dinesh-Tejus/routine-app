const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tavilyService = require('../services/tavily');
const ResearchData = require('../models/ResearchData');
const { chat: log } = require('../utils/logger');

// Helper: Get the Sunday of the current week as YYYY-MM-DD
const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
};

router.use(auth);

// Search for ML articles using Tavily API
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        log.info('Article search', { userId: req.user.userId, query });

        if (!query || !query.trim()) {
            log.warn('Article search failed - missing query', { userId: req.user.userId });
            return res.status(400).json({ error: 'Query is required' });
        }

        const enhancedQuery = `${query}. Give me most recent articles or papers that helps an AI engineer or researcher to build production grade AI applications`;

        const data = await tavilyService.search(enhancedQuery, {
            searchDepth: 'basic',
            maxResults: 5
        });

        const result = tavilyService.formatSearchResults(data);

        log.success('Article search complete', {
            userId: req.user.userId,
            query,
            resultCount: result.articles?.length || 0
        });

        res.json(result);

    } catch (error) {
        log.failure('Article search', error, { userId: req.user.userId, query: req.body?.query });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to search articles' });
    }
});

// Generate Weekly News Digest
router.post('/news-digest', async (req, res) => {
    try {
        const { topics = ['AI agents', 'LLMs', 'RAG'] } = req.body;
        log.info('Generating news digest', { userId: req.user.userId, topics });

        const results = await Promise.all(
            topics.map(async (topic) => {
                try {
                    const data = await tavilyService.search(
                        `${topic} news updates developments breakthroughs`,
                        {
                            topic: 'news',
                            timeRange: 'week',
                            maxResults: 5,
                            includeAnswer: 'advanced',
                            searchDepth: 'advanced'
                        }
                    );
                    log.debug('Topic fetched', { topic, articleCount: data.results?.length || 0 });
                    return {
                        topic,
                        success: true,
                        summary: data.answer || 'No summary available',
                        articles: (data.results || []).map(r => ({
                            title: r.title,
                            url: r.url,
                            snippet: r.content,
                            publishedDate: r.published_date,
                            score: r.score
                        }))
                    };
                } catch (topicError) {
                    log.warn('Failed to fetch news for topic', { topic, error: topicError.message });
                    return {
                        topic,
                        success: false,
                        summary: 'Failed to fetch news for this topic',
                        articles: []
                    };
                }
            })
        );

        const digest = {
            generatedAt: new Date().toISOString(),
            topics: results
        };

        // Auto-save the weekly digest
        const userId = req.user.userId;
        const weekStartDate = getWeekStartDate();
        await ResearchData.findOneAndUpdate(
            { userId },
            {
                $set: {
                    weeklyDigest: {
                        weekStartDate,
                        generatedAt: digest.generatedAt,
                        topics: digest.topics
                    }
                }
            },
            { upsert: true }
        );

        log.success('News digest generated', {
            userId,
            topicCount: topics.length,
            successCount: results.filter(r => r.success).length
        });
        res.json(digest);

    } catch (error) {
        log.failure('Generate news digest', error, { userId: req.user.userId });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to generate news digest' });
    }
});

// QNA - Direct question answering
router.post('/qna', async (req, res) => {
    try {
        const { question } = req.body;
        log.info('QNA query', { userId: req.user.userId, questionLength: question?.length });

        if (!question || !question.trim()) {
            log.warn('QNA failed - missing question', { userId: req.user.userId });
            return res.status(400).json({ error: 'Question is required' });
        }

        const result = await tavilyService.qna(question);

        log.success('QNA answered', { userId: req.user.userId, sourceCount: result.sources?.length || 0 });
        res.json({
            question,
            answer: result.answer,
            sources: result.sources
        });

    } catch (error) {
        log.failure('QNA query', error, { userId: req.user.userId });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to answer question' });
    }
});

// Extract content from URLs
router.post('/extract', async (req, res) => {
    try {
        const { urls } = req.body;
        log.info('Content extraction', { userId: req.user.userId, urlCount: urls?.length || 0 });

        if (!urls || (Array.isArray(urls) && urls.length === 0)) {
            log.warn('Extract failed - missing URLs', { userId: req.user.userId });
            return res.status(400).json({ error: 'URLs are required' });
        }

        const data = await tavilyService.extract(urls);

        log.success('Content extracted', {
            userId: req.user.userId,
            extractedCount: data.results?.length || 0
        });

        res.json({
            results: (data.results || []).map(r => ({
                url: r.url,
                title: r.title || 'Untitled',
                content: r.raw_content?.slice(0, 5000) || '',
                images: r.images || []
            }))
        });

    } catch (error) {
        log.failure('Content extraction', error, { userId: req.user.userId });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to extract content' });
    }
});

module.exports = router;

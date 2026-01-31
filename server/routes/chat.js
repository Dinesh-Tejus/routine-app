const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tavilyService = require('../services/tavily');
const ResearchData = require('../models/ResearchData');

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

        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log('Searching Tavily for:', query);

        const enhancedQuery = `${query}. Give me most recent articles or papers that helps an AI engineer or researcher to build production grade AI applications`;

        const data = await tavilyService.search(enhancedQuery, {
            searchDepth: 'basic',
            maxResults: 5
        });

        const result = tavilyService.formatSearchResults(data);

        console.log('Tavily response:', JSON.stringify(result, null, 2));

        res.json(result);

    } catch (error) {
        console.error('Chat search error:', error.message);
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

        console.log('Generating news digest for topics:', topics);

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
                    console.error(`Error fetching news for ${topic}:`, topicError.message);
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

        res.json(digest);

    } catch (error) {
        console.error('News digest error:', error.message);
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

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log('QNA query:', question);

        const result = await tavilyService.qna(question);

        res.json({
            question,
            answer: result.answer,
            sources: result.sources
        });

    } catch (error) {
        console.error('QNA error:', error.message);
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

        if (!urls || (Array.isArray(urls) && urls.length === 0)) {
            return res.status(400).json({ error: 'URLs are required' });
        }

        console.log('Extracting content from:', urls);

        const data = await tavilyService.extract(urls);

        res.json({
            results: (data.results || []).map(r => ({
                url: r.url,
                title: r.title || 'Untitled',
                content: r.raw_content?.slice(0, 5000) || '',
                images: r.images || []
            }))
        });

    } catch (error) {
        console.error('Extract error:', error.message);
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to extract content' });
    }
});

module.exports = router;

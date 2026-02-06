const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tavilyService = require('../services/tavily');
const ResearchData = require('../models/ResearchData');
const { GoogleGenAI } = require("@google/genai");
const { research: log } = require('../utils/logger');

// Initialize Gemini AI for article ranking
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.use(auth);

// Helper: Get the Sunday of the current week as YYYY-MM-DD
const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
};

// Rank articles by difficulty using Gemini AI
const rankArticlesWithAI = async (topic, articles) => {
    if (!articles || articles.length === 0) return articles;

    try {
        const articleList = articles.map((a, i) => `${i}. "${a.title}" - ${a.url}`).join('\n');

        const prompt = `You are an expert learning path curator. Rank these learning resources for "${topic}" from beginner-friendly to advanced.

ARTICLES TO RANK:
${articleList}

RANKING CRITERIA:
1. Official documentation → beginner-friendly (foundational)
2. Tutorials and guides → beginner to intermediate
3. Blog posts and explanations → intermediate
4. Research papers and advanced topics → advanced

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "rankedOrder": [0, 2, 1, 3, ...],
  "levels": {
    "0": "beginner",
    "1": "intermediate",
    "2": "advanced"
  }
}

Where rankedOrder is the indices sorted from easiest to hardest, and levels maps each index to its difficulty level (beginner/intermediate/advanced).`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt
        });

        const responseText = response.text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            log.warn('No JSON found in AI ranking response, using original order');
            return articles;
        }

        const result = JSON.parse(jsonMatch[0]);
        const { rankedOrder, levels } = result;

        // Reorder articles and add difficulty levels
        const rankedArticles = rankedOrder
            .filter(idx => idx >= 0 && idx < articles.length)
            .map((originalIdx, newIdx) => ({
                ...articles[originalIdx],
                order: newIdx + 1,
                level: levels[String(originalIdx)] || 'intermediate'
            }));

        // Add any articles that weren't in the ranking (fallback)
        const rankedIndices = new Set(rankedOrder);
        articles.forEach((article, idx) => {
            if (!rankedIndices.has(idx)) {
                rankedArticles.push({
                    ...article,
                    order: rankedArticles.length + 1,
                    level: 'intermediate'
                });
            }
        });

        return rankedArticles;
    } catch (error) {
        log.warn('AI ranking failed, using default order', { error: error.message });
        // Return original articles with default order if AI fails
        return articles.map((a, i) => ({ ...a, order: i + 1, level: 'intermediate' }));
    }
};

// Get saved research data (learning path + weekly digest)
router.get('/data', async (req, res) => {
    try {
        const userId = req.user.userId;
        log.info('Fetching research data', { userId });

        let researchData = await ResearchData.findOne({ userId });

        if (!researchData) {
            researchData = { weeklyDigest: {}, currentLearningPath: {} };
        }

        // Check if weekly digest is from current week
        const currentWeekStart = getWeekStartDate();
        if (researchData.weeklyDigest?.weekStartDate !== currentWeekStart) {
            log.debug('Weekly digest expired, resetting', { userId, oldWeekStart: researchData.weeklyDigest?.weekStartDate });
            researchData.weeklyDigest = { weekStartDate: null, generatedAt: null, topics: [] };
        }

        log.success('Research data fetched', {
            userId,
            hasLearningPath: !!researchData.currentLearningPath?.topic,
            hasDigest: researchData.weeklyDigest?.topics?.length > 0
        });

        res.json({
            weeklyDigest: researchData.weeklyDigest,
            currentLearningPath: researchData.currentLearningPath
        });
    } catch (error) {
        log.failure('Fetch research data', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to get research data', details: error.message });
    }
});

// Save learning path
router.post('/save-learning-path', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { learningPath, completedItems = [] } = req.body;
        log.info('Saving learning path', { userId, topic: learningPath?.topic });

        const update = {
            currentLearningPath: {
                ...learningPath,
                completedItems,
                generatedAt: learningPath.generatedAt || new Date()
            }
        };

        const researchData = await ResearchData.findOneAndUpdate(
            { userId },
            { $set: update },
            { upsert: true, new: true }
        );

        log.success('Learning path saved', { userId, topic: learningPath?.topic });
        res.json({ success: true, currentLearningPath: researchData.currentLearningPath });
    } catch (error) {
        log.failure('Save learning path', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to save learning path' });
    }
});

// Update learning path progress (completed items)
router.post('/update-learning-progress', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { completedItems } = req.body;
        log.info('Updating learning progress', { userId, completedCount: completedItems?.length || 0 });

        const researchData = await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { 'currentLearningPath.completedItems': completedItems } },
            { new: true }
        );

        log.success('Learning progress updated', { userId, completedCount: completedItems?.length || 0 });
        res.json({ success: true, completedItems: researchData?.currentLearningPath?.completedItems || [] });
    } catch (error) {
        log.failure('Update learning progress', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Clear learning path
router.post('/clear-learning-path', async (req, res) => {
    try {
        const userId = req.user.userId;
        log.info('Clearing learning path', { userId });

        await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { currentLearningPath: {} } },
            { upsert: true }
        );

        log.success('Learning path cleared', { userId });
        res.json({ success: true });
    } catch (error) {
        log.failure('Clear learning path', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to clear learning path' });
    }
});

// Save weekly digest
router.post('/save-weekly-digest', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { digest } = req.body;
        log.info('Saving weekly digest', { userId, topicCount: digest?.topics?.length || 0 });

        const weekStartDate = getWeekStartDate();

        const update = {
            weeklyDigest: {
                weekStartDate,
                generatedAt: digest.generatedAt || new Date(),
                topics: digest.topics || []
            }
        };

        const researchData = await ResearchData.findOneAndUpdate(
            { userId },
            { $set: update },
            { upsert: true, new: true }
        );

        log.success('Weekly digest saved', { userId });
        res.json({ success: true, weeklyDigest: researchData.weeklyDigest });
    } catch (error) {
        log.failure('Save weekly digest', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to save weekly digest' });
    }
});

// Generate a Learning Path for a topic
router.post('/learning-path', async (req, res) => {
    try {
        const { topic, depth = 'basic' } = req.body;
        const userId = req.user.userId;

        if (!topic || !topic.trim()) {
            log.warn('Generate learning path failed - missing topic', { userId });
            return res.status(400).json({ error: 'Topic is required' });
        }

        log.info('Generating learning path', { userId, topic, depth });

        // Step 1: Search for authoritative sources
        const searchResults = await tavilyService.search(
            `${topic} documentation tutorial guide comprehensive introduction`,
            {
                searchDepth: 'advanced',
                maxResults: 10,
                includeAnswer: 'advanced'
            }
        );

        // Get unique domains from search results
        const topDomains = [...new Set(
            (searchResults.results || [])
                .map(r => {
                    try {
                        return new URL(r.url).hostname;
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
        )].slice(0, 3);

        log.debug('Top domains found', { userId, domains: topDomains });

        // Step 2: Map top sites for structure
        let siteMaps = [];
        try {
            siteMaps = await Promise.all(
                topDomains.map(async (domain) => {
                    try {
                        const mapResult = await tavilyService.map(`https://${domain}`, {
                            maxDepth: 2,
                            limit: 15
                        });
                        return {
                            domain,
                            success: true,
                            urls: mapResult.urls || []
                        };
                    } catch (mapError) {
                        log.warn('Site map failed for domain', { domain, error: mapError.message });
                        return {
                            domain,
                            success: false,
                            urls: []
                        };
                    }
                })
            );
        } catch (error) {
            log.warn('Site mapping error', { error: error.message });
        }

        // Step 3: If deep mode, extract content from top URLs
        let extractedContent = [];
        if (depth === 'deep') {
            const urlsToExtract = [
                ...(searchResults.results || []).slice(0, 5).map(r => r.url),
                ...siteMaps.flatMap(m => m.urls.slice(0, 3))
            ].slice(0, 10);

            log.debug('Extracting content', { userId, urlCount: urlsToExtract.length });

            try {
                const extracted = await tavilyService.extract(urlsToExtract);
                extractedContent = (extracted.results || []).map(r => ({
                    url: r.url,
                    title: r.title || 'Untitled',
                    excerpt: (r.raw_content || '').slice(0, 1000)
                }));
            } catch (extractError) {
                log.warn('Content extraction error', { error: extractError.message });
            }
        }

        // Prepare articles for AI ranking
        const articlesToRank = (searchResults.results || []).map((r, index) => ({
            title: r.title,
            url: r.url,
            reason: r.content?.slice(0, 200) || '',
            score: r.score
        }));

        // Rank articles using AI
        log.debug('Ranking articles with AI', { userId, articleCount: articlesToRank.length });
        const rankedArticles = await rankArticlesWithAI(topic, articlesToRank);

        // Build the learning path response
        const learningPath = {
            topic,
            overview: searchResults.answer || `Learning resources for ${topic}`,
            sources: topDomains,
            structure: siteMaps.filter(m => m.success).map(m => ({
                domain: m.domain,
                pages: m.urls.slice(0, 10)
            })),
            suggestedOrder: rankedArticles,
            content: extractedContent,
            generatedAt: new Date().toISOString()
        };

        // Auto-save the learning path
        await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { currentLearningPath: { ...learningPath, completedItems: [] } } },
            { upsert: true }
        );

        log.success('Learning path generated', {
            userId,
            topic,
            articleCount: rankedArticles.length,
            sourceCount: topDomains.length
        });
        res.json(learningPath);

    } catch (error) {
        log.failure('Generate learning path', error, { userId: req.user.userId, topic: req.body?.topic });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to generate learning path' });
    }
});

// Get site structure (Map API)
router.post('/map-site', async (req, res) => {
    try {
        const { url, maxDepth = 2, limit = 20 } = req.body;
        const userId = req.user.userId;

        if (!url || !url.trim()) {
            log.warn('Map site failed - missing URL', { userId });
            return res.status(400).json({ error: 'URL is required' });
        }

        log.info('Mapping site', { userId, url, maxDepth, limit });

        const mapResult = await tavilyService.map(url, { maxDepth, limit });

        log.success('Site mapped', { userId, url, pageCount: mapResult.urls?.length || 0 });
        res.json({
            url,
            pages: mapResult.urls || [],
            totalPages: (mapResult.urls || []).length
        });

    } catch (error) {
        log.failure('Map site', error, { userId: req.user.userId, url: req.body?.url });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to map site' });
    }
});

// Crawl a website for content
router.post('/crawl', async (req, res) => {
    try {
        const { url, maxDepth = 2, maxBreadth = 10, limit = 20 } = req.body;
        const userId = req.user.userId;

        if (!url || !url.trim()) {
            log.warn('Crawl site failed - missing URL', { userId });
            return res.status(400).json({ error: 'URL is required' });
        }

        log.info('Crawling site', { userId, url, maxDepth, limit });

        const crawlResult = await tavilyService.crawl(url, { maxDepth, maxBreadth, limit });

        log.success('Site crawled', { userId, url, pageCount: crawlResult.results?.length || 0 });
        res.json({
            url,
            pages: (crawlResult.results || []).map(r => ({
                url: r.url,
                title: r.title || 'Untitled',
                content: (r.raw_content || '').slice(0, 1000)
            })),
            totalPages: (crawlResult.results || []).length
        });

    } catch (error) {
        log.failure('Crawl site', error, { userId: req.user.userId, url: req.body?.url });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to crawl site' });
    }
});

// Domain-specific search (for documentation navigation)
router.post('/search-domain', async (req, res) => {
    try {
        const { query, domains, maxResults = 10 } = req.body;
        const userId = req.user.userId;

        if (!query || !query.trim()) {
            log.warn('Domain search failed - missing query', { userId });
            return res.status(400).json({ error: 'Query is required' });
        }
        if (!domains || domains.length === 0) {
            log.warn('Domain search failed - missing domains', { userId });
            return res.status(400).json({ error: 'At least one domain is required' });
        }

        log.info('Domain search', { userId, query, domains, maxResults });

        const searchResults = await tavilyService.search(query, {
            searchDepth: 'advanced',
            maxResults,
            includeDomains: domains,
            includeAnswer: true
        });

        log.success('Domain search complete', { userId, query, resultCount: searchResults.results?.length || 0 });
        res.json(tavilyService.formatSearchResults(searchResults));

    } catch (error) {
        log.failure('Domain search', error, { userId: req.user.userId, query: req.body?.query });
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to search domain' });
    }
});

module.exports = router;

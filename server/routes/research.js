const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tavilyService = require('../services/tavily');
const ResearchData = require('../models/ResearchData');

router.use(auth);

// Helper: Get the Sunday of the current week as YYYY-MM-DD
const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
};

// Get saved research data (learning path + weekly digest)
router.get('/data', async (req, res) => {
    try {
        const userId = req.user.userId;
        let researchData = await ResearchData.findOne({ userId });

        if (!researchData) {
            researchData = { weeklyDigest: {}, currentLearningPath: {} };
        }

        // Check if weekly digest is from current week
        const currentWeekStart = getWeekStartDate();
        if (researchData.weeklyDigest?.weekStartDate !== currentWeekStart) {
            // Reset digest for new week
            researchData.weeklyDigest = { weekStartDate: null, generatedAt: null, topics: [] };
        }

        res.json({
            weeklyDigest: researchData.weeklyDigest,
            currentLearningPath: researchData.currentLearningPath
        });
    } catch (error) {
        console.error('Get research data error:', error);
        res.status(500).json({ error: 'Failed to get research data' });
    }
});

// Save learning path
router.post('/save-learning-path', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { learningPath, completedItems = [] } = req.body;

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

        res.json({ success: true, currentLearningPath: researchData.currentLearningPath });
    } catch (error) {
        console.error('Save learning path error:', error);
        res.status(500).json({ error: 'Failed to save learning path' });
    }
});

// Update learning path progress (completed items)
router.post('/update-learning-progress', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { completedItems } = req.body;

        const researchData = await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { 'currentLearningPath.completedItems': completedItems } },
            { new: true }
        );

        res.json({ success: true, completedItems: researchData?.currentLearningPath?.completedItems || [] });
    } catch (error) {
        console.error('Update learning progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Clear learning path
router.post('/clear-learning-path', async (req, res) => {
    try {
        const userId = req.user.userId;

        await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { currentLearningPath: {} } },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Clear learning path error:', error);
        res.status(500).json({ error: 'Failed to clear learning path' });
    }
});

// Save weekly digest
router.post('/save-weekly-digest', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { digest } = req.body;

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

        res.json({ success: true, weeklyDigest: researchData.weeklyDigest });
    } catch (error) {
        console.error('Save weekly digest error:', error);
        res.status(500).json({ error: 'Failed to save weekly digest' });
    }
});

// Generate a Learning Path for a topic
router.post('/learning-path', async (req, res) => {
    try {
        const { topic, depth = 'basic' } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        console.log(`Generating learning path for: ${topic} (depth: ${depth})`);

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

        console.log('Top domains found:', topDomains);

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
                        console.error(`Map error for ${domain}:`, mapError.message);
                        return {
                            domain,
                            success: false,
                            urls: []
                        };
                    }
                })
            );
        } catch (error) {
            console.error('Site mapping error:', error.message);
        }

        // Step 3: If deep mode, extract content from top URLs
        let extractedContent = [];
        if (depth === 'deep') {
            const urlsToExtract = [
                ...(searchResults.results || []).slice(0, 5).map(r => r.url),
                ...siteMaps.flatMap(m => m.urls.slice(0, 3))
            ].slice(0, 10);

            console.log('Extracting content from:', urlsToExtract.length, 'URLs');

            try {
                const extracted = await tavilyService.extract(urlsToExtract);
                extractedContent = (extracted.results || []).map(r => ({
                    url: r.url,
                    title: r.title || 'Untitled',
                    excerpt: (r.raw_content || '').slice(0, 1000)
                }));
            } catch (extractError) {
                console.error('Extract error:', extractError.message);
            }
        }

        // Build the learning path response
        const learningPath = {
            topic,
            overview: searchResults.answer || `Learning resources for ${topic}`,
            sources: topDomains,
            structure: siteMaps.filter(m => m.success).map(m => ({
                domain: m.domain,
                pages: m.urls.slice(0, 10)
            })),
            suggestedOrder: (searchResults.results || []).map((r, index) => ({
                order: index + 1,
                title: r.title,
                url: r.url,
                reason: r.content?.slice(0, 200) || '',
                score: r.score
            })),
            content: extractedContent,
            generatedAt: new Date().toISOString()
        };

        // Auto-save the learning path
        const userId = req.user.userId;
        await ResearchData.findOneAndUpdate(
            { userId },
            { $set: { currentLearningPath: { ...learningPath, completedItems: [] } } },
            { upsert: true }
        );

        res.json(learningPath);

    } catch (error) {
        console.error('Learning path error:', error.message);
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

        if (!url || !url.trim()) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Mapping site: ${url}`);

        const mapResult = await tavilyService.map(url, { maxDepth, limit });

        res.json({
            url,
            pages: mapResult.urls || [],
            totalPages: (mapResult.urls || []).length
        });

    } catch (error) {
        console.error('Map site error:', error.message);
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

        if (!url || !url.trim()) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Crawling site: ${url}`);

        const crawlResult = await tavilyService.crawl(url, { maxDepth, maxBreadth, limit });

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
        console.error('Crawl error:', error.message);
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

        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Query is required' });
        }
        if (!domains || domains.length === 0) {
            return res.status(400).json({ error: 'At least one domain is required' });
        }

        console.log(`Searching "${query}" in domains:`, domains);

        const searchResults = await tavilyService.search(query, {
            searchDepth: 'advanced',
            maxResults,
            includeDomains: domains,
            includeAnswer: true
        });

        res.json(tavilyService.formatSearchResults(searchResults));

    } catch (error) {
        console.error('Domain search error:', error.message);
        if (error.message.includes('API key')) {
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to search domain' });
    }
});

module.exports = router;

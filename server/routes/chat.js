const express = require('express');
const router = express.Router();

// TODO: Install axios if needed: npm install axios
const axios = require('axios');

const auth = require('../middleware/auth');

router.use(auth);

// Search for ML articles using Tavily API
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // TODO: Add TAVILY_API_KEY to your .env file
        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Tavily API key not configured',
                message: 'Please add TAVILY_API_KEY to your .env file'
            });
        }


        console.log('Searching Tavily for:', query);

        const response = await axios.post("https://api.tavily.com/search", {
            api_key: apiKey,
            query: `${query}. Give me most recent articles or papers that helps an AI engineer or researcher to build production grade AI applications`,
            search_depth: "basic",
            include_answer: false,
            include_raw_content: false,
            max_results: 5
        });

        console.log('Tavily response data:', JSON.stringify(response.data, null, 2));

        const articles = (response.data.results || []).map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.content
        }));

        res.json({
            answer: response.data.answer,
            articles: articles
        });



    } catch (error) {
        console.error('Chat search error:', error);
        res.status(500).json({ error: 'Failed to search articles' });
    }
});

module.exports = router;

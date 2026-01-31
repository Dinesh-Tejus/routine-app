const axios = require('axios');

const TAVILY_BASE_URL = 'https://api.tavily.com';

class TavilyService {
    constructor() {
        this.apiKey = process.env.TAVILY_API_KEY;
    }

    validateApiKey() {
        if (!this.apiKey) {
            throw new Error('Tavily API key not configured. Please add TAVILY_API_KEY to your .env file');
        }
    }

    /**
     * Enhanced search with all available parameters
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {string} options.searchDepth - 'basic' or 'advanced' (default: 'basic')
     * @param {string} options.topic - 'general' or 'news' (default: 'general')
     * @param {number} options.maxResults - Max results (default: 5)
     * @param {boolean|string} options.includeAnswer - false, true, or 'advanced' (default: false)
     * @param {boolean} options.includeRawContent - Include raw HTML content (default: false)
     * @param {boolean} options.includeImages - Include images (default: false)
     * @param {string[]} options.includeDomains - Only search these domains
     * @param {string[]} options.excludeDomains - Exclude these domains
     * @param {string} options.timeRange - 'day', 'week', 'month', 'year' (for news topic)
     */
    async search(query, options = {}) {
        this.validateApiKey();

        const payload = {
            api_key: this.apiKey,
            query,
            search_depth: options.searchDepth || 'basic',
            topic: options.topic || 'general',
            max_results: options.maxResults || 5,
            include_answer: options.includeAnswer || false,
            include_raw_content: options.includeRawContent || false,
            include_images: options.includeImages || false
        };

        if (options.includeDomains?.length) {
            payload.include_domains = options.includeDomains;
        }
        if (options.excludeDomains?.length) {
            payload.exclude_domains = options.excludeDomains;
        }
        if (options.timeRange && options.topic === 'news') {
            payload.days = this.timeRangeToDays(options.timeRange);
        }

        const response = await axios.post(`${TAVILY_BASE_URL}/search`, payload);
        return response.data;
    }

    /**
     * Extract content from URLs
     * @param {string|string[]} urls - URL or array of URLs to extract
     * @param {Object} options - Extract options
     * @param {boolean} options.includeImages - Include images (default: false)
     */
    async extract(urls, options = {}) {
        this.validateApiKey();

        const urlArray = Array.isArray(urls) ? urls : [urls];

        const payload = {
            api_key: this.apiKey,
            urls: urlArray,
            include_images: options.includeImages || false
        };

        const response = await axios.post(`${TAVILY_BASE_URL}/extract`, payload);
        return response.data;
    }

    /**
     * Map a website's structure
     * @param {string} url - Base URL to map
     * @param {Object} options - Map options
     * @param {number} options.maxDepth - Max depth to crawl (default: 2)
     * @param {number} options.limit - Max URLs to return (default: 20)
     */
    async map(url, options = {}) {
        this.validateApiKey();

        const payload = {
            api_key: this.apiKey,
            url,
            max_depth: options.maxDepth || 2,
            limit: options.limit || 20
        };

        const response = await axios.post(`${TAVILY_BASE_URL}/map`, payload);
        return response.data;
    }

    /**
     * Crawl a website for content
     * @param {string} url - Base URL to crawl
     * @param {Object} options - Crawl options
     * @param {number} options.maxDepth - Max depth (default: 2)
     * @param {number} options.maxBreadth - Max breadth (default: 10)
     * @param {number} options.limit - Max pages (default: 20)
     * @param {string[]} options.selectPaths - Only crawl paths matching these patterns
     * @param {string[]} options.selectDomains - Only crawl these domains
     */
    async crawl(url, options = {}) {
        this.validateApiKey();

        const payload = {
            api_key: this.apiKey,
            url,
            max_depth: options.maxDepth || 2,
            max_breadth: options.maxBreadth || 10,
            limit: options.limit || 20
        };

        if (options.selectPaths?.length) {
            payload.select_paths = options.selectPaths;
        }
        if (options.selectDomains?.length) {
            payload.select_domains = options.selectDomains;
        }

        const response = await axios.post(`${TAVILY_BASE_URL}/crawl`, payload);
        return response.data;
    }

    /**
     * Get a direct answer to a question (QNA)
     * Uses search with advanced answer for question-answering
     * @param {string} question - Question to answer
     */
    async qna(question) {
        this.validateApiKey();

        const payload = {
            api_key: this.apiKey,
            query: question,
            search_depth: 'advanced',
            include_answer: 'advanced',
            max_results: 5
        };

        const response = await axios.post(`${TAVILY_BASE_URL}/search`, payload);
        return {
            answer: response.data.answer,
            sources: response.data.results?.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.content,
                score: r.score
            })) || []
        };
    }

    /**
     * Convert time range string to days for Tavily API
     */
    timeRangeToDays(timeRange) {
        const ranges = {
            'day': 1,
            'week': 7,
            'month': 30,
            'year': 365
        };
        return ranges[timeRange] || 7;
    }

    /**
     * Format search results into a consistent structure
     */
    formatSearchResults(data) {
        return {
            answer: data.answer || null,
            articles: (data.results || []).map(result => ({
                title: result.title,
                url: result.url,
                snippet: result.content,
                score: result.score,
                publishedDate: result.published_date || null
            }))
        };
    }
}

module.exports = new TavilyService();

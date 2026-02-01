const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenAI } = require("@google/genai");
const { planner: log } = require('../utils/logger');

router.use(auth);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/parse', async (req, res) => {
    try {
        const { text } = req.body;
        log.info('Parsing tasks from text', { userId: req.user.userId, inputLength: text?.length });

        if (!text || !text.trim()) {
            log.warn('Parse tasks failed - missing text', { userId: req.user.userId });
            return res.status(400).json({ error: 'Text is required' });
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const prompt = `You are a productivity assistant that parses natural language into structured tasks.

Current local date: ${todayStr}
User Input: "${text}"

INSTRUCTIONS:
1. Extract all tasks mentioned in the input.
2. For each task, determine:
   - "text": The description of what needs to be done.
   - "date": The intended date for the task in YYYY-MM-DD format. Default to "${todayStr}" if not specified.
   - "time": Optional time string if mentioned (e.g., "3:00 PM").
3. IMPORTANT: If the user says "next Monday", calculate the date relative to ${todayStr}.
4. Respond ONLY with a valid JSON array of objects.

Example Output:
[
  { "text": "Buy groceries", "date": "2026-01-28", "time": "5:00 PM" },
  { "text": "Code website", "date": "2026-01-29", "time": null }
]`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt
        });

        const responseText = response.text;
        log.debug('Gemini response received', { userId: req.user.userId, responseLength: responseText?.length });

        let parsedTasks;
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            parsedTasks = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        } catch (parseError) {
            log.failure('Parse Gemini response', parseError, {
                userId: req.user.userId,
                responsePreview: responseText?.slice(0, 200)
            });
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        log.success('Tasks parsed', {
            userId: req.user.userId,
            taskCount: parsedTasks.length,
            tasks: parsedTasks.map(t => t.text)
        });
        res.json(parsedTasks);

    } catch (error) {
        log.failure('Parse tasks', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to process tasks', details: error.message });
    }
});

module.exports = router;

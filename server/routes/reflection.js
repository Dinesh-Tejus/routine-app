const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenAI } = require("@google/genai");
const { reflection: log } = require('../utils/logger');

router.use(auth);

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Process reflection text and extract structured sections using Gemini
router.post('/process', async (req, res) => {
    try {
        const { text, currentLog } = req.body;
        log.info('Processing reflection', {
            userId: req.user.userId,
            inputLength: text?.length,
            hasCurrentLog: !!currentLog
        });

        if (!text || !text.trim()) {
            log.warn('Process reflection failed - missing text', { userId: req.user.userId });
            return res.status(400).json({ error: 'Text is required' });
        }

        const prompt = `You are a helpful assistant that organizes and maintains daily reflections.

The user provides reflections throughout the day. Your job is to extract new information and MERGE it with the existing reflections below.

CURRENT REFLECTIONS:
- Worked On: ${currentLog?.workedOn || 'None'}
- Finished: ${currentLog?.finished || 'None'}
- Reflections: ${currentLog?.feedback || 'None'}
- Tomorrow: ${currentLog?.tomorrowNotes || 'None'}

NEW USER INPUT:
"${text}"

INSTRUCTIONS:
1. Extract information from the NEW USER INPUT.
2. If the user mentions "OVERWRITE", start fresh and use ONLY the information from the NEW USER INPUT.
3. Otherwise, APPEND the new information to the CURRENT REFLECTIONS.
4. Be smart about merging:
   - Combine related items into concise sentences or bullet points.
   - Do not repeat information already present in CURRENT REFLECTIONS.
   - Use a professional, clean tone.
5. If a section is not mentioned in the new input and doesn't exist in current reflections, leave it as an empty string.

Please respond with a JSON object in this exact format:
{
  "workedOn": "...",
  "finished": "...",
  "feedback": "...",
  "tomorrowNotes": "..."
}

Organized and Merged Reflection:`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt
        });
        const responseText = response.text;
        log.debug('Gemini response received', { userId: req.user.userId, responseLength: responseText?.length });

        // Parse the JSON response from Gemini
        let parsedResponse;
        try {
            // Extract JSON from the response (it might be wrapped in markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        } catch (parseError) {
            log.failure('Parse Gemini response', parseError, {
                userId: req.user.userId,
                responsePreview: responseText?.slice(0, 200)
            });
            return res.status(500).json({ error: 'Failed to parse reflection data' });
        }

        log.success('Reflection processed', {
            userId: req.user.userId,
            hasWorkedOn: !!parsedResponse.workedOn,
            hasFinished: !!parsedResponse.finished,
            hasFeedback: !!parsedResponse.feedback,
            hasTomorrow: !!parsedResponse.tomorrowNotes
        });
        res.json(parsedResponse);

    } catch (error) {
        log.failure('Process reflection', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to process reflection', details: error.message });
    }
});

module.exports = router;

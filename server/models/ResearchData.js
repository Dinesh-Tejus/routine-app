const mongoose = require('mongoose');

const researchDataSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },

    // Weekly digest - resets each week (Sunday)
    weeklyDigest: {
        weekStartDate: { type: String, default: null }, // YYYY-MM-DD of Sunday
        generatedAt: { type: Date, default: null },
        topics: { type: Array, default: [] }
    },

    // Learning path - persists until user resets or searches new topic
    currentLearningPath: {
        topic: { type: String, default: null },
        overview: { type: String, default: '' },
        sources: { type: Array, default: [] },
        structure: { type: Array, default: [] },
        suggestedOrder: { type: Array, default: [] },
        content: { type: Array, default: [] },
        generatedAt: { type: Date, default: null },
        completedItems: { type: Array, default: [] } // URLs of completed items
    }
}, { timestamps: true });

module.exports = mongoose.model('ResearchData', researchDataSchema);

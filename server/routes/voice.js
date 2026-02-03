const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { WaveFile } = require('wavefile');

// Set FFmpeg path for audio conversion
ffmpeg.setFfmpegPath(ffmpegStatic);

// Lazy-loaded transcription pipeline
let transcriber = null;

// Get or initialize the transcription pipeline
const getTranscriber = async () => {
    if (!transcriber) {
        const { pipeline } = await import('@xenova/transformers');
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
    }
    return transcriber;
};

// Configure multer for audio uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/x-wav'];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'), false);
        }
    }
});

// Clean up temporary files
const cleanupFiles = (...files) => {
    files.forEach(file => {
        if (file && fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (err) {
                console.error('Error cleaning up file:', file, err);
            }
        }
    });
};

// Convert any audio format to WAV (16kHz, mono) for Whisper
const convertToWav = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace(/\.[^.]+$/, '.wav');
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioFrequency(16000)  // Whisper requires 16kHz
            .audioChannels(1)       // Mono
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    });
};

// Decode WAV file to Float32Array for Whisper pipeline
const decodeWavToFloat32 = (wavPath) => {
    const buffer = fs.readFileSync(wavPath);
    const wav = new WaveFile(buffer);
    wav.toBitDepth('32f');
    let audioData = wav.getSamples();

    // Merge stereo to mono if needed
    if (Array.isArray(audioData) && audioData.length > 1) {
        const SCALING_FACTOR = Math.sqrt(2);
        for (let i = 0; i < audioData[0].length; ++i) {
            audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
        }
        audioData = audioData[0];
    }
    return audioData;
};

// POST /api/voice/transcribe
// Transcribes audio using Transformers.js Whisper model
router.post('/transcribe', authMiddleware, upload.single('audio'), async (req, res) => {
    let inputPath = null;
    let wavPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        inputPath = req.file.path;

        // Convert audio to WAV format (16kHz, mono) for Whisper
        wavPath = await convertToWav(inputPath);

        // Decode WAV to Float32Array (required for Node.js - no AudioContext available)
        const audioData = decodeWavToFloat32(wavPath);

        // Get the transcription pipeline (lazy-loaded on first request)
        const asr = await getTranscriber();

        // Transcribe the audio data (pass Float32Array, not file path)
        const result = await asr(audioData);

        // Clean up temporary files
        cleanupFiles(inputPath, wavPath);

        // Extract text from result
        const text = result.text?.trim() || '';

        if (!text) {
            return res.status(400).json({ error: 'Could not transcribe audio. Please try again.' });
        }

        res.json({ text });

    } catch (error) {
        console.error('Transcription error:', error);

        // Clean up on error
        cleanupFiles(inputPath, wavPath);

        res.status(500).json({
            error: 'Transcription failed',
            details: error.message
        });
    }
});

// Health check for voice service
router.get('/health', async (req, res) => {
    try {
        // Check if we can load the transcriber (will download model on first call)
        const status = transcriber ? 'ready' : 'pending_initialization';

        res.json({
            status: status,
            model: 'Xenova/whisper-tiny.en',
            message: transcriber
                ? 'Voice service is ready'
                : 'Voice service ready - model will download on first transcription request'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;

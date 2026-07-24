"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// Define paths
const UPLOADS_DIR = path_1.default.join(__dirname, '../../public/uploads');
const RECORDINGS_DIR = path_1.default.join(__dirname, '../../public/recordings');
// Ensure paths exist
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs_1.default.existsSync(RECORDINGS_DIR)) {
    fs_1.default.mkdirSync(RECORDINGS_DIR, { recursive: true });
}
// Multer Storage configurations
const uploadStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const base = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const unique = `${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
        cb(null, `${base}-${unique}${ext}`);
    }
});
const recordingStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, RECORDINGS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname) || '.webm';
        const unique = `${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
        cb(null, `recording-${unique}${ext}`);
    }
});
const fileUpload = (0, multer_1.default)({
    storage: uploadStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
const recordingUpload = (0, multer_1.default)({
    storage: recordingStorage,
    limits: { fileSize: 250 * 1024 * 1024 } // 250MB
});
// 1. POST /api/messages/upload
router.post('/messages/upload', auth_1.authenticateToken, fileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        return res.status(200).json({
            url: fileUrl,
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({ error: 'Failed to process file upload' });
    }
});
// 2. POST /api/recordings/upload
router.post('/recordings/upload', auth_1.authenticateToken, recordingUpload.single('recording'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No recording file uploaded' });
        }
        const recordingUrl = `/recordings/${req.file.filename}`;
        return res.status(200).json({
            url: recordingUrl,
            name: req.file.originalname,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('Recording upload error:', error);
        return res.status(500).json({ error: 'Failed to process cloud recording upload' });
    }
});
exports.default = router;

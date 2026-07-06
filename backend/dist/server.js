"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const messages_1 = __importDefault(require("./routes/messages"));
const ai_1 = __importDefault(require("./routes/ai"));
const run_1 = __importDefault(require("./routes/run"));
const billing_1 = __importDefault(require("./routes/billing"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Configure CORS to dynamically allow requests from local development origins
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        // Allow localhost, 127.0.0.1, LAN IPs, or the environment frontend URL
        const envOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (origin === envOrigin ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://10.') ||
            origin.startsWith('http://192.168.')) {
            return callback(null, true);
        }
        return callback(null, true); // fallback allow for local ease of use
    },
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'codovate-meet-backend' });
});
// Register routes matching Next.js API endpoints
app.use('/api', auth_1.default);
app.use('/api/meetings', meetings_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/run', run_1.default);
app.use('/api/billing', billing_1.default);
app.listen(PORT, () => {
    console.log(`[SERVER SUCCESS] Backend server running on port ${PORT}`);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// POST /api/run - executes/simulates script execution in secure sandbox
router.post('/', async (req, res) => {
    try {
        const { language, code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Code is required for execution.' });
        }
        // Simulate compilation/execution delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        let output = '';
        if (code.includes('console.log')) {
            // Basic mock heuristic for logs
            const logMatches = code.match(/console\.log\((['"`])(.*?)\1\)/g);
            if (logMatches) {
                output = logMatches.map((m) => {
                    const inner = m.match(/console\.log\((['"`])(.*?)\1\)/);
                    return inner ? inner[2] : '';
                }).join('\n');
            }
            else {
                output = 'Program executed successfully. No output returned.';
            }
        }
        else {
            output = `[Sandbox Exec]: Successfully ran ${language} container.\nProgram exited with code 0.`;
        }
        // specific python printing scenarios
        if (language === 'python' && code.includes('print')) {
            const match = code.match(/print\((['"`])(.*?)\1\)/);
            if (match)
                output = match[2];
        }
        return res.status(200).json({
            language,
            version: 'latest',
            output: output
        });
    }
    catch (error) {
        console.error('Code execution error:', error);
        return res.status(500).json({ error: 'Execution failed due to server error.' });
    }
});
exports.default = router;

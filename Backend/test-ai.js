/**
 * Nova AI — Gemini Standalone Connection Test
 *
 * Run from the Backend folder:
 *   node test-ai.js
 *
 * Tests Gemini directly — no Express server needed.
 */

require('dotenv').config();
const axios = require('axios');

const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Nova AI — Gemini Connection Test          ║');
console.log('╚════════════════════════════════════════════╝');
console.log('  GEMINI_API_KEY:', GEMINI_KEY
    ? `${GEMINI_KEY.slice(0, 10)}... (length: ${GEMINI_KEY.length})`
    : '❌ NOT SET — add it to .env'
);
console.log();

if (!GEMINI_KEY) {
    console.error('🚨 Cannot test — GEMINI_API_KEY missing in .env\n');
    process.exit(1);
}

// Correct: v1 endpoint + gemini-1.5-flash-latest
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`;

(async () => {
    console.log('📡 Sending test request to Gemini...');
    console.log('   URL: https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent\n');

    try {
        const res = await axios.post(
            GEMINI_URL,
            {
                contents: [{
                    parts: [{ text: 'You are Nova, a banking AI. Say "Gemini OK — Nova is online!" and nothing else.' }]
                }],
                generationConfig: { maxOutputTokens: 50 }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            }
        );

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log('✅ GEMINI TEST PASSED');
            console.log('   Response:', text.trim());
            console.log('\n🎉 Nova AI is fully operational with Gemini!\n');
        } else {
            console.error('⚠️  Got HTTP 200 but no text in response.');
            console.error('   Raw response:', JSON.stringify(res.data, null, 2));
            process.exit(1);
        }
    } catch (err) {
        const status = err?.response?.status;
        const errBody = err?.response?.data;
        const errMsg = errBody?.error?.message || err.message;

        console.error(`❌ GEMINI TEST FAILED — HTTP ${status ?? 'No Response'}`);
        console.error(`   Error: ${errMsg}`);
        if (errBody) console.error('   Full error:', JSON.stringify(errBody, null, 2));

        if (status === 404) console.error('\n   ↳ Fix: Check model name (gemini-1.5-flash-latest) and endpoint version (v1).');
        if (status === 403) console.error('\n   ↳ Fix: API key may be invalid. Visit: https://aistudio.google.com/app/apikey');
        if (status === 429) console.error('\n   ↳ Fix: Rate limit hit. Wait 60s and retry.');

        process.exit(1);
    }
})();

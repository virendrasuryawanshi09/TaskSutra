require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    console.log("Checking API key present:", !!process.env.GEMINI_API_KEY);
    console.log("API Key preview:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello! Respond with 'OK' if you can read this.");
        console.log("SUCCESS! Response text:", result.response.text());
    } catch (err) {
        console.error("GEMINI API ERROR DETECTED:", err);
    }
}

test();

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Found (Starts with " + process.env.GEMINI_API_KEY.substring(0, 6) + "...)" : "Not found!");
    if (!process.env.GEMINI_API_KEY) {
        console.error("No GEMINI_API_KEY found in backend/.env!");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

    for (const modelName of models) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'hello' in one word.");
            console.log(`Success! Response: "${result.response.text().trim()}"`);
        } catch (error) {
            console.error(`Failed:`, error.message);
        }
    }
}

test();

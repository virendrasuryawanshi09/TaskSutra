require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

async function test() {
    console.log("Using Groq API Key:", process.env.GROQ_API_KEY ? "Found (Starts with " + process.env.GROQ_API_KEY.substring(0, 8) + "...)" : "Not found!");
    if (!process.env.GROQ_API_KEY) {
        console.error("No GROQ_API_KEY found in backend/.env!");
        return;
    }

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

    for (const modelName of models) {
        console.log(`\nTesting Groq model: ${modelName}...`);
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "user", content: "Say 'hello' in one word." }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Groq API returned status ${response.status}`);
            }

            const data = await response.json();
            console.log(`Success! Response: "${data.choices[0].message.content.trim()}"`);
        } catch (error) {
            console.error(`Failed:`, error.message);
        }
    }
}

test();

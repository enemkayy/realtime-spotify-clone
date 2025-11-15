import dotenv from "dotenv";
import https from "https";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log("🔑 API Key:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "NOT FOUND");

// Test 1: List available models
function listModels() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "generativelanguage.googleapis.com",
            path: `/v1beta/models?key=${API_KEY}`,
            method: "GET",
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if (res.statusCode === 200) {
                    const models = JSON.parse(data);
                    console.log("\n✅ Available models:");
                    models.models.forEach((m) => {
                        console.log(`  - ${m.name} (${m.displayName})`);
                    });
                    resolve(models);
                } else {
                    console.error("\n❌ Failed to list models");
                    console.error("Status:", res.statusCode);
                    console.error("Response:", data);
                    reject(new Error(data));
                }
            });
        });

        req.on("error", (e) => reject(e));
        req.end();
    });
}

// Test 2: Try generateContent with found model
async function testGenerate(modelName) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            contents: [{ parts: [{ text: "Say hello in one word" }] }],
        });

        const options = {
            hostname: "generativelanguage.googleapis.com",
            path: `/v1beta/${modelName}:generateContent?key=${API_KEY}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    const text = result.candidates[0].content.parts[0].text;
                    console.log(`\n✅ Test generateContent with ${modelName}:`);
                    console.log(`Response: ${text}`);
                    resolve(text);
                } else {
                    console.error(`\n❌ Failed to generate with ${modelName}`);
                    console.error("Status:", res.statusCode);
                    console.error("Response:", data);
                    reject(new Error(data));
                }
            });
        });

        req.on("error", (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

// Run tests
async function runTests() {
    try {
        if (!API_KEY) {
            console.error("\n❌ GEMINI_API_KEY not found in .env");
            console.log("\n🔗 Get key from: https://aistudio.google.com/app/apikey");
            return;
        }

        console.log("\n🧪 Testing API key...\n");

        // List models
        const models = await listModels();

        if (models && models.models && models.models.length > 0) {
            // Try first model
            const firstModel = models.models[0].name;
            await testGenerate(firstModel);
        }
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);

        if (error.message.includes("API_KEY_INVALID") || error.message.includes("403")) {
            console.log("\n⚠️ Your API key is INVALID or EXPIRED");
            console.log("🔗 Generate new key: https://aistudio.google.com/app/apikey");
        }
    }
}

runTests();
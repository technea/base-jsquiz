const apiKey = "AIzaSyA-bkzRI_4roUUWAIBtqttQz17YZp3M6W4";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

async function test() {
    console.log("Testing Gemini 2.0 API connection...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            })
        });
        const data = await response.json();
        console.log("STATUS:", response.status);
        if (data.candidates) {
            console.log("RESPONSE:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("DATA:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}

test();

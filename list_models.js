const apiKey = "AIzaSyA-bkzRI_4roUUWAIBtqttQz17YZp3M6W4";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function test() {
    console.log("Listing available models for the key...");
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("STATUS:", response.status);
        if (data.models) {
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("ERROR:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}

test();

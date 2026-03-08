import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, history = [] } = await req.json();

        // 1. Keys Gathering
        const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
        const geminiKeys = rawGeminiKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const groqKey = process.env.GROQ_API_KEY;
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        const context = history.map((m: any) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');
        const systemPrompt = `You are a real human JavaScript Mentor. Use the same language the student uses. Reply in the EXACT language used by the student (English, Urdu, etc.). If Urdu/Roman Urdu is used, strictly reply in ROMAN URDU (English letters). NO Arabic/Urdu script. Use natural fillers like 'oh', 'hmmm', 'theek hai'. Say "Shabash!" or "Well done!" if they are correct. Structure: Short explanation (2-3 lines), practical example, one MCQ quiz question. Double newlines between sections. Max 10 lines. Text-only for voice.`;

        let aiMessage = "";
        let success = false;

        // --- 1. Try Gemini (First Priority) ---
        if (!success && geminiKeys.length > 0) {
            const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
            try {
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nCONTEXT:\n${context}\n\nSTUDENT: "${message}"` }] }]
                    })
                });
                const geminiData = await geminiRes.json();
                if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    aiMessage = geminiData.candidates[0].content.parts[0].text;
                    success = true;
                    console.log("[AI Chat] Gemini Success");
                }
            } catch (e) { console.warn("[AI Chat] Gemini failed"); }
        }

        // --- 2. Try Groq (Llama 3 Fallback) ---
        if (!success && groqKey) {
            try {
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `CONTEXT:\n${context}\n\nSTUDENT: "${message}"` }],
                        max_tokens: 300
                    })
                });
                const groqData = await groqRes.json();
                if (groqRes.ok && groqData.choices?.[0]?.message?.content) {
                    aiMessage = groqData.choices[0].message.content;
                    success = true;
                    console.log("[AI Chat] Groq Fallback Success");
                }
            } catch (e) { console.warn("[AI Chat] Groq failed"); }
        }

        // --- 3. Try DeepSeek (The Ultimate Fallback) ---
        if (!success && deepseekKey) {
            try {
                const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${deepseekKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `CONTEXT:\n${context}\n\nSTUDENT: "${message}"` }],
                        max_tokens: 300
                    })
                });
                const dsData = await dsRes.json();
                if (dsRes.ok && dsData.choices?.[0]?.message?.content) {
                    aiMessage = dsData.choices[0].message.content;
                    success = true;
                    console.log("[AI Chat] DeepSeek Fallback Success");
                }
            } catch (e) { console.error("[AI Chat] All providers failed including DeepSeek"); }
        }

        if (!success) {
            return NextResponse.json({ error: "All AI models are currently busy. Please wait a minute and try again." }, { status: 503 });
        }

        return NextResponse.json({ message: aiMessage });

    } catch (error) {
        console.error('[AI Chat] Unexpected error:', error);
        return NextResponse.json({ error: 'System Error. Please try again.' }, { status: 500 });
    }
}

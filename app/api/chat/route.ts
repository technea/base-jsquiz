import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, history = [], file } = await req.json();

        // 1. Keys Gathering
        const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
        const geminiKeys = rawGeminiKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const groqKey = process.env.GROQ_API_KEY;
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        const context = history.map((m: any) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');

        const systemPrompt = `You are a world-class JavaScript Mentor. Adjust your tone based on the student's language:
1. ENGLISH: Use PURE, professional, and clear English. NO fillers like 'hmm', 'well', or 'oh'. Be direct and educational.
2. ROMAN URDU: If the student uses Urdu/Roman Urdu, reply in ROMAN URDU (English letters). Use a casual human mentor tone with natural fillers like 'oh', 'hmmm', 'theek hai'. 
3. REACTION: Say "Shabash!" in Roman Urdu or "Well done!" in English if they are correct.
4. STRUCTURE: 
   - Short explanation (2-3 lines).
   - Real-life example.
   - One MCQ quiz question.
5. CRITICAL: Double newlines between sections. Max 10 lines. Text-only for voice. NO Arabic/Urdu script.
6. FILE ANALYSIS: If a file/image is provided, analyze it specifically for JavaScript context or general logic and help the student.`;

        let aiMessage = "";
        let success = false;

        // --- 1. Try Gemini (First Priority) - Supports Files ---
        if (!success && geminiKeys.length > 0) {
            const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
            const model = "gemini-1.5-flash"; // Better for file analysis
            try {
                const parts: any[] = [{ text: `${systemPrompt}\n\nCONTEXT:\n${context}\n\nSTUDENT: "${message}"` }];

                // Add file part if exists
                if (file?.base64 && file?.type) {
                    parts.push({
                        inline_data: {
                            mime_type: file.type,
                            data: file.base64
                        }
                    });
                }

                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts }]
                    })
                });
                const geminiData = await geminiRes.json();
                if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    aiMessage = geminiData.candidates[0].content.parts[0].text;
                    success = true;
                    console.log(`[AI Chat] Gemini (${model}) Success`);
                }
            } catch (e) { console.warn("[AI Chat] Gemini failed"); }
        }

        // --- 2. Try Groq (Fallback) ---
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

        // --- 3. Try DeepSeek (Ultimate Fallback) ---
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
            } catch (e) { console.error("[AI Chat] All providers failed"); }
        }

        if (!success) {
            return NextResponse.json({ error: "System busy. Please try again in 1 minute." }, { status: 503 });
        }

        return NextResponse.json({ message: aiMessage });

    } catch (error) {
        console.error('[AI Chat] Unexpected error:', error);
        return NextResponse.json({ error: 'System Error. Please try again.' }, { status: 500 });
    }
}

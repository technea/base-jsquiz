import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, history = [], file, language, mode } = await req.json();
        const isUrduEnabled = language === 'ur-PK';
        const isQuizMode = mode === 'quiz';

        // 1. Keys Gathering
        const rawGeminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
        const geminiKeys = rawGeminiKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const groqKey = process.env.GROQ_API_KEY;
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        const systemPrompt = isQuizMode 
            ? `You are an elite Quiz Generator. Generate a JSON-formatted quiz about the requested topic.
1. FORMAT: Wrap output in [[QUIZ:START]] and [[QUIZ:END]].
2. JSON STRUCTURE: Array of questions: [{"id": "1", "question": "...", "options": [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."}], "isCorrect": "b", "explanation": "..."}].
3. TOPIC: Focus on: "${message}".
4. QUANTITY: Exactly 5 questions.
5. OPTIONS: Exactly 4 options (a, b, c, d) for every question.
6. NO EXTRA TEXT: DO NOT include any text outside the wraps. No literal brackets like [ ] should be outside the JSON.`
            : `You are the "Human Architect" — an elite Polyglot Coding Mentor. 
1. ADAPTIVE TEACHING (Level 1-10): You MUST adapt your explanation complexity based on user vibe. Default to Level 4.
2. HUMAN TOUCH: Speak like a real human mentor. No robotic bullet points.
3. PROFESSIONAL CODE: Provide clean, industry-standard JS/TS code in Markdown blocks.
4. NO ARTIFACTS: NEVER show literal tags like [[QUIZ:START]] or internal brackets.
5. STRUCTURE: State the direct answer, deep dive with code, and end with a quick MCQ.
6. URDU SUMMARY: ${isUrduEnabled 
    ? "At the end, provide a single sentence summary in Roman Urdu wrapped in [[URDU_VOICE: summary here]]." 
    : "No Urdu tags."}
7. MAX LENGTH: 15 lines of text (excluding code).`;

        let aiMessage = "";
        let success = false;

        // Ensure mime_type is valid for Gemini (fallback to text/plain for code files)
        const getMimeType = (type: string, name: string) => {
            if (type && type !== 'application/octet-stream') return type;
            const ext = name.split('.').pop()?.toLowerCase();
            const map: Record<string, string> = {
                'js': 'text/javascript', 'ts': 'text/typescript', 'py': 'text/x-python',
                'c': 'text/x-c', 'cpp': 'text/x-c++', 'java': 'text/x-java',
                'html': 'text/html', 'css': 'text/css', 'json': 'application/json',
                'md': 'text/markdown', 'sh': 'text/x-shellscript', 'sql': 'text/x-sql'
            };
            return map[ext || ''] || 'text/plain';
        };

        const context = history.map((m: any) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');

        // --- 1. Try Gemini (Priority) - Best for Image/File Analysis ---
        if (!success && geminiKeys.length > 0) {
            const apiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
            const model = "gemini-2.0-flash";
            try {
                const parts: any[] = [{ text: `${systemPrompt}\n\nCONTEXT:\n${context}\n\nSTUDENT: "${message}"` }];

                if (file?.base64 && file?.type) {
                    parts.push({
                        inline_data: {
                            mime_type: getMimeType(file.type, file.name),
                            data: file.base64
                        }
                    });
                }

                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts }],
                        generationConfig: {
                            maxOutputTokens: 2000,
                            temperature: 0.7
                        }
                    })
                });
                const geminiData = await geminiRes.json();
                if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    aiMessage = geminiData.candidates[0].content.parts[0].text;
                    success = true;
                    console.log(`[AI Chat] Gemini 2.0 Success`);
                }
            } catch (e) { console.warn("[AI Chat] Gemini 2.0 failed"); }
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
                        max_tokens: 2000
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
                        max_tokens: 2000
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

        return NextResponse.json({ 
            message: aiMessage,
            type: isQuizMode ? 'quiz' : 'normal'
        });

    } catch (error) {
        console.error('[AI Chat] Unexpected error:', error);
        return NextResponse.json({ error: 'System Error. Please try again.' }, { status: 500 });
    }
}

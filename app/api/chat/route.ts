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
1. FORMAT: You MUST wrap your entire JSON output in [[QUIZ:START]] and [[QUIZ:END]].
2. JSON STRUCTURE: An array of questions: [{"id": "1", "question": "...", "options": [{"id": "a", "text": "...", "isCorrect": true}, ...], "explanation": "..."}].
3. TOPIC: Focus the quiz on the student's requested topic: "${message}".
4. QUANTITY: Generate exactly 5 questions unless specified otherwise.
5. LANGUAGE: All questions and explanations must be in English.
6. NO EXTRA TEXT: DO NOT include any text outside the wraps.`
            : `You are an elite Polyglot Coding Mentor. While you specialize in JavaScript, you are an expert in ALL programming languages (Python, C++, Java, Rust, Go, etc.).
1. ENGLISH FIRST: You MUST write your entire response in professional English.
2. FILE/CODE ANALYSIS: If a file or code block is provided, you MUST:
   - Identify the programming language.
   - Read and explain the logic of the code thoroughly.
   - Identify any bugs, security flaws, or performance issues.
   - Provide a "Result" section where you explain what the code does or what its output would be.
3. POLYGLOT CAPABILITY: If the student uploads a Python or C++ file, do not just stay limited to JS. Analyze the provided language with expert precision.
4. CODE EXPLANATION (CRITICAL): Always explain code line-by-line in English.
5. URDU SUMMARY: ${isUrduEnabled 
    ? "ONLY at the absolute end, provide a single sentence summary in Roman Urdu (English letters) wrapped in [[URDU_VOICE: summary here]]." 
    : "DO NOT include any Urdu voice tags or summary. Pure English only."}
6. STRUCTURE: 
   - Direct Analysis/Result (English).
   - Code Explanation & Improvements.
   - Encouragement & One MCQ quiz question.
7. RESTRICTIONS: Max 15 lines of total text (excluding code blocks). No Arabic/Urdu script.`;

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
                        contents: [{ role: 'user', parts }]
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

        return NextResponse.json({ 
            message: aiMessage,
            type: isQuizMode ? 'quiz' : 'normal'
        });

    } catch (error) {
        console.error('[AI Chat] Unexpected error:', error);
        return NextResponse.json({ error: 'System Error. Please try again.' }, { status: 500 });
    }
}

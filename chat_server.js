import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = 3001; // Using a different port for the chat server
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Gemini Setup
// Ensure GOOGLE_API_KEY is available for the SDK if needed
if (!process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware (Reusing logic from auth.js, ideally should be a shared module)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, "mysecretkey", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

/* 
  POST /chat
  Body: { message: "Hello", chat_id: "uuid" (optional) }
  Response: { chat_id: "uuid", message: "AI Response" }
*/
app.post("/chat", authenticateToken, async (req, res) => {
    const { message, chat_id } = req.body;
    const userId = req.user.id; // From token

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    let currentChatId = chat_id;

    try {
        // 1. Create or Verify Chat
        if (!currentChatId) {
            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert([{ user_id: userId, title: message.substring(0, 30) }])
                .select()
                .single();

            if (chatError) throw chatError;
            currentChatId = newChat.id;
        } else {
            // Optional: Verify chat belongs to user
        }

        // 2. Fetch History (Last 10 messages)
        const { data: history, error: historyError } = await supabase
            .from('messages')
            .select('role, content')
            .eq('chat_id', currentChatId)
            .order('created_at', { ascending: true }); // Gemini needs chronological order

        if (historyError) throw historyError;

        // 3. Prepare History for Gemini
        // Map Supabase 'content' to Gemini 'parts: [{ text }]'
        const chatHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        // 4. Save User Message
        await supabase.from('messages').insert({
            chat_id: currentChatId,
            role: 'user',
            content: message
        });

        // 5. Call Gemini
        const chatSession = ai.chats.create({
            model: "gemini-2.0-flash",
            history: chatHistory
        });

        let aiResponseText = "I'm sorry, I'm currently overwhelmed (Rate Limited). Please try again later.";

        try {
            const result = await chatSession.sendMessage({ message: message });
            aiResponseText = result.text;
        } catch (geminiError) {
            console.error("Gemini API Error:", geminiError);
            if (geminiError.status === 429) {
                // Keep the default rate limit message
            } else {
                throw geminiError;
            }
        }

        // 6. Save AI Response
        await supabase.from('messages').insert({
            chat_id: currentChatId,
            role: 'model',
            content: aiResponseText
        });

        res.json({
            chat_id: currentChatId,
            message: aiResponseText
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

/*
  GET /chats
  List all chats for the user
*/
app.get("/chats", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*
  GET /chats/:id
  Get specific chat history
*/
app.get("/chats/:id", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', req.params.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
});

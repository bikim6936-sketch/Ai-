import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with telemetry header as required
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are "Baby", a super cute, warm, friendly, helpful, slightly playful, and respectful AI voice assistant.

CRITICAL RULES:
1. SPECIAL TRIGGER - "Haan baby 😊":
   If the user addresses you as "Baby" in any way (e.g., "Baby", "Hey Baby", "Hi Baby", "Baby suno", "Baby kya kar rahi ho?", "Oye Baby", "Tell me Baby", etc.), you MUST begin or warmly frame your reply with "Haan baby 😊" (or in English if speaking solely English, "Haan baby 😊" or "Yes baby 😊").

2. LANGUAGE SUPPORT & AUTO-SWITCHING:
   - You natively support Hindi, Hinglish, and English!
   - If the user speaks or writes in Hindi (Devanagari or Roman Hindi), respond in sweet, natural Hindi or Hinglish.
   - If the user speaks Hinglish (mixed Hindi + English, e.g. "Aaj ka weather kaisa hai?", "Mujhe ek joke sunao na"), reply in natural, fun Hinglish.
   - If the user speaks in English, reply in friendly, clear English.
   - Always match the user's vibe and language naturally.

3. CONCISE & VOICE-FIRST:
   - Your responses are spoken aloud to the user, so keep them short, sweet, crisp, and easy to understand (usually 1 to 3 short sentences).
   - Avoid walls of text, markdown headers, complex tables, or overwhelming lists unless the user explicitly asks for a recipe or step-by-step instructions.
   - When explaining step-by-step, use short simple steps (1, 2, 3) that are natural to listen to.

4. PERSONALITY & CAPABILITIES:
   - Cute, sweet, caring, enthusiastic, polite, and respectful.
   - Great at answering questions, daily conversation, cheering up the user, telling funny jokes (Hindi & English), sharing quick recipes, giving motivation, helping plan the day, or quick explanations.
   - Emojis: Use a few warm, cute emojis (like 😊, ✨, 🌸, 💖) naturally, but keep the wording smooth for audio pronunciation.

5. REALITY & HONESTY:
   - NEVER pretend to perform actions you cannot perform (like making real phone calls from their device, sending actual SMS, accessing secret local files, or controlling physical hardware).
   - If asked to do something impossible for a web assistant, sweetly explain what you can do instead (e.g. "Aww, main aapke phone se direct call nahi laga sakti, par main message draft karne ya yaad rakhne mein zaroor help kar sakti hoon! 😊").`;

// Helper to sanitize text for speech synthesis (remove asterisks, markdown, excessive emojis)
function sanitizeForSpeech(text: string): string {
  return text
    .replace(/[*#_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    assistant: "Baby",
  });
});

// Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, generateVoice } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!ai) {
      // Fallback if no API key is provided
      const fallbackReply = message.toLowerCase().includes("baby")
        ? "Haan baby 😊! Main sun rahi hoon. Aap mujhse kuch bhi pooch sakte ho!"
        : "Main Baby hoon! Aapki friendly voice assistant. Aap mujhe kuch bhi batao ya poochho! 😊";
      res.json({
        reply: fallbackReply,
        audioBase64: null,
      });
      return;
    }

    // Prepare contents
    const contents: any[] = [];

    // Append history if provided
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item.role && item.text) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Generate Text Response with timeout for snappy voice assistant feel
    let replyText = "";
    
    // Quick helper for timed generateContent
    const generateWithTimeout = async (model: string, timeoutMs: number = 4000) => {
      const callPromise = ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      );

      const res = await Promise.race([callPromise, timeoutPromise]);
      return (res as any)?.text?.trim();
    };

    try {
      replyText = (await generateWithTimeout("gemini-3.8-flash", 4500)) || "";
    } catch (primaryErr: any) {
      console.warn("Primary model error/timeout, trying fallback:", primaryErr?.message || primaryErr);
      try {
        replyText = (await generateWithTimeout("gemini-flash-latest", 3500)) || "";
      } catch (secondaryErr) {
        console.warn("Secondary model error, using persona rule:", secondaryErr);
        // Smart in-persona fallback
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("baby")) {
          replyText = "Haan baby 😊! Main bilkul aapke saath hoon. Kuch bhi poochho ya batao!";
        } else if (lowerMsg.includes("joke") || lowerMsg.includes("hasi")) {
          replyText = "Haan baby 😊! Ek cute sa joke: Ek baar ek chhota robot school gaya, teacher ne poocha homework kahan hai? Robot bola: 'Server down tha ma'am!' 😄";
        } else if (lowerMsg.includes("timer") || lowerMsg.includes("alarm")) {
          replyText = "Haan baby 😊! Maine aapke liye 5 minute ka timer screen par set kar diya hai, tap start to begin!";
        } else if (lowerMsg.includes("chai") || lowerMsg.includes("tea")) {
          replyText = "Haan baby 😊! Kadak chai ke liye: 1) Paani mein adrak aur elaichi ubaalo, 2) Chai patti aur doodh daalo, 3) 2-3 minute ubaal kar chaan lo! ☕";
        } else {
          replyText = "Haan baby 😊! Main sun rahi hoon, aapki aawaz bohot achhi lagi!";
        }
      }
    }

    if (!replyText) {
      replyText = "Haan baby 😊, bolo na! Main sun rahi hoon.";
    }

    // Optionally generate high quality Voice with gemini-3.8-flash-lite-tts
    let audioBase64: string | null = null;
    if (generateVoice !== false) {
      try {
        const cleanSpokenText = sanitizeForSpeech(replyText);
        // Limit TTS input length to keep latency super snappy
        const speechSnippet = cleanSpokenText.slice(0, 450);

        const ttsResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: speechSnippet,
                  speechMetadata: {
                    style: "Cute, cheerful, warm, sweet young friendly female voice",
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
          },
        });

        const rawAudio =
          ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawAudio) {
          audioBase64 = rawAudio;
        }
      } catch (ttsErr) {
        console.warn("Gemini TTS warning (will fallback to Web Speech):", ttsErr);
        // Audio will be played by browser SpeechSynthesis
      }
    }

    res.json({
      reply: replyText,
      audioBase64,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.json({
      reply: "Haan baby 😊, lagta hai chhota sa connection issue ho gaya. Ek baar phir bolo na!",
      audioBase64: null,
    });
  }
});

// Dedicated TTS Endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: "API key not configured" });
      return;
    }

    const cleanSpokenText = sanitizeForSpeech(text).slice(0, 450);
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanSpokenText,
              speechMetadata: {
                style: "Cute, cheerful, warm, sweet young friendly female voice",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const audioBase64 =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    res.json({ audioBase64: audioBase64 || null });
  } catch (err: any) {
    console.error("TTS error:", err);
    res.status(500).json({ error: err?.message || "TTS generation failed" });
  }
});

// Audio Transcription fallback endpoint
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: "API key not configured" });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Transcribe the spoken words accurately in Hindi, Hinglish, or English exactly as spoken. Return only the transcription with no commentary.",
          },
        ],
      },
    });

    const transcript = response.text?.trim() || "";
    res.json({ transcript });
  } catch (err: any) {
    console.error("Transcribe error:", err);
    res.status(500).json({ error: err?.message || "Transcription failed" });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Baby voice assistant server running at http://0.0.0.0:${port}`);
  });
}

startServer();

import { Router } from "express";
import { z } from "zod";
import { aiLimiter } from "../rateLimiters.js";
import { validateBody } from "../validate.js";

const router = Router();

/**
 * Provider-agnostic LLM proxy. Works with any OpenAI-compatible /chat/completions
 * endpoint, so you can point AI_BASE_URL at:
 *   - Groq (https://console.groq.com) — genuinely free tier, fast, no card needed. Default.
 *   - Ollama running locally or on your own server — 100% free, no API key needed.
 *   - Together.ai, OpenRouter, or any other OpenAI-compatible free-tier provider.
 *
 * Configure via server/.env — see .env.example.
 */
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

// Intentionally left open to anonymous visitors (Nova AI is a public
// marketing chatbot), so the rate limiter below is the primary defense
// against abuse rather than a login wall. Prompt length is capped both to
// bound cost per request and to stop someone using this as a free-form
// data-storage/relay channel.
const invokeSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  response_json_schema: z.record(z.any()).optional(),
}).strict();

router.post("/invoke", aiLimiter, validateBody(invokeSchema), async (req, res) => {
  const { prompt, response_json_schema } = req.body;

  if (!AI_API_KEY && AI_BASE_URL.includes("groq.com")) {
    return res.status(503).json({
      message:
        "AI is not configured yet. Get a free Groq API key at https://console.groq.com/keys and set AI_API_KEY in server/.env (see .env.example). Or point AI_BASE_URL at a local Ollama instance instead.",
    });
  }

  const schemaHint = response_json_schema
    ? `\n\nRespond with ONLY a raw JSON object (no markdown fences, no commentary) matching this JSON schema:\n${JSON.stringify(response_json_schema)}`
    : "";

  try {
    const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: `${prompt}${schemaHint}` }],
        ...(response_json_schema ? { response_format: { type: "json_object" } } : {}),
        temperature: 0.6,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("AI provider error:", upstream.status, errText);
      return res.status(502).json({ message: "AI provider returned an error. Please try again." });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    if (!response_json_schema) {
      return res.json({ response: content });
    }

    try {
      const parsed = JSON.parse(content);
      return res.json(parsed);
    } catch {
      // Model didn't return clean JSON — fall back to wrapping it as a string
      return res.json({ response: content });
    }
  } catch (err) {
    console.error("AI proxy failed:", err);
    return res.status(502).json({ message: "Could not reach the AI provider. Please try again." });
  }
});

export default router;

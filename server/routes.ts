import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchRequestSchema } from "@shared/schema";

// Try to load Gemini SDK
let genAI: any = null;
const geminiKey = process.env.GEMINI_API_KEY || "";
if (geminiKey) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    genAI = new GoogleGenerativeAI(geminiKey);
    console.log("Using Gemini API (gemini-2.5-flash)");
  } catch (e) {
    console.error("Failed to load Gemini SDK:", e);
  }
}

// Try to load Anthropic SDK as fallback (for sandbox/dev)
let anthropicClient: any = null;
if (!genAI && process.env.ANTHROPIC_API_KEY) {
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    anthropicClient = new Anthropic.default();
    console.log("Using Anthropic API (claude_sonnet_4_6)");
  } catch (e) {
    console.error("Failed to load Anthropic SDK:", e);
  }
}

// Unified LLM call function
async function callLLM(prompt: string, maxTokens: number = 4096, jsonMode: boolean = false): Promise<string> {
  if (genAI) {
    // Gemini path
    const generationConfig: any = {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
    };
    if (jsonMode) {
      generationConfig.responseMimeType = "application/json";
      // Disable thinking for JSON mode: thinking tokens consume output budget
      // and cause JSON truncation on gemini-2.5-flash (thinking model)
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
    });
    const result = await model.generateContent(prompt);
    const candidate = result.response.candidates?.[0];
    if (!candidate || candidate.finishReason === "SAFETY" || candidate.finishReason === "RECITATION") {
      throw new Error(`Gemini response blocked: ${candidate?.finishReason ?? "no candidates"}`);
    }
    return result.response.text();
  } else if (anthropicClient) {
    // Anthropic path (sandbox fallback)
    const message = await anthropicClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    let text = "";
    for (const block of message.content) {
      if (block.type === "text") text += block.text;
    }
    return text;
  } else {
    throw new Error("No LLM API configured. Set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY.");
  }
}

function buildSearchPrompt(query: string, searchType: string, yearRange?: { from?: number; to?: number }, studyTypes?: string[]): string {
  let typeInstruction = "";
  switch (searchType) {
    case "topic":
      typeInstruction = `Search broadly for academic research on the topic: "${query}". Include various perspectives and study types.`;
      break;
    case "author":
      typeInstruction = `Search for notable academic research papers by or about the researcher/author: "${query}". Focus on their key contributions and findings.`;
      break;
    case "method":
      typeInstruction = `Search for academic research papers that use or discuss the methodology/technique: "${query}". Focus on how this method is applied and its effectiveness.`;
      break;
    default:
      typeInstruction = `Search for academic research papers that answer the question: "${query}"`;
  }

  let filters = "";
  if (yearRange?.from || yearRange?.to) {
    filters += `\nFilter by year: ${yearRange.from || "any"} to ${yearRange.to || "present"}.`;
  }
  if (studyTypes && studyTypes.length > 0) {
    filters += `\nPrefer these study types: ${studyTypes.join(", ")}.`;
  }

  return `You are a research paper analysis assistant with deep knowledge of academic literature. ${typeInstruction}
${filters}

Based on your knowledge of peer-reviewed research literature, provide an analysis of this topic. Include real papers that you know about from your training data. Be as accurate as possible about paper details (authors, journals, years).

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation before or after. Just the raw JSON:
{
  "summary": "2-3 sentence synthesis of what research says about this topic",
  "consensusMeter": {
    "yes": <0-100 percentage of papers supporting>,
    "possibly": <0-100 percentage of papers with mixed findings>,
    "no": <0-100 percentage of papers contradicting>,
    "totalPapers": <number of papers analyzed>
  },
  "papers": [
    {
      "title": "Full paper title",
      "authors": ["Author 1", "Author 2"],
      "journal": "Journal name",
      "year": 2024,
      "citations": 100,
      "stance": "yes",
      "takeaway": "One-sentence key finding",
      "abstract": "Brief abstract summary (2-3 sentences)",
      "methodology": "Study methodology description",
      "sampleSize": "Sample size if applicable",
      "studyType": "Meta Analysis",
      "url": "https://doi.org/... or actual paper URL"
    }
  ],
  "keyFindings": [
    {"text": "Key finding 1", "confidence": "high"},
    {"text": "Key finding 2", "confidence": "medium"}
  ],
  "conclusion": "Overall conclusion based on the evidence"
}

Rules:
- stance must be: "yes", "possibly", or "no"
- studyType must be one of: "RCT", "Systematic Review", "Meta Analysis", "Observational Study", "Review", "Cohort Study", "Case Study", "Modeling Study"
- confidence must be: "high", "medium", or "low"
- Include 5-8 papers. Use real papers you know from training data with real DOIs/URLs when possible.
- consensusMeter percentages must sum to 100
- Be factual and evidence-based. If you are uncertain about specific citation details, note it in the abstract.
- Output ONLY the raw JSON object. No markdown, no code fences, no backticks, no explanation. Start with { and end with }.`;
}

function sanitizeJsonString(raw: string): string {
  let sanitized = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      sanitized += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      sanitized += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      sanitized += ch;
      continue;
    }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        if (ch === '\n') sanitized += '\\n';
        else if (ch === '\r') sanitized += '\\r';
        else if (ch === '\t') sanitized += '\\t';
        else sanitized += ' ';
        continue;
      }
    }
    sanitized += ch;
  }
  return sanitized;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      provider: genAI ? "gemini" : anthropicClient ? "anthropic" : "none",
      model: genAI ? "gemini-2.5-flash" : "claude_sonnet_4_6",
    });
  });

  // Search papers
  app.post("/api/search", async (req, res) => {
    try {
      const parsed = searchRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search request", details: parsed.error.issues });
      }

      const { query, searchType, yearRange, studyTypes } = parsed.data;
      const prompt = buildSearchPrompt(query, searchType, yearRange, studyTypes);

      const resultText = await callLLM(prompt, 8192, true);

      // Strip markdown code fences if present
      let cleanText = resultText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Extract JSON from response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response:", cleanText.substring(0, 200));
        return res.status(500).json({ error: "Could not parse AI response" });
      }

      const sanitized = sanitizeJsonString(jsonMatch[0]);
      
      let result;
      try {
        result = JSON.parse(sanitized);
      } catch (parseErr: any) {
        // Try a more aggressive cleanup: remove trailing commas before ] or }
        const fixedJson = sanitized
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')
          .replace(/([\]"\d])(\s*")/g, '$1,$2'); // add missing commas
        try {
          result = JSON.parse(fixedJson);
        } catch (fixedErr: any) {
          console.error("JSON parse failed after cleanup. Original error:", parseErr.message);
          console.error("Cleanup error:", fixedErr.message);
          console.error("Raw text (first 500):", resultText.substring(0, 500));
          throw new Error(`JSON parse failed: ${fixedErr.message}`);
        }
      }

      // Save to history
      await storage.createSearch({
        query,
        resultJson: JSON.stringify(result),
        createdAt: new Date().toISOString(),
      });

      res.json(result);
    } catch (err: any) {
      console.error("Search error:", err);
      res.status(500).json({ error: "Search failed. Please try again.", details: err.message });
    }
  });

  // Ask about a paper
  app.post("/api/ask-paper", async (req, res) => {
    try {
      const { paperTitle, paperAuthors, paperJournal, paperTakeaway, question } = req.body;

      if (!paperTitle || !question) {
        return res.status(400).json({ error: "Paper title and question are required" });
      }

      const answerText = await callLLM(
        `You are a research paper expert. Answer questions about this paper based on your knowledge:

Paper: "${paperTitle}"
Authors: ${paperAuthors || "Unknown"}
Journal: ${paperJournal || "Unknown"}
Finding: ${paperTakeaway || "Not specified"}

Question: ${question}

Provide a helpful, evidence-based answer. Be concise and accurate. If you're not certain about specific details, say so.`,
        1024
      );

      res.json({ answer: answerText || "Could not generate a response." });
    } catch (err: any) {
      console.error("Ask paper error:", err);
      res.status(500).json({ error: "Failed to process question." });
    }
  });

  // Search history
  app.get("/api/history", async (_req, res) => {
    const searches = await storage.getSearches();
    res.json(searches);
  });

  app.delete("/api/history/:id", async (req, res) => {
    await storage.deleteSearch(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Saved papers
  app.get("/api/saved-papers", async (_req, res) => {
    const papers = await storage.getSavedPapers();
    res.json(papers);
  });

  app.post("/api/saved-papers", async (req, res) => {
    try {
      const paper = await storage.savePaper({
        ...req.body,
        authors: JSON.stringify(req.body.authors || []),
        savedAt: new Date().toISOString(),
      });
      res.json(paper);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save paper." });
    }
  });

  app.delete("/api/saved-papers/:id", async (req, res) => {
    await storage.deleteSavedPaper(parseInt(req.params.id));
    res.json({ success: true });
  });

  return httpServer;
}

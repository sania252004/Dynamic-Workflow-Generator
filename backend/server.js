// server.js
// This is our Express server. It has ONE main job:
// take a plain English sentence from the user, ask an LLM to turn it
// into structured workflow JSON, and send that JSON back to React.

import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // loads variables from the .env file into process.env

const app = express();

// Allow our React app (running on a different port) to call this server
app.use(cors());

// Allow the server to understand JSON request bodies
app.use(express.json());

// Read settings from environment variables (with safe fallbacks)
const PORT = process.env.PORT || 5000;
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

// This is the instruction we give the LLM every time.
// It tells the model EXACTLY what shape of JSON we want back.
const SYSTEM_PROMPT = `You convert a business process described in plain English into workflow JSON.

Rules:
- Reply with ONLY valid JSON. No markdown, no code fences, no explanations, no extra text.
- Use this exact shape:
{
  "workflow": [
    {
      "id": 1,
      "stepName": "Collect Documents",
      "stepType": "Input",
      "sequence": 1,
      "dependencies": []
    }
  ]
}
- "stepType" must be one of: "Input", "Approval", "Notification", "Decision", "Action", "End".
- "id" and "sequence" are numbers, starting at 1, increasing in order.
- "dependencies" is an array of stepName strings that must happen before this step (empty array if none).
- Always include a final step with stepType "End".
- Break the process into clear, sensible steps based on what the user describes.`;

// Small helper function: tries to pull clean JSON out of whatever text the LLM sent back.
// Sometimes models add stray text or markdown fences even when told not to, so we clean it up.
function extractJson(rawText) {
  // Remove ```json or ``` fences if the model added them anyway
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "");
  cleaned = cleaned.trim();

  // As a last safety net, grab everything between the first { and the last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned); // will throw if it's still not valid JSON
}

// POST /generate-workflow
// Body: { "prompt": "some business process in plain English" }
// Response: { "workflow": [ ...steps ] }
app.post("/generate-workflow", async (req, res) => {
  const { prompt } = req.body;

  // Basic validation: make sure the user actually sent some text
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a 'prompt' describing your workflow." });
  }

  try {
    // Call the OpenAI-compatible chat completions endpoint
    const response = await axios.post(
      LLM_API_URL,
      {
        model: LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2, // low temperature = more predictable, consistent JSON
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
      }
    );

    // Pull the raw text the model replied with
    const rawText = response.data.choices?.[0]?.message?.content || "";

    // Try to turn that text into a real JSON object
    let workflowData;
    try {
      workflowData = extractJson(rawText);
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", rawText);
      return res.status(502).json({
        error: "The AI returned a response we couldn't understand. Please try rephrasing your workflow.",
      });
    }

    // Make sure the parsed JSON actually has a "workflow" array
    if (!workflowData.workflow || !Array.isArray(workflowData.workflow)) {
      return res.status(502).json({
        error: "The AI response was missing the expected workflow data. Please try again.",
      });
    }

    // Everything looks good — send it to the frontend
    return res.json(workflowData);
  } catch (error) {
    console.error("Error calling LLM API:", error.message);
    return res.status(500).json({
      error: "Something went wrong while generating the workflow. Please try again.",
    });
  }
});

// Simple health check route, useful for testing the server is alive
app.get("/", (req, res) => {
  res.send("Dynamic Workflow Generator backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

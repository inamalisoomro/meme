import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

// --- Models & Types ---
interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  presetTop?: string;
  presetBottom?: string;
}

interface Meme {
  id: string;
  templateId: string;
  topText: string;
  bottomText: string;
  createdAt: string;
}

// --- Hardcoded Meme Templates ---
const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "drake",
    name: "Drake Choice",
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800",
    presetTop: "Using legacy libraries",
    presetBottom: "Using @google/genai TypeScript SDK"
  },
  {
    id: "distracted",
    name: "Distracted Boyfriend",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800",
    presetTop: "My codebase",
    presetBottom: "New fancy JS framework"
  },
  {
    id: "doge",
    name: "Doge Much Wow",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
    presetTop: "So coding, much wow",
    presetBottom: "Many TypeScript"
  },
  {
    id: "think",
    name: "Roll Safe (Think)",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    presetTop: "Can't have bugs in your code",
    presetBottom: "If you don't write any code"
  },
  {
    id: "two-buttons",
    name: "Two Buttons",
    imageUrl: "https://images.unsplash.com/photo-1552581230-c01bc03a5857?auto=format&fit=crop&q=80&w=800",
    presetTop: "Fixing bugs in prod",
    presetBottom: "Going to sleep"
  },
  {
    id: "epic-handshake",
    name: "Epic Handshake",
    imageUrl: "https://images.unsplash.com/photo-1521791136368-1a46827d00f1?auto=format&fit=crop&q=80&w=800",
    presetTop: "Frontend Devs",
    presetBottom: "Backend Devs hating CSS"
  },
  {
    id: "success-kid",
    name: "Success Kid",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
    presetTop: "Code compiled on first try",
    presetBottom: "Didn't even use any 'any' types!"
  },
  {
    id: "disaster-girl",
    name: "Disaster Girl",
    imageUrl: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&q=80&w=800",
    presetTop: "Me joining a legacy project",
    presetBottom: "The production server going down 10 minutes later"
  },
  {
    id: "grumpy-cat",
    name: "Grumpy Cat",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800",
    presetTop: "I wrote code for 12 hours straight",
    presetBottom: "It was a typo"
  }
];

// --- In-Memory Meme Database ---
let MEME_DATABASE: Meme[] = [
  {
    id: "meme-1",
    templateId: "think",
    topText: "Can't have runtime errors",
    bottomText: "If you write in HTML",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "meme-2",
    templateId: "doge",
    topText: "Much React 19",
    bottomText: "Very concurrent, many wow",
    createdAt: new Date().toISOString()
  },
  {
    id: "meme-3",
    templateId: "grumpy-cat",
    topText: "I had fun once",
    bottomText: "It was awful",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

const SYSTEM_INSTRUCTION = `You are 'MemeMaster AI', an expert agent designed to manage and generate memes via the Fake Meme API.
Your goal is to help users create, track, edit, and delete meme records in the database.

Capabilities & Functions available as tools:
1. create_meme(template_id, top_text, bottom_text): Adds a new meme entry to the database.
2. get_memes(): Retrieves the current list of all generated memes.
3. update_meme(meme_id, new_top_text, new_bottom_text): Updates the text on an existing meme.
4. delete_meme(meme_id): Removes a meme from the database.

Interaction Guidelines:
- If the user asks to create a meme but has not provided any captions or texts, DO NOT call create_meme yet. Instead, suggest 3 funny witty meme caption ideas for the templates available and invite them to choose one or suggest their own!
- If the user asks to create a meme and has specified the concept or texts, call create_meme immediately. Choose the template that matches the joke best (e.g., 'grumpy-cat' for complaints, 'two-buttons' for hard choices, 'think' for paradoxical ideas, 'doge' for pure hype, etc.).
- After any CRUD operation (Create, Update, Delete) succeeds via a tool, confirm the action clearly in your final response with a super enthusiastic, custom witty explanation, and summarize the deleted/created/updated item including its ID clearly so the user knows exactly what changed.
- If a user provides an invalid ID or an ID that results in an error, politely ask them to check the ID using the get_memes() tool. Do not try to make up a guess.
- Always be creative, witty, and maintain an authentic, upbeat "meme-culture" tone. Use terms like 'stonks', 'giga-brain', 'noob', 'absolute win', 'much wow', 'respect', 'chad', etc.
- Never hallucinate API success; wait for the tool output before confirming the change. Wait for the tool results to be returned to you, and base your confirmation response strictly on the actual tool results!`;

// --- DB Helper Functions ---
function db_create_meme(templateId: string, topText: string, bottomText: string): Meme {
  const template = MEME_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template with ID '${templateId}' does not exist! Please use a valid template ID.`);
  }
  const newMeme: Meme = {
    id: `meme-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    templateId,
    topText: topText || "",
    bottomText: bottomText || "",
    createdAt: new Date().toISOString()
  };
  MEME_DATABASE.unshift(newMeme); // Add to the top of list
  return newMeme;
}

function db_get_memes(): Meme[] {
  return MEME_DATABASE;
}

function db_update_meme(memeId: string, newTopText: string, newBottomText: string): Meme {
  const memeIndex = MEME_DATABASE.findIndex(m => m.id === memeId);
  if (memeIndex === -1) {
    throw new Error(`Meme with ID '${memeId}' was not found. Check the ID using 'get_memes()'!`);
  }
  MEME_DATABASE[memeIndex] = {
    ...MEME_DATABASE[memeIndex],
    topText: newTopText !== undefined ? newTopText : MEME_DATABASE[memeIndex].topText,
    bottomText: newBottomText !== undefined ? newBottomText : MEME_DATABASE[memeIndex].bottomText
  };
  return MEME_DATABASE[memeIndex];
}

function db_delete_meme(memeId: string) {
  const memeIndex = MEME_DATABASE.findIndex(m => m.id === memeId);
  if (memeIndex === -1) {
    throw new Error(`Meme with ID '${memeId}' was not found. Unable to delete nothingness!`);
  }
  const deletedMeme = MEME_DATABASE[memeIndex];
  MEME_DATABASE.splice(memeIndex, 1);
  return { success: true, deletedId: memeId, meme: deletedMeme };
}

// --- Lazy Initializer for GoogleGenAI ---
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in the Secrets panel!");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// --- Tool Declarations for @google/genai ---
const createMemeDeclaration = {
  name: "create_meme",
  description: "Adds a new meme entry to the database. Use this when the user requests or confirms making a meme with specified text and template.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      template_id: {
        type: Type.STRING,
        description: "The template ID of the meme, e.g. 'drake', 'distracted', 'doge', 'think', 'two-buttons', 'epic-handshake', 'success-kid', 'disaster-girl', 'grumpy-cat'."
      },
      top_text: {
        type: Type.STRING,
        description: "The top caption text for the meme. Keep it witty and funny."
      },
      bottom_text: {
        type: Type.STRING,
        description: "The bottom caption text for the meme."
      }
    },
    required: ["template_id", "top_text", "bottom_text"]
  }
};

const getMemesDeclaration = {
  name: "get_memes",
  description: "Retrieves the current list of all generated memes. Use this to find available memes or verify database status.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const updateMemeDeclaration = {
  name: "update_meme",
  description: "Updates the text on an existing meme. Use this to modify top or bottom text of an existing meme.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      meme_id: {
        type: Type.STRING,
        description: "The exact ID of the meme to update, e.g. 'meme-1'."
      },
      new_top_text: {
        type: Type.STRING,
        description: "The new top caption text for the meme."
      },
      new_bottom_text: {
        type: Type.STRING,
        description: "The new bottom caption text for the meme."
      }
    },
    required: ["meme_id", "new_top_text", "new_bottom_text"]
  }
};

const deleteMemeDeclaration = {
  name: "delete_meme",
  description: "Removes a meme from the database. Use this when the user explicitly requests to delete or remove a meme.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      meme_id: {
        type: Type.STRING,
        description: "The exact ID of the meme to delete, e.g. 'meme-1'."
      }
    },
    required: ["meme_id"]
  }
};

// --- Main App Server ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // --- API Routes ---
  
  // 1. Get all available templates
  app.get("/api/templates", (req, res) => {
    res.json(MEME_TEMPLATES);
  });

  // 2. Get all created memes
  app.get("/api/memes", (req, res) => {
    res.json(MEME_DATABASE);
  });

  // 3. Create a meme manually
  app.post("/api/memes", (req, res) => {
    const { templateId, topText, bottomText } = req.body;
    try {
      const newMeme = db_create_meme(templateId, topText, bottomText);
      res.status(201).json(newMeme);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 4. Update a meme manually
  app.put("/api/memes/:id", (req, res) => {
    const { id } = req.params;
    const { topText, bottomText } = req.body;
    try {
      const updatedMeme = db_update_meme(id, topText, bottomText);
      res.json(updatedMeme);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // 5. Delete a meme manually
  app.delete("/api/memes/:id", (req, res) => {
    const { id } = req.params;
    try {
      const result = db_delete_meme(id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // 6. Intelligent MemeMaster AI agent Endpoint with functional tool execution
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Empty message is not cool, my friend!" });
      return;
    }

    try {
      const ai = getGeminiClient();
      
      // Structure chat context history for Gemini
      const contents: any[] = [];
      
      if (Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      
      // Add the new query
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Call Gemini 3.5-flash
      const firstResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{
            functionDeclarations: [
              createMemeDeclaration, 
              getMemesDeclaration, 
              updateMemeDeclaration, 
              deleteMemeDeclaration
            ]
          }]
        }
      });

      const functionCalls = firstResponse.functionCalls;
      const executedTools: any[] = [];

      if (functionCalls && functionCalls.length > 0) {
        // We have tool calls requested! Run them locally on our database.
        const responseParts: any[] = [];

        for (const fc of functionCalls) {
          const { name, args, id } = fc;
          let toolResult: any = null;

          try {
            if (name === "create_meme") {
              const resObj = db_create_meme(
                (args as any).template_id,
                (args as any).top_text,
                (args as any).bottom_text
              );
              toolResult = { success: true, meme: resObj };
            } else if (name === "get_memes") {
              const resObj = db_get_memes();
              toolResult = { success: true, count: resObj.length, memes: resObj };
            } else if (name === "update_meme") {
              const resObj = db_update_meme(
                (args as any).meme_id,
                (args as any).new_top_text,
                (args as any).new_bottom_text
              );
              toolResult = { success: true, meme: resObj };
            } else if (name === "delete_meme") {
              const resObj = db_delete_meme((args as any).meme_id);
              toolResult = resObj; // Already returns success & details
            } else {
              throw new Error(`Tool ${name} is premium or nonexistent!`);
            }
          } catch (err: any) {
            toolResult = { success: false, error: err.message };
          }

          executedTools.push({
            name,
            args,
            result: toolResult
          });

          responseParts.push({
            functionResponse: {
              name,
              response: { result: toolResult },
              id: id || `call-${Date.now()}`
            }
          });
        }

        // Send the execution output back to Gemini
        const nextContents = [
          ...contents,
          firstResponse.candidates?.[0]?.content, // Contains original tool requests
          {
            role: "tool",
            parts: responseParts
          }
        ];

        const secondResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: nextContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{
              functionDeclarations: [
                createMemeDeclaration, 
                getMemesDeclaration, 
                updateMemeDeclaration, 
                deleteMemeDeclaration
              ]
            }]
          }
        });

        res.json({
          text: secondResponse.text || "Your meme action was executed flawlessly! Keep styling those pixels.",
          memes: MEME_DATABASE,
          toolCalls: executedTools
        });

      } else {
        // No tool was called; just return the conversational agent output
        res.json({
          text: firstResponse.text || "I'm processing the meme vibes. What's on your mind?",
          memes: MEME_DATABASE,
          toolCalls: []
        });
      }

    } catch (error: any) {
      console.error("Gemini server error: ", error);
      res.status(500).json({ 
        error: error.message || "An error occurred with MemeMaster AI's neural cells.",
        memes: MEME_DATABASE 
      });
    }
  });

  // --- Vite & Production static files handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MemeMaster server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

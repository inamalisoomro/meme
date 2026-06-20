import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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
Your goal is to help users create, track, edit, and delete meme records in the database.`;

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

  // 6. Intelligent MemeMaster AI agent Endpoint with simulated offline tool execution
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Empty message is not cool, my friend!" });
      return;
    }

    try {
      const msgLower = message.toLowerCase().trim();
      const executedTools: any[] = [];
      let responseText = "";

      // 1. Check for Suggest / Idea prompt
      if (
        msgLower.includes("suggest") || 
        msgLower.includes("caption") || 
        msgLower.includes("idea") ||
        msgLower.includes("recommend")
      ) {
        responseText = `🧠 **GIGA-BRAIN THINKING ACTIVATED!**\n\nHere are 3 peak-humor, offline-compiled caption ideas for your next meme adventure:\n\n` +
          `1. **Drake Choice (drake)**\n` +
          `   - **Top:** "Using manual HTML/CSS styling"\n` +
          `   - **Bottom:** "Installing zero-dependency Fake Meme API in 2 seconds"\n\n` +
          `2. **Doge Much Wow (doge)**\n` +
          `   - **Top:** "Such local, very fast"\n` +
          `   - **Bottom:** "Many offline, much developer, wow"\n\n` +
          `3. **Roll Safe Think (think)**\n` +
          `   - **Top:** "Can't have API key authentication errors"\n` +
          `   - **Bottom:** "If you are running on a direct simulated database"\n\n` +
          `Just type e.g., **create doge meme about typescript** or command me with **"Much offline" "Many stonks"**!`;
      } 
      // 2. Check for Get / List memes
      else if (
        msgLower.includes("get_memes") || 
        msgLower.includes("get memes") || 
        msgLower.includes("list") || 
        msgLower.includes("show") || 
        msgLower.includes("display") ||
        msgLower.includes("index")
      ) {
        const memesList = db_get_memes();
        executedTools.push({
          name: "get_memes",
          args: {},
          result: { success: true, count: memesList.length, memes: memesList }
        });
        responseText = `📈 **STONKS!** I have loaded the central mainframe database. Currently, we have registered **${memesList.length}** hilarious creations live on the global grid! Let the jokes roll.`;
      }
      // 3. Check for Delete Meme
      else if (
        msgLower.includes("delete") || 
        msgLower.includes("purge") || 
        msgLower.includes("remove") || 
        msgLower.includes("trash") ||
        msgLower.includes("vaporize")
      ) {
        const matchId = msgLower.match(/meme-\S+/);
        if (matchId) {
          const id = matchId[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ""); // strip punctuation
          try {
            const deleteResult = db_delete_meme(id);
            executedTools.push({
              name: "delete_meme",
              args: { meme_id: id },
              result: deleteResult
            });
            responseText = `💥 **POW!** Meme with ID **${id}** was officially vaporized. Deleted caption: *"${deleteResult.meme.topText} // ${deleteResult.meme.bottomText}"*. That is clean memory management, absolute win!`;
          } catch (err: any) {
            executedTools.push({
              name: "delete_meme",
              args: { meme_id: id },
              result: { success: false, error: err.message }
            });
            responseText = `⚠️ **MIND BLOWN!** Attempted to delete ID **${id}**, but the database says: *"${err.message}"*. Try listing them first using **get_memes**!`;
          }
        } else {
          responseText = `🤔 **Wait, target ID missing!** You requested to delete, but didn't specify which ID (e.g., \`meme-1\`). Say something like: **delete meme-1**!`;
        }
      }
      // 4. Check for Update Meme
      else if (
        msgLower.includes("update") || 
        msgLower.includes("edit") || 
        msgLower.includes("change") || 
        msgLower.includes("modify")
      ) {
        const matchId = msgLower.match(/meme-\S+/);
        if (matchId) {
          const id = matchId[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
          // Find double quotes content
          const quotes: string[] = [];
          const regex = /"([^"]+)"|'([^']+)'/g;
          let match;
          while ((match = regex.exec(message)) !== null) {
            quotes.push(match[1] || match[2]);
          }

          if (quotes.length > 0) {
            const topText = quotes[0] || "";
            const bottomText = quotes[1] || "";
            try {
              const updatedMeme = db_update_meme(id, topText, bottomText);
              executedTools.push({
                name: "update_meme",
                args: { meme_id: id, new_top_text: topText, new_bottom_text: bottomText },
                result: { success: true, meme: updatedMeme }
              });
              responseText = `✏️ **GIGA-EDIT COMPLETED!** Meme **${id}** is rewritten. New witty vibe: *"${topText} // ${bottomText}"*. Stonks are soaring!`;
            } catch (err: any) {
              executedTools.push({
                name: "update_meme",
                args: { meme_id: id, new_top_text: topText, new_bottom_text: bottomText },
                result: { success: false, error: err.message }
              });
              responseText = `⚠️ **ERROR VIBES!** Could not update **${id}**. Reason: *"${err.message}"*. Make sure the ID exists in our records!`;
            }
          } else {
            responseText = `💡 **Formatting Tip!** I see you want to edit **${id}**. Please enclose your new top and bottom captions in double quotes: **update ${id} "new top" "new bottom"**!`;
          }
        } else {
          responseText = `⚠️ **Wait a minute!** Which meme are we updating? Please supply a valid ID like \`meme-1\` and quotes: **update meme-1 "new text" "wow"**!`;
        }
      }
      // 5. Check for Create Meme
      else if (
        msgLower.includes("create") || 
        msgLower.includes("make") || 
        msgLower.includes("generate") || 
        msgLower.includes("add") || 
        msgLower.includes("new")
      ) {
        // Find which template to use
        let templateId = "doge"; // Default fallback
        for (const t of MEME_TEMPLATES) {
          const templateKeyword = t.id.toLowerCase();
          const nameKeywords = t.name.toLowerCase().split(" ");
          if (msgLower.includes(templateKeyword) || nameKeywords.some(kw => kw.length > 3 && msgLower.includes(kw))) {
            templateId = t.id;
            break;
          }
        }

        // Find double quotes content
        const quotes: string[] = [];
        const regex = /"([^"]+)"|'([^']+)'/g;
        let match;
        while ((match = regex.exec(message)) !== null) {
          quotes.push(match[1] || match[2]);
        }

        let topText = "";
        let bottomText = "";

        if (quotes.length >= 2) {
          topText = quotes[0];
          bottomText = quotes[1];
        } else if (quotes.length === 1) {
          topText = quotes[0];
          bottomText = "Many wow!";
        } else {
          // No quotes found - see if there's "about X"
          const aboutIdx = msgLower.indexOf("about ");
          if (aboutIdx !== -1) {
            const topic = message.substring(aboutIdx + 6).trim();
            topText = `Much ${topic}`;
            bottomText = `Very wow, many developer!`;
          } else {
            // Use defaults of the template
            const template = MEME_TEMPLATES.find(t => t.id === templateId);
            topText = template?.presetTop || "No top text";
            bottomText = template?.presetBottom || "No bottom text";
          }
        }

        try {
          const newMeme = db_create_meme(templateId, topText, bottomText);
          executedTools.push({
            name: "create_meme",
            args: { template_id: templateId, top_text: topText, bottom_text: bottomText },
            result: { success: true, meme: newMeme }
          });
          responseText = `🚀 **BOOM! BRAND NEW MEME DETONATED!** Styled using the legendary **"${templateId}"** template. Injected with top caption *"${topText}"* and bottom caption *"${bottomText}"*. Registered globally with ID: **${newMeme.id}**!`;
        } catch (err: any) {
          responseText = `⚠️ **Meme Creation Failed!** Reason: *"${err.message}"*. Try another template, Chad!`;
        }
      }
      // 6. Conversational Fallback
      else {
        responseText = `✨ **Greetings, fellow meme lord!** I am simulated MemeMaster AI, running on a 100% offline local fake meme maker engine!\n\n` +
          `No keys or internet required. I handle all manual CRUD data commands instantly. Just ask me to:\n` +
          `- 📝 **"create a doge meme about React"**\n` +
          `- 💡 **"suggest 3 captions first"**\n` +
          `- 📈 **"get_memes"** (lists active memes)\n` +
          `- ✏️ **"update meme-1 'new top' 'new bottom'"**\n` +
          `- 💥 **"delete meme-1"**\n\n` +
          `Let's boost some virtual engagement metrics! What are we creating today?`;
      }

      res.json({
        text: responseText,
        memes: MEME_DATABASE,
        toolCalls: executedTools
      });

    } catch (error: any) {
      console.error("Local NLP parsing error: ", error);
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

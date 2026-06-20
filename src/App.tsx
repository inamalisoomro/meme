import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, Sparkles, AlertCircle, RefreshCw, Cpu, 
  MessageSquare, LayoutGrid, Check, Copy, HelpCircle 
} from "lucide-react";
import { Meme, MemeTemplate, ChatMessage } from "./types";
import MemeCard from "./components/MemeCard";
import MemeCreator from "./components/MemeCreator";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"memes" | "creator">("memes");

  const INITIAL_AI_CHAT: ChatMessage = {
    id: "greet-1",
    role: "model",
    text: `Yo! Welcome to the premium meme command center! 🚀 I'm MemeMaster AI, your custom neural broker for high-impact humor.

I have direct, synchronous access to your database via my integrated API tools. Here is what you can ask me:
1. 💡 **Generate funny captions** (I'll suggest three ideas for a template and wait for your go-ahead!)
2. ⚡ **Make memes instantly** (e.g. *"Create a Doge meme about building with TypeScript!"*)
3. 🛠️ **Update or fix current memes** (e.g. *"Update meme meme-1 to say 'No bugs' at the bottom"*)
4. 🗑️ **Wipe memes from memory** (e.g. *"Delete meme-3"* — very chad of you)

Let's stack those stonks together! What type of humor are we compiling today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  useEffect(() => {
    // Set initial chat history
    setChatHistory([INITIAL_AI_CHAT]);
    
    // Load database items on load
    const loadDbData = async () => {
      try {
        const templatesRes = await fetch("/api/templates");
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        } else {
          setErrorNotice("Failed to fetch baseline templates. Is the server online?");
        }
        
        const memesRes = await fetch("/api/memes");
        if (memesRes.ok) {
          const memesData = await memesRes.json();
          setMemes(memesData);
        } else {
          setErrorNotice("Failed to query initial meme list from database.");
        }
      } catch (err: any) {
        console.error("Critical fetch error during startup: ", err);
        setErrorNotice("Initialization failed. Please ensure GEMINI_API_KEY is configured in the Secrets panel if you are calling the AI!");
      } finally {
        setLoading(false);
      }
    };

    loadDbData();
  }, []);

  // --- Direct CRUD handlers for client ---
  // A. Create meme manually
  const handleManualCreateMeme = async (templateId: string, topText: string, bottomText: string) => {
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, topText, bottomText })
      });
      if (res.ok) {
        const newMeme = await res.json();
        setMemes(prev => [newMeme, ...prev]);
        setActiveTab("memes");
      } else {
        const errData = await res.json();
        alert(`Failed to create manual meme: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // B. Update meme manually
  const handleManualUpdateMeme = async (id: string, topText: string, bottomText: string) => {
    try {
      const res = await fetch(`/api/memes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topText, bottomText })
      });
      if (res.ok) {
        const updatedMeme = await res.json();
        setMemes(prev => prev.map(m => m.id === id ? updatedMeme : m));
      } else {
        const errData = await res.json();
        alert(`Failed to modify meme: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // C. Delete meme manually
  const handleManualDeleteMeme = async (id: string) => {
    try {
      const res = await fetch(`/api/memes/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMemes(prev => prev.filter(m => m.id !== id));
      } else {
        const errData = await res.json();
        alert(`Failed to purge meme: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- AI Agent Chat Communication ---
  const handleSendChatMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    
    // 1. Instantly register the user's message locally
    const userMessage: ChatMessage = {
      id: `chat-usr-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatHistory(prev => [...prev, userMessage]);
    setSending(true);
    setErrorNotice(null);

    try {
      // Create lightweight history compatible with server payload
      // Skip the warm greeting so context matches recent commands
      const payloadHistory = chatHistory
        .filter(msg => msg.id !== "greet-1")
        .map(msg => ({
          role: msg.role,
          text: msg.text
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: payloadHistory
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        // Check if it's the missing key error specifically
        if (errData.error?.includes("GEMINI_API_KEY")) {
          throw new Error("GEMINI_API_KEY is not defined. Please add it via Settings > Secrets inside the AI Studio console UI!");
        } else {
          throw new Error(errData.error || "An abnormal response arrived from the AI broker.");
        }
      }

      const data = await response.json();

      // 2. Map and push the model's reply including its precise physical tool metrics!
      const modelMessage: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolCalls: data.toolCalls // Array of registered tool outputs
      };

      setChatHistory(prev => [...prev, modelMessage]);
      
      // Update our meme state instantly using the synchronized database from server
      if (Array.isArray(data.memes)) {
        setMemes(data.memes);
      }

    } catch (error: any) {
      console.error("Agent loop failure: ", error);
      setErrorNotice(error.message || "An unexpected disconnect occurred between the client and the neural node.");
      
      const errorMsg: ChatMessage = {
        id: `chat-err-${Date.now()}`,
        role: "model",
        text: `⚠️ **Meme Engine Operational Exception:** ${error.message || "Unable to reach the backend agent. Please check your hosting environment and secrets!"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = () => {
    setChatHistory([INITIAL_AI_CHAT]);
    setErrorNotice(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-800 font-sans selection:bg-neutral-850 selection:text-white flex flex-col min-w-0 transition-colors duration-300">
      
      {/* Navigation Headboard */}
      <header id="app-header" className="border-b border-neutral-200/80 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center bg-white text-neutral-800 gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neutral-900 text-white rounded-xl shadow-md">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-neutral-950">
              MemeMaster
            </h1>
            <p className="text-xs text-neutral-500 font-medium tracking-wide mt-1.5">Premium AI Broker Database Panel</p>
          </div>
        </div>

        <div className="text-left sm:text-right font-sans text-neutral-850 flex items-start sm:items-end gap-2 flex-col">
          <p className="text-xs font-semibold tracking-wide text-neutral-900 bg-neutral-100 py-1.5 px-3.5 rounded-full">AI Agent Workspace</p>
          <p className="text-[11px] tracking-wider font-semibold text-neutral-400 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            Status: Operational
          </p>
        </div>
      </header>

      {/* Global Banner Error Handler */}
      <AnimatePresence>
        {errorNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-rose-50 border-b border-rose-200"
          >
            <div className="p-5 max-w-[1400px] mx-auto w-full flex items-start gap-3.5 text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-sm leading-relaxed">
                <p className="font-bold text-rose-950 tracking-tight">System Warning Notice</p>
                <p className="text-rose-700/90 text-xs mt-1 font-medium">
                  {errorNotice} Ensure your **Secrets panel** has the **GEMINI_API_KEY** correctly configured if you want the intelligent agent to drive database modifications!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Screen Layout split into Agent Actions vs Data Outputs */}
      <div className="flex-1 w-full flex flex-col min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
          
          {/* LEFT SECTION (Col Span 7): Visual Meme Repository & Manual Workbench */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Repo Header & Selection tab controllers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
              <div className="flex items-center gap-2 self-start sm:self-center ml-1">
                <LayoutGrid className="w-4 h-4 text-neutral-600 stroke-[2.5]" />
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                  01_Workspace
                </span>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("memes")}
                  className={`flex-1 sm:flex-initial px-4 py-2 border rounded-lg text-xs font-bold transition-all duration-250 cursor-pointer ${
                    activeTab === "memes"
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                      : "bg-transparent border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  Indexed Memes ({memes.length})
                </button>
                <button
                  onClick={() => setActiveTab("creator")}
                  className={`flex-1 sm:flex-initial px-4 py-2 border rounded-lg text-xs font-bold transition-all duration-250 cursor-pointer ${
                    activeTab === "creator"
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                      : "bg-transparent border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  Workbench Creator
                </button>
              </div>
            </div>

            {/* Render selected active panel Tab */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-500" />
                  <span className="text-xs font-medium tracking-wide">Synchronizing Fake Meme DB...</span>
                </div>
              ) : activeTab === "creator" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <MemeCreator 
                    templates={templates} 
                    onCreateMeme={handleManualCreateMeme} 
                  />
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {memes.length === 0 ? (
                    <div className="bg-white border border-dashed border-neutral-300 p-16 rounded-2xl text-center space-y-4">
                      <p className="text-neutral-500 font-medium text-sm">The meme database is currently empty.</p>
                      <button
                        onClick={() => setActiveTab("creator")}
                        className="bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs py-2 px-5 rounded-lg transition-all cursor-pointer"
                      >
                        Launch Workbench
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AnimatePresence mode="popLayout">
                        {memes.map((meme) => {
                          const template = templates.find(t => t.id === meme.templateId);
                          return (
                            <MemeCard
                              key={meme.id}
                              meme={meme}
                              template={template}
                              onDelete={handleManualDeleteMeme}
                              onUpdate={handleManualUpdateMeme}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SECTION (Col Span 5): Neural MemeMaster AI Interface */}
          <div className="lg:col-span-5">
            <ChatPanel
              chatHistory={chatHistory}
              sending={sending}
              onSendMessage={handleSendChatMessage}
              onClearHistory={handleClearHistory}
            />
          </div>

        </div>
      </div>

      {/* Footer / Terminal */}
      <footer className="h-16 bg-white text-neutral-600 flex items-center px-6 sm:px-8 font-sans text-xs gap-4 sm:gap-8 overflow-x-auto relative z-20 border-t border-neutral-200 shadow-inner">
        <div className="flex gap-2 items-center shrink-0">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-neutral-800">Agent Status: Active</span>
        </div>
        <div className="opacity-70 shrink-0 text-[11px] font-medium border-l border-neutral-200 pl-4">Last Action: Registered {memes.length} items</div>
        <div className="ml-auto opacity-60 text-[11px] italic shrink-0 hidden sm:block">"Don't let your memes be dreams." — MemeMaster AI</div>
      </footer>

    </div>
  );
}

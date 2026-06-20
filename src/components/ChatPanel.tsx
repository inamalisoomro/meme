import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Terminal, Cpu, Sparkles, RefreshCw, MessageSquare, AlertTriangle } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  sending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
}

export default function ChatPanel({ chatHistory, sending, onSendMessage, onClearHistory }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, sending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const QUICK_PROMPTS = [
    { label: "Suggest witty Drake ideas", text: "I want to create a Drake choosing meme. Please suggest 3 funny captions first." },
    { label: "Doge Tech Hype Meme", text: "Create a Doge meme about React 19 Concurrent rendering!" },
    { label: "Get current memes list", text: "get_memes from the database" },
    { label: "Roll Safe paradoxical tip", text: "Make a Roll Safe / Think meme about coding" }
  ];

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-sm relative text-neutral-800">
      
      {/* Panel Top Header */}
      <div className="p-4 bg-white border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border border-neutral-200 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-950 flex items-center gap-1.5 uppercase tracking-wide">
              MemeMaster AI
              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded border border-neutral-200 font-sans font-bold uppercase">
                v1.2-Flash
              </span>
            </h2>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Expert Meme Broker & Tool Runner</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs text-neutral-400 hover:text-rose-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Clear Logs
        </button>
      </div>

      {/* Messages Scroll Box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
        
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl text-neutral-600 shadow-sm">
              <Terminal className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-neutral-900 font-bold uppercase text-sm">Interactive Agent Console</p>
              <p className="text-xs text-neutral-400 font-medium max-w-xs leading-relaxed">
                Instruct the AI helper to auto-create, search, modify, or trash memes using your backend database tools!
              </p>
            </div>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {/* Timestamp */}
            <span className="text-[9px] text-neutral-400 mb-1 font-sans uppercase font-bold px-1.5">
              {msg.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-neutral-900 text-white rounded-2xl rounded-tr-none border border-transparent"
                  : "bg-white text-neutral-850 rounded-2xl rounded-tl-none border border-neutral-200/60"
              }`}
            >
              <div className="font-semibold">{msg.text}</div>
              
              {/* Tool Execution Diagnostics inside the Chat Log */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3.5 pt-3.5 border-t border-neutral-100 space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                    <Terminal className="w-3.5 h-3.5 inline text-neutral-400" /> Transpiled API Tool Logs
                  </div>
                  {msg.toolCalls.map((tc, tcIdx) => (
                    <div 
                      key={tcIdx}
                      className="text-[11px] font-mono bg-[#F8F9FA] p-3 rounded-xl border border-neutral-200/65 space-y-1 text-neutral-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-900 font-bold">
                          λ {tc.name}()
                        </span>
                        <span className="bg-neutral-900 text-white font-extrabold border border-neutral-950 rounded px-1.5 text-[8px] uppercase tracking-wider">
                          SUCCESS
                        </span>
                      </div>
                      <div className="text-neutral-500 text-[10px] overflow-x-auto whitespace-pre-wrap font-semibold">
                        <span className="text-neutral-900 font-bold uppercase">Args:</span> {JSON.stringify(tc.args)}
                      </div>
                      
                      {/* Detailed Response Outputs */}
                      {tc.result && (
                        <div className="text-[10px] text-neutral-500 mt-1 border-t border-dashed border-neutral-200 pt-1 font-mono">
                          <span className="text-neutral-400 font-semibold uppercase">Output_</span>{" "}
                          {tc.result?.error ? (
                            <span className="text-rose-500 font-bold">{tc.result.error}</span>
                          ) : tc.name === "create_meme" || tc.name === "update_meme" ? (
                            <span className="font-semibold text-neutral-700">ID: {tc.result?.meme?.id} ("{tc.result?.meme?.topText} // {tc.result?.meme?.bottomText}")</span>
                          ) : tc.name === "delete_meme" ? (
                            <span className="font-semibold text-neutral-700">Purged ID: {tc.result?.deletedId}</span>
                          ) : (
                            <span className="font-semibold text-neutral-700">Indexed {tc.result?.count || 0} memes list</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex flex-col items-start animate-pulse">
            <span className="text-[9px] text-neutral-400 mb-1 font-sans uppercase font-bold px-1.5">SYSTEM PING</span>
            <div className="bg-white border border-neutral-200 text-neutral-600 text-xs rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2.5 font-bold shadow-sm">
              <span className="w-3.5 h-3.5 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin inline-block" />
              <span>MemeMaster AI is executing neural logic and updating database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Quick Chips */}
      {chatHistory.length < 8 && (
        <div className="p-3 bg-white border-t border-neutral-100">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-2 flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" /> Quick Seed Prompts
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pr-1">
            {QUICK_PROMPTS.map((qp, qId) => (
              <button
                key={qId}
                disabled={sending}
                onClick={() => onSendMessage(qp.text)}
                className="text-[11.5px] bg-neutral-50 hover:bg-neutral-900 hover:text-white border border-neutral-200/80 rounded-lg text-neutral-600 font-semibold px-3 py-1.5 whitespace-nowrap transition-all cursor-pointer select-none"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Form Footer */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-neutral-100 flex gap-2.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
          placeholder="Ask MemeMaster to 'create a doge meme'... "
          className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all font-sans shadow-inner"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl p-3.5 flex items-center justify-center cursor-pointer disabled:opacity-30 transition-all active:scale-[0.98] shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

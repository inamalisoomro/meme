import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Check, Copy, Calendar, Tag, RefreshCw } from "lucide-react";
import { Meme, MemeTemplate } from "../types";

interface MemeCardProps {
  key?: any;
  meme: Meme;
  template: MemeTemplate | undefined;
  onDelete: (id: string) => void | Promise<void>;
  onUpdate: (id: string, topText: string, bottomText: string) => void | Promise<void>;
}

export default function MemeCard({ meme, template, onDelete, onUpdate }: MemeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [topText, setTopText] = useState(meme.topText);
  const [bottomText, setBottomText] = useState(meme.bottomText);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    const shareText = `"${meme.topText} // ${meme.bottomText}" — Generated via MemeMaster AI! Check it out!`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(meme.id, topText, bottomText);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(meme.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }) + " | " + new Date(meme.createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      id={`meme-card-${meme.id}`}
      className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative"
    >
      {/* Meme Visual Frame */}
      <div className="relative aspect-square w-full bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center select-none border border-neutral-100">
        <img
          src={template?.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"}
          alt={template?.name || "Meme template"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* TOP TEXT OVERLAY */}
        <div className="absolute top-4 left-4 right-4 text-center pointer-events-none px-2">
          <p 
            style={{ wordBreak: "break-word" }}
            className="text-white text-lg sm:text-2xl font-black uppercase text-center tracking-wide leading-tight [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_4px_8px_rgba(0,0,0,0.8)] filter drop-shadow-md font-display"
          >
            {meme.topText}
          </p>
        </div>

        {/* BOTTOM TEXT OVERLAY */}
        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none px-2">
          <p 
            style={{ wordBreak: "break-word" }}
            className="text-white text-lg sm:text-2xl font-black uppercase text-center tracking-wide leading-tight [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_4px_8px_rgba(0,0,0,0.8)] filter drop-shadow-md font-display"
          >
            {meme.bottomText}
          </p>
        </div>

        {/* Copy Badge Indicator */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bg-neutral-900 text-white border border-neutral-800 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" /> Copied Text Reference
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meme Data & Actions */}
      <div className="pt-4 flex-1 flex flex-col justify-between bg-white text-neutral-800">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-neutral-200/50">
              {template?.name || meme.templateId}
            </span>
          </div>

          {/* Edit State Inputs */}
          {isEditing ? (
            <div className="space-y-3.5 mt-3 p-3.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl shadow-inner">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Top Text</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Bottom Text</label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all font-sans"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setTopText(meme.topText);
                    setBottomText(meme.bottomText);
                  }}
                  className="text-xs bg-transparent text-neutral-600 border border-neutral-200 rounded-lg px-3.5 py-1.5 font-bold uppercase hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-3.5 py-1.5 font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 font-sans flex flex-wrap items-center gap-1.5 mt-1.5">
              <Calendar className="w-3.5 h-3.5 inline text-neutral-400" />
              <span>{formattedDate}</span>
              <span className="text-neutral-300">•</span>
              <span className="bg-neutral-50 border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded font-bold text-[9px]">ID: {meme.id}</span>
            </div>
          )}
        </div>

        {/* Action Tray */}
        {!isEditing && (
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3.5 mt-auto">
            <button
              onClick={handleCopy}
              className="text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              title="Copy caption"
            >
              <Copy className="w-3.5 h-3.5 inline" />
              <span>Copy</span>
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="text-neutral-500 hover:text-neutral-950 font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors"
                title="Edit caption texts"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(meme.id)}
                className="text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors"
                title="Delete meme"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

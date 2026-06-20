import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Image as ImageIcon, Send } from "lucide-react";
import { MemeTemplate } from "../types";

interface MemeCreatorProps {
  templates: MemeTemplate[];
  onCreateMeme: (templateId: string, topText: string, bottomText: string) => Promise<void>;
}

export default function MemeCreator({ templates, onCreateMeme }: MemeCreatorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Set initial template once loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
      setTopText(templates[0].presetTop || "");
      setBottomText(templates[0].presetBottom || "");
    }
  }, [templates]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find(t => t.id === id);
    if (template) {
      setTopText(template.presetTop || "");
      setBottomText(template.presetBottom || "");
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setSubmitting(true);
    try {
      await onCreateMeme(selectedTemplateId, topText, bottomText);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden text-neutral-800">
      <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-neutral-50 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl text-white">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-950">Manual Meme Workbench</h2>
          <p className="text-xs text-neutral-400 font-medium tracking-wide mt-1">Assemble pixels and punch lines manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Left: Interactive Preview */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live Preview</h3>
          <div className="relative aspect-square w-full bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center select-none border border-neutral-100 shadow-inner">
            {currentTemplate ? (
              <>
                <img
                  src={currentTemplate.imageUrl}
                  alt={currentTemplate.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Top */}
                <div className="absolute top-5 left-4 right-4 text-center px-1 pointer-events-none">
                  <p className="text-white text-lg sm:text-2xl font-black uppercase tracking-wide leading-tight [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_4px_8px_rgba(0,0,0,0.8)] filter drop-shadow-md font-display">
                    {topText || "TOP CAPTION HERE"}
                  </p>
                </div>

                {/* Overlay Bottom */}
                <div className="absolute bottom-5 left-4 right-4 text-center px-1 pointer-events-none">
                  <p className="text-white text-lg sm:text-2xl font-black uppercase tracking-wide leading-tight [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000,_0_4px_8px_rgba(0,0,0,0.8)] filter drop-shadow-md font-display">
                    {bottomText || "BOTTOM CAPTION HERE"}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <ImageIcon className="w-10 h-10 stroke-[2]" />
                <span className="text-xs font-bold uppercase">No template selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Template Picker & Caption Inputs */}
        <div className="flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Template Grid Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">
                Select Base Template
              </label>
              <div className="grid grid-cols-3 gap-2.5 max-h-[170px] overflow-y-auto pr-1 border border-neutral-200/80 p-3 bg-neutral-50 rounded-xl mb-4">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tpl.id)}
                    className={`relative aspect-square border overflow-hidden rounded-lg group cursor-pointer transition-all ${
                      selectedTemplateId === tpl.id
                        ? "border-neutral-900 ring-2 ring-neutral-950 scale-[0.96] shadow-sm"
                        : "border-neutral-200 hover:scale-[1.02]"
                    }`}
                    title={tpl.name}
                  >
                    <img
                      src={tpl.imageUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-neutral-950/90 text-white text-[8px] sm:text-[9px] font-sans px-1 py-0.5 truncate text-center uppercase font-bold border-t border-neutral-800">
                      {tpl.name}
                    </div>
                    {selectedTemplateId === tpl.id && (
                      <div className="absolute top-1 right-1 bg-neutral-900 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase text-center">
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Dedicated Template Miniature Preview Card */}
              {currentTemplate && (
                <div className="border border-neutral-200 p-3 bg-neutral-50 rounded-xl flex gap-3 mb-4 animate-fadeIn">
                  <div className="w-[56px] h-[56px] bg-neutral-900 border border-neutral-200 rounded-lg shrink-0 overflow-hidden relative">
                    <img
                      src={currentTemplate.imageUrl}
                      alt={currentTemplate.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                        Selected Base Template
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-800 truncate mt-1">
                        {currentTemplate.name}
                      </h4>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTopText(currentTemplate.presetTop || "");
                          setBottomText(currentTemplate.presetBottom || "");
                        }}
                        className="text-[9px] font-sans bg-neutral-900 text-white hover:bg-neutral-800 transition-colors px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                      >
                        Reset to Presets
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label htmlFor="workbench-top-text" className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Top Text Caption
                </label>
                <input
                  id="workbench-top-text"
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Much React 19..."
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all font-sans shadow-inner"
                />
              </div>

              <div>
                <label htmlFor="workbench-bottom-text" className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Bottom Text Caption
                </label>
                <input
                  id="workbench-bottom-text"
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Very concurrent, many wow"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-neutral-850 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all font-sans shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={submitting || !selectedTemplateId}
            className={`w-full py-3.5 px-4 rounded-xl border border-transparent font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4 active:scale-[0.99] ${
              success
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-neutral-900 hover:bg-neutral-800 text-white"
            }`}
          >
            {submitting ? (
              <>Running compilation engine...</>
            ) : success ? (
              <>Meme successfully indexed! ✓</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Meme Record
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}

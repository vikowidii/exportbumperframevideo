import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowRight, Check } from 'lucide-react';
import { BumperConfig, AIConcept, BumperThemeId, AudioThemeId } from '../types/bumper';

interface AIBumperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConcept: (concept: AIConcept) => void;
  lang: 'id' | 'en';
}

const QUICK_TOPICS = [
  { label: '🎮 Gaming & Valorant / MLBB', topic: 'Gaming Streamer Esports', type: 'Gaming' },
  { label: '🍲 Kuliner & Street Food', topic: 'Jelajah Kuliner Nusantara', type: 'Vlog Kuliner' },
  { label: '💻 Tech, AI & Review Gadget', topic: 'Teknologi & Review Smartphone', type: 'Tech' },
  { label: '🎙️ Podcast Keuangan & Bisnis', topic: 'Bicara Cuan & Investasi', type: 'Podcast' },
  { label: '🏋️ Fitness, Workout & Olahraga', topic: 'Power Gym & Healthy Life', type: 'Fitness' },
];

export const AIBumperModal: React.FC<AIBumperModalProps> = ({
  isOpen,
  onClose,
  onApplyConcept,
  lang,
}) => {
  const [topic, setTopic] = useState<string>('');
  const [channelType, setChannelType] = useState<string>('Content Creator');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [concepts, setConcepts] = useState<AIConcept[]>([]);
  const [appliedId, setAppliedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (targetTopic?: string, targetType?: string) => {
    const finalTopic = targetTopic || topic;
    const finalType = targetType || channelType;

    if (!finalTopic.trim()) {
      setError(lang === 'id' ? 'Silakan masukkan nama channel atau topik.' : 'Please enter a topic or channel name.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAppliedId(null);

    try {
      const response = await fetch('/api/generate-bumper-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          channelType: finalType,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server ide bumper.');
      }

      const data = await response.json();
      if (data.concepts && Array.isArray(data.concepts)) {
        setConcepts(data.concepts);
      } else {
        throw new Error('Format respon tidak sesuai.');
      }
    } catch (err: any) {
      console.error('Error generating AI concepts:', err);
      setError(err?.message || 'Gagal membuat ide bumper.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuick = (item: typeof QUICK_TOPICS[0]) => {
    setTopic(item.topic);
    setChannelType(item.type);
    handleGenerate(item.topic, item.type);
  };

  const handleApply = (concept: AIConcept, index: number) => {
    setAppliedId(index);
    onApplyConcept(concept);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-white">
                {lang === 'id' ? 'AI Asisten Konsep & Slogan Bumper' : 'AI Bumper Concept Assistant'}
              </h3>
              <span className="text-xs text-neutral-400">
                {lang === 'id'
                  ? 'Ditenagai Gemini 3.8 Flash untuk merancang gaya bumper & slogan unik'
                  : 'Powered by Gemini 3.8 Flash to craft custom slogans & aesthetics'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                {lang === 'id' ? 'Topik / Nama Brand Anda' : 'Topic / Brand Name'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="misal: Masak Enak Jakarta, Apex Gaming, Podfinansial"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div className="w-full sm:w-44 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                {lang === 'id' ? 'Bahasa Slogan' : 'Slogan Language'}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Quick topic inspiration pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-500 mr-1">Inspirasi:</span>
            {QUICK_TOPICS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuick(item)}
                className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-neutral-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl transition-all disabled:opacity-60 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>{lang === 'id' ? 'Sedang Merancang Konsep...' : 'Generating Concepts...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-neutral-950" />
                <span>{lang === 'id' ? 'Buat Konsep Bumper AI' : 'Generate AI Concepts'}</span>
              </>
            )}
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Concept Cards List */}
        {concepts.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-semibold text-neutral-300">
              {lang === 'id' ? 'Pilih Konsep untuk Diterapkan:' : 'Select Concept to Apply:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concepts.map((concept, index) => {
                const isApplied = appliedId === index;
                return (
                  <div
                    key={index}
                    className="p-3.5 bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 rounded-xl flex flex-col justify-between gap-3 transition-all"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">
                          {concept.themeId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black/30"
                            style={{ backgroundColor: concept.primaryColor }}
                            title="Primary color"
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/30"
                            style={{ backgroundColor: concept.secondaryColor }}
                            title="Secondary color"
                          />
                        </div>
                      </div>

                      <span className="text-sm font-bold text-white tracking-wide">
                        {concept.title}
                      </span>
                      <span className="text-xs font-semibold text-neutral-300">
                        "{concept.slogan}"
                      </span>

                      <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                        {concept.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApply(concept, index)}
                      className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                        isApplied
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-neutral-800 hover:bg-cyan-400 hover:text-neutral-950 text-neutral-200'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Diterapkan!</span>
                        </>
                      ) : (
                        <>
                          <span>Terapkan ke Bumper</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

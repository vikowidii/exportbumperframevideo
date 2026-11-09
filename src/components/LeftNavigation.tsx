import React, { useState } from 'react';
import { BumperConfig, StudioMode, LogoCountMode } from '../types/bumper';
import {
  Film,
  Type,
  Layers,
  PlusCircle,
  Palette,
  FileText,
  Sparkles,
  Volume2,
  Box,
  CheckCircle2,
  Plus,
  ChevronDown,
} from 'lucide-react';

export type LeftNavSection =
  | 'logo'
  | 'background'
  | 'text'
  | 'effects'
  | 'audio'
  | 'frame_style';

interface LeftNavigationProps {
  config: BumperConfig;
  onUpdateConfig: (partial: Partial<BumperConfig>) => void;
  activeSection: LeftNavSection;
  onSelectSection: (mode: StudioMode, section: LeftNavSection) => void;
  lang: 'id' | 'en';
}

export const LeftNavigation: React.FC<LeftNavigationProps> = ({
  config,
  onUpdateConfig,
  activeSection,
  onSelectSection,
  lang,
}) => {
  const currentMode = config.studioMode;

  // Track which card dropdowns are open (default the active one is open)
  const [openCards, setOpenCards] = useState<Record<StudioMode, boolean>>({
    bumper_logo: config.studioMode === 'bumper_logo',
    video_title: config.studioMode === 'video_title',
    frame_video: config.studioMode === 'frame_video',
  });

  // When clicking a card header: toggle its dropdown and activate the mode
  const handleCardHeaderClick = (mode: StudioMode, defaultSection: LeftNavSection) => {
    const targetSection = mode === 'frame_video' ? 'frame_style' : defaultSection;
    onUpdateConfig({ studioMode: mode });
    onSelectSection(mode, targetSection);

    setOpenCards((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const handleLogoModeChange = (mode: LogoCountMode) => {
    onUpdateConfig({ studioMode: 'bumper_logo', logoCountMode: mode });
    onSelectSection('bumper_logo', 'logo');
  };

  const isSingle = config.logoCountMode === 'single';

  return (
    <div className="studio-navigation flex flex-col gap-3 w-full bg-[#F5F0E4] border border-[#ADC4D1] rounded-2xl p-3 shadow-sm select-none text-[#2F2525]">
      {/* ======================================================== */}
      {/* CARD 1: BUMPER OPENING VIDEO (DROPDOWN ACCORDION)         */}
      {/* ======================================================== */}
      <div
        className={`rounded-xl border transition-all overflow-hidden ${
          currentMode === 'bumper_logo'
            ? 'border-[#760D1C] shadow-sm bg-white'
            : 'border-[#ADC4D1] bg-white hover:border-[#760D1C]/50'
        }`}
      >
        {/* Card Header Dropdown Toggle */}
        <button
          type="button"
          onClick={() => handleCardHeaderClick('bumper_logo', 'logo')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-3 font-black text-xs tracking-normal uppercase transition-colors ${
            currentMode === 'bumper_logo'
              ? 'bg-[#760D1C] text-[#F5F0E4]'
              : 'bg-[#E7D4AE] text-[#760D1C] hover:bg-[#F5F0E4] border border-[#ADC4D1]'
          }`}
        >
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <Film className="w-4 h-4 text-[#E7D4AE] shrink-0" />
            <span className="whitespace-nowrap text-sm font-black">BUMPER LOGO</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentMode === 'bumper_logo' && (
              <span className="w-2 h-2 rounded-full bg-[#E7D4AE] animate-pulse" />
            )}
            <ChevronDown
              className={`w-4 h-4 text-[#E7D4AE] transition-transform duration-300 ${
                openCards.bumper_logo ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {/* DROPDOWN BODY: Revealed when Bumper Opening is clicked */}
        {openCards.bumper_logo && (
          <div className="flex flex-col transition-all">
            {/* Sub-Buttons: SINGLE LOGO vs MULTIPLE LOGO */}
            <div className="p-2 bg-[#F5F0E4] border-b border-[#ADC4D1]/60">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLogoModeChange('single')}
                  className={`min-h-10 px-2 text-xs font-black tracking-normal uppercase whitespace-nowrap rounded-lg border transition-all text-center ${
                    config.logoCountMode === 'single' && currentMode === 'bumper_logo'
                      ? 'bg-[#760D1C] border-[#760D1C] text-[#F5F0E4] shadow-sm'
                      : 'bg-white border-[#ADC4D1] text-[#4F4141] hover:text-[#760D1C] hover:border-[#760D1C] hover:bg-[#F5F0E4]'
                  }`}
                >
                  SATU LOGO
                </button>
                <button
                  type="button"
                  onClick={() => handleLogoModeChange('multiple')}
                  className={`min-h-10 px-2 text-xs font-black tracking-normal uppercase whitespace-nowrap rounded-lg border transition-all text-center ${
                    config.logoCountMode === 'multiple' && currentMode === 'bumper_logo'
                      ? 'bg-[#760D1C] border-[#760D1C] text-[#F5F0E4] shadow-sm'
                      : 'bg-white border-[#ADC4D1] text-[#4F4141] hover:text-[#760D1C] hover:border-[#760D1C] hover:bg-[#F5F0E4]'
                  }`}
                >
                  MULTI
                </button>
              </div>
            </div>

            {/* Sub-Menu Items */}
            <div className="p-2.5 bg-[#E7D4AE] border-t border-[#ADC4D1] flex flex-col gap-1.5 text-[#2F2525]">
              {[
                {
                  id: 'logo' as LeftNavSection,
                  label: isSingle ? 'TAMBAH LOGO' : 'TAMBAH LOGO MITRA',
                  icon: isSingle ? PlusCircle : Plus,
                },
                {
                  id: 'background' as LeftNavSection,
                  label: 'LATAR & WARNA',
                  icon: Palette,
                },
                ...(!isSingle
                  ? [
                      {
                        id: 'text' as LeftNavSection,
                        label: 'TEKS & FONT',
                        icon: FileText,
                      },
                    ]
                  : []),
                {
                  id: 'effects' as LeftNavSection,
                  label: 'EFEK ANIMASI',
                  icon: Sparkles,
                },
              ].map((item) => {
                const isSelected = currentMode === 'bumper_logo' && activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onUpdateConfig({ studioMode: 'bumper_logo' });
                      onSelectSection('bumper_logo', item.id);
                    }}
                    className={`flex items-center justify-between w-full gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold tracking-normal uppercase transition-all ${
                      isSelected
                        ? 'bg-[#760D1C] text-[#F5F0E4] shadow-sm font-black translate-x-1 border border-[#760D1C]'
                        : 'text-[#2F2525] hover:bg-white/60 hover:text-[#760D1C]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E7D4AE]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CARD 2: VIDEO TITLE (DROPDOWN ACCORDION)                  */}
      {/* ======================================================== */}
      <div
        className={`rounded-xl border transition-all overflow-hidden ${
          currentMode === 'video_title'
            ? 'border-[#760D1C] shadow-sm bg-white'
            : 'border-[#ADC4D1] bg-white hover:border-[#760D1C]/50'
        }`}
      >
        {/* Card Header Dropdown Toggle */}
        <button
          type="button"
          onClick={() => handleCardHeaderClick('video_title', 'text')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-3 font-black text-xs tracking-normal uppercase transition-colors ${
            currentMode === 'video_title'
              ? 'bg-[#760D1C] text-[#F5F0E4]'
              : 'bg-[#E7D4AE] text-[#760D1C] hover:bg-[#F5F0E4] border border-[#ADC4D1]'
          }`}
        >
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <Type className="w-4 h-4 text-[#E7D4AE] shrink-0" />
            <span className="whitespace-nowrap text-sm font-black">JUDUL VIDEO</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentMode === 'video_title' && (
              <span className="w-2 h-2 rounded-full bg-[#E7D4AE] animate-pulse" />
            )}
            <ChevronDown
              className={`w-4 h-4 text-[#E7D4AE] transition-transform duration-300 ${
                openCards.video_title ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {/* DROPDOWN BODY: Revealed when Video Title is clicked */}
        {openCards.video_title && (
          <div className="p-2.5 bg-[#E7D4AE] border-t border-[#ADC4D1] flex flex-col gap-1.5 text-[#2F2525] transition-all">
            {[
              { id: 'logo' as LeftNavSection, label: 'TAMBAH LOGO', icon: PlusCircle },
              { id: 'background' as LeftNavSection, label: 'LATAR & WARNA', icon: Palette },
              { id: 'text' as LeftNavSection, label: 'TEKS & FONT', icon: FileText },
              { id: 'effects' as LeftNavSection, label: 'EFEK ANIMASI', icon: Sparkles },
            ].map((item) => {
              const isSelected = currentMode === 'video_title' && activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onUpdateConfig({ studioMode: 'video_title' });
                    onSelectSection('video_title', item.id);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-[13px] font-bold tracking-normal uppercase transition-all ${
                    isSelected
                      ? 'bg-[#760D1C] text-[#F5F0E4] shadow-sm font-black translate-x-1 border border-[#760D1C]'
                      : 'text-[#2F2525] hover:bg-white/60 hover:text-[#760D1C]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E7D4AE]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CARD 3: FRAME/LOGO VIDEO (DROPDOWN ACCORDION)             */}
      {/* ======================================================== */}
      <div
        className={`rounded-xl border transition-all overflow-hidden ${
          currentMode === 'frame_video'
            ? 'border-[#760D1C] shadow-sm bg-white'
            : 'border-[#ADC4D1] bg-white hover:border-[#760D1C]/50'
        }`}
      >
        {/* Card Header Dropdown Toggle */}
        <button
          type="button"
          onClick={() => handleCardHeaderClick('frame_video', 'logo')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-3 font-black text-xs tracking-normal uppercase transition-colors ${
            currentMode === 'frame_video'
              ? 'bg-[#760D1C] text-[#F5F0E4]'
              : 'bg-[#E7D4AE] text-[#760D1C] hover:bg-[#F5F0E4] border border-[#ADC4D1]'
          }`}
        >
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <Layers className="w-4 h-4 text-[#E7D4AE] shrink-0" />
            <div className="flex flex-col min-w-0 text-left">
              <span className="whitespace-nowrap text-sm font-black">WATERMARK</span>
              <span className="max-w-full text-xs font-semibold text-[#E7D4AE]/90 normal-case leading-tight">Overlay pojok kanan atas</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentMode === 'frame_video' && (
              <span className="w-2 h-2 rounded-full bg-[#E7D4AE] animate-pulse" />
            )}
            <ChevronDown
              className={`w-4 h-4 text-[#E7D4AE] transition-transform duration-300 ${
                openCards.frame_video ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </button>

        {/* DROPDOWN BODY: Revealed when Frame/Logo Video is clicked */}
        {openCards.frame_video && (
          <div className="p-2.5 bg-[#E7D4AE] border-t border-[#ADC4D1] flex flex-col gap-1.5 text-[#2F2525] transition-all">
            {[
              { id: 'logo' as LeftNavSection, label: 'TAMBAH LOGO', icon: PlusCircle },
              { id: 'frame_style' as LeftNavSection, label: 'GAYA WATERMARK', icon: Box },
            ].map((item) => {
              const isSelected = currentMode === 'frame_video' && activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onUpdateConfig({ studioMode: 'frame_video' });
                    onSelectSection('frame_video', item.id);
                  }}
                  className={`flex items-center justify-between w-full gap-2 px-3 py-2.5 rounded-lg text-[13px] font-bold tracking-normal uppercase transition-all ${
                    isSelected
                      ? 'bg-[#760D1C] text-[#F5F0E4] shadow-sm font-black translate-x-1 border border-[#760D1C]'
                      : 'text-[#2F2525] hover:bg-white/60 hover:text-[#760D1C]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E7D4AE]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

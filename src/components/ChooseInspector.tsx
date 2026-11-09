import React from 'react';
import {
  BumperConfig,
  StudioMode,
  LogoCountMode,
  AudioThemeId,
  BackgroundStyle,
  TransitionStyle,
  TitleTransitionStyle,
  FrameBackgroundMode,
  ColorTone,
  SingleLogoAnimation,
  LogoSlot,
} from '../types/bumper';
import { LeftNavSection } from './LeftNavigation';
import { audioEngine } from '../utils/audioEngine';
import {
  WATERMARK_VARIATIONS,
  generateWatermarkSvgString,
} from '../utils/watermarkTemplates';
import {
  Upload,
  Check,
  Sparkles,
  Palette,
  Volume2,
  Box,
  Circle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Play,
  Layers,
  MoveLeft,
  MoveDown,
  MoveUp,
  Puzzle,
  Eye,
  Compass,
  Copy,
  Sliders,
  Clock,
  Scan,
  Zap,
  RotateCw,
  Expand,
  ZoomIn,
  Type as TypeIcon,
} from 'lucide-react';
interface ChooseInspectorProps {
  config: BumperConfig;
  onUpdateConfig: (partial: Partial<BumperConfig>) => void;
  activeSection: LeftNavSection;
  lang: 'id' | 'en';
}

const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Elegan & Berwibawa)' },
  { id: 'Outfit', name: 'Outfit (Modern & Bersih)' },
  { id: 'Cinzel', name: 'Cinzel (Sinematik Megah)' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech Futuristik)' },
  { id: 'Oswald', name: 'Oswald (Kondensasi Tegas)' },
  { id: 'Playfair Display', name: 'Playfair Display (Klasik Luxury)' },
];

const FONT_COLOR_PRESETS = [
  { name: 'Putih Bersih', hex: '#FFFFFF' },
  { name: 'Warm Sand', hex: '#E7D4AE' },
  { name: 'Burgundy Emas', hex: '#760D1C' },
  { name: 'Dusty Slate', hex: '#ADC4D1' },
  { name: 'Soft Cream', hex: '#F5F0E4' },
  { name: 'Base Slate', hex: '#181F2B' },
];

const COLOR_TONE_OPTIONS: { id: ColorTone; name: string; preview: string; desc: string }[] = [
  { id: 'none', name: 'Natural / Asli', preview: '#94A3B8', desc: 'Tanpa filter warna tambahan' },
  { id: 'warm_cinematic', name: 'Warm Cinematic', preview: '#E7D4AE', desc: 'Kehangatan emas sinematik' },
  { id: 'cool_tech', name: 'Cool Slate Tech', preview: '#ADC4D1', desc: 'Nuansa biru korporat futuristik' },
  { id: 'noir_luxe', name: 'Noir Luxe (Burgundy/Black)', preview: '#760D1C', desc: 'Monokromatik mewah kontras tinggi' },
  { id: 'emerald_signature', name: 'Emerald NKE', preview: '#10B981', desc: 'Kombinasi hijau & emas khas' },
  { id: 'sunset_amber', name: 'Sunset Amber', preview: '#F59E0B', desc: 'Pendaran senja dramatis' },
];

const FRAME_PALETTES = [
  { name: 'Biru NKE', accent1: '#144DFF', accent2: '#FFB51C', accent3: '#12A52A', bgCard: '#FFFFFF' },
  { name: 'Ocean Blue', accent1: '#1879A8', accent2: '#F0A94B', accent3: '#4CB7A5', bgCard: '#F7FAFC' },
  { name: 'Terracotta', accent1: '#B84A3A', accent2: '#E5A34B', accent3: '#697D54', bgCard: '#FFF8ED' },
  { name: 'Monokrom', accent1: '#333F50', accent2: '#8292A5', accent3: '#C1CBD4', bgCard: '#FFFFFF' },
];

export const ChooseInspector: React.FC<ChooseInspectorProps> = ({
  config,
  onUpdateConfig,
  activeSection,
  lang,
}) => {
  const [copiedSvg, setCopiedSvg] = React.useState(false);
  const [svgCopyFailed, setSvgCopyFailed] = React.useState(false);
  const [frameLogoUploadError, setFrameLogoUploadError] = React.useState<string | null>(null);
  const currentMode = config.studioMode;
  const isSingleLogo = currentMode === 'bumper_logo' && config.logoCountMode === 'single';

  // Handle single logo file upload
  const handleSingleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateConfig({
          singleLogo: {
            id: 'single_custom',
            enabled: true,
            name: file.name,
            url: dataUrl,
            scale: config.singleLogoScale || 1.25,
          },
          customLogoUrl: dataUrl,
          generateTrigger: Date.now(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Add more logo to bumperLogos (Multiple Logo mode)
  const handleAddMoreBumperLogo = () => {
    const currentList = config.bumperLogos || [];
    const newSlot: LogoSlot = {
      id: `logo_${Date.now()}`,
      enabled: true,
      name: `Logo Mitra ${currentList.length + 1}`,
      url: '/assets/aistudio/kso_wiswa_hd.png',
      scale: 1.0,
    };
    onUpdateConfig({ bumperLogos: [...currentList, newSlot], generateTrigger: Date.now() });
  };

  // Upload file for a specific slot in bumperLogos
  const handleSlotLogoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const nextLogos = [...(config.bumperLogos || [])];
        if (nextLogos[index]) {
          nextLogos[index] = {
            ...nextLogos[index],
            url: dataUrl,
            name: file.name,
            enabled: true,
          };
          onUpdateConfig({ bumperLogos: nextLogos, generateTrigger: Date.now() });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove slot from bumperLogos
  const handleRemoveBumperSlot = (index: number) => {
    const nextLogos = (config.bumperLogos || []).filter((_, i) => i !== index);
    onUpdateConfig({ bumperLogos: nextLogos, generateTrigger: Date.now() });
  };

  // Add more logo to frameLogos (Frame Video mode)
  const handleAddMoreFrameLogo = () => {
    const currentList = config.frameLogos || [];
    const newSlot: LogoSlot = {
      id: `f_logo_${Date.now()}`,
      enabled: true,
      name: '',
      url: '',
      scale: 1.0,
    };
    setFrameLogoUploadError(null);
    onUpdateConfig({ frameLogos: [...currentList, newSlot], generateTrigger: Date.now() });
  };

  // Upload file for a specific slot in frameLogos
  const handleFrameSlotUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!file.type.startsWith('image/')) {
      setFrameLogoUploadError('Pilih file gambar yang valid untuk logo.');
      return;
    }

    setFrameLogoUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const nextLogos = [...(config.frameLogos || [])];
        if (nextLogos[index]) {
          nextLogos[index] = {
            ...nextLogos[index],
            url: dataUrl,
            name: file.name,
            enabled: true,
          };
          onUpdateConfig({ frameLogos: nextLogos, generateTrigger: Date.now() });
        }
      }
    };
    reader.onerror = () => {
      console.error('File logo watermark tidak dapat dibaca:', reader.error);
      setFrameLogoUploadError('Logo gagal dibaca. Coba pilih file gambar lain.');
    };
    reader.onabort = () => {
      setFrameLogoUploadError('Pembacaan logo dibatalkan. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  // Remove slot from frameLogos
  const handleRemoveFrameSlot = (index: number) => {
    const nextLogos = (config.frameLogos || []).filter((_, i) => i !== index);
    onUpdateConfig({ frameLogos: nextLogos, generateTrigger: Date.now() });
  };

  // Video Title custom logo upload
  const handleVideoTitleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateConfig({
          titleEmblemUrl: dataUrl,
          titleEmblemEnabled: true,
          generateTrigger: Date.now(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Add more logo to titleLogos (Multiple Logo mode for Video Title)
  const handleAddMoreTitleLogo = () => {
    const currentList = config.titleLogos || [];
    const newSlot: LogoSlot = {
      id: `t_logo_${Date.now()}`,
      enabled: true,
      name: `Logo Mitra ${currentList.length + 1}`,
      url: '/assets/aistudio/kso_wiswa_hd.png',
      scale: 1.0,
    };
    onUpdateConfig({ titleLogos: [...currentList, newSlot], generateTrigger: Date.now() });
  };

  // Upload file for a specific slot in titleLogos
  const handleTitleSlotUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const nextLogos = [...(config.titleLogos || [])];
        if (nextLogos[index]) {
          nextLogos[index] = {
            ...nextLogos[index],
            url: dataUrl,
            name: file.name,
            enabled: true,
          };
          onUpdateConfig({ titleLogos: nextLogos, generateTrigger: Date.now() });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove slot from titleLogos
  const handleRemoveTitleSlot = (index: number) => {
    const nextLogos = (config.titleLogos || []).filter((_, i) => i !== index);
    onUpdateConfig({ titleLogos: nextLogos, generateTrigger: Date.now() });
  };

  // Test sound effect playback
  const handleTestAudio = () => {
    audioEngine.play(config.audioTheme, config.soundVolume, 0, config.customAudioUrl);
  };

  // Copy full SVG code for selected watermark
  const handleCopySvg = async () => {
    setSvgCopyFailed(false);
    const tone = {
      accent1: config.frameAccentColor || '#144DFF',
      accent2: config.frameSecondaryAccent || '#FFB51C',
      accent3: config.frameTertiaryAccent || '#12A52A',
      bgCard: config.frameCardBgColor || '#FFFFFF',
    };
    try {
      const svgCode = generateWatermarkSvgString(
        config.frameStyle || 'klasik',
        tone,
        config.frameLogos || []
      );
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard tidak tersedia di browser ini.');
      }
      await navigator.clipboard.writeText(svgCode);
      setCopiedSvg(true);
      setSvgCopyFailed(false);
      setTimeout(() => setCopiedSvg(false), 2200);
    } catch (error) {
      console.error('Kode SVG watermark tidak dapat disalin:', error);
      setCopiedSvg(false);
      setSvgCopyFailed(true);
    }
  };

  // Section title label formatter
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'logo':
        return currentMode === 'video_title'
          ? 'ADD LOGO VIDEO TITLE'
          : currentMode === 'frame_video'
          ? 'MANAGE LOGO FRAME (ADD MORE)'
          : isSingleLogo
          ? 'SINGLE LOGO'
          : 'ADD MORE LOGO (MULTIPLE)';
      case 'background':
        return 'BACKGROUND & COLOR STYLE';
      case 'text':
        return currentMode === 'video_title' ? 'VIDEO TITLE TYPOGRAPHY' : 'TEXT & FONT STYLE';
      case 'effects':
        return 'TRANSISI & EFEK VISUAL';
      case 'frame_style':
        return 'FRAME / WATERMARK VARIATIONS';
      case 'audio':
        return 'AUDIO & SOUNDTRACK';
      default:
        return 'CHOOSE OPTIONS';
    }
  };

  return (
    <div className="studio-inspector flex flex-col gap-3 w-full bg-[#F5F0E4] border border-[#ADC4D1] rounded-2xl p-3 shadow-sm select-none text-[#2F2525]">
      {/* Top Banner Header: Warm Sand & Deep Burgundy */}
      <div className="studio-inspector-header bg-[#760D1C] border border-[#E7D4AE]/60 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#E7D4AE]">
            {getSectionTitle()}
          </span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-[#E7D4AE] text-[#760D1C] font-semibold">
          {currentMode.toUpperCase()}
        </span>
      </div>

      {/* Main Options Box (Styled with Warm Sand & Charcoal Slate) */}
      <div className="studio-inspector-content bg-[#E7D4AE] border border-[#ADC4D1] rounded-xl p-3 sm:p-4 text-[#2F2525] flex flex-col gap-4 max-h-none xl:max-h-[calc(100vh-170px)] overflow-y-auto custom-scrollbar">
        {/* ======================================================== */}
        {/* OPTION SET: ADD LOGO / ADD MORE LOGO                     */}
        {/* ======================================================== */}
        {activeSection === 'logo' && (
          <div className="flex flex-col gap-4">
            {/* 1. SINGLE LOGO: Pure logo focus (NO TEXT STYLE!) */}
            {isSingleLogo && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-[#3E2916]">
                    PILIH LOGO TUNGGAL (SINGLE LOGO)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        name: 'PT Nusa Konstruksi Enjiniring (NKE)',
                        url: '/assets/aistudio/kso_nke_hd.png',
                      },
                      {
                        name: 'PT Jaya Konstruksi',
                        url: '/assets/aistudio/kso_jaya_hd.png',
                      },
                      {
                        name: 'PT Wiswakharman',
                        url: '/assets/aistudio/kso_wiswa_hd.png',
                      },
                      {
                        name: 'KSO Full Konsorsium',
                        url: '/assets/aistudio/kso_full_hd.png',
                      },
                    ].map((item, idx) => {
                      const isSelected = config.singleLogo?.url === item.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onUpdateConfig({
                              singleLogo: {
                                id: `single_${idx}`,
                                enabled: true,
                                name: item.name,
                                url: item.url,
                                scale: config.singleLogoScale || 1.25,
                              },
                              customLogoUrl: item.url,
                              generateTrigger: Date.now(),
                            });
                          }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-[#760D1C] border-[#E7D4AE] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                              : 'bg-[#EDE2D3] border-[#E7D4AE] text-[#181F2B] hover:bg-[#E2D4C1]'
                          }`}
                        >
                          <div className="w-14 h-10 flex items-center justify-center p-1 bg-white rounded border border-black/10 mb-1.5 shadow-sm">
                            <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <span className="text-[11px] font-bold line-clamp-1">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Custom Logo Button */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <span className="text-[11px] font-bold uppercase text-[#3E2916]">
                    UPLOAD LOGO KUSTOM
                  </span>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-neutral-50 border border-[#ADC4D1] rounded-lg cursor-pointer text-xs font-bold text-[#181F2B] transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-[#760D1C]" />
                    <span>PILIH FILE PNG / SVG</span>
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleSingleLogoUpload} className="hidden" />
                  </label>
                  {config.singleLogo?.url && (
                    <span className="text-[10px] text-[#5B4734] truncate">
                      File aktif: {config.singleLogo.name}
                    </span>
                  )}
                </div>

                {/* Logo Scale Slider */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3E2916]">
                    <span>UKURAN SKALA LOGO</span>
                    <span className="font-mono text-[#760D1C]">{((config.singleLogoScale || 1.25) * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={config.singleLogoScale || 1.25}
                    onChange={(e) => onUpdateConfig({ singleLogoScale: parseFloat(e.target.value) })}
                    className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* 2. MULTIPLE LOGO: Add More Logo capability */}
            {!isSingleLogo && currentMode === 'bumper_logo' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider uppercase text-[#3E2916]">
                    SLOT LOGO MITRA KONSORSIUM
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMoreBumperLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#760D1C] hover:bg-[#460C12] text-[#E7D4AE] text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ADD MORE LOGO</span>
                  </button>
                </div>

                {/* List of Multiple Logo slots */}
                {(config.bumperLogos || []).map((slot, index) => (
                  <div key={slot.id} className="p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#181F2B] uppercase">
                        SLOT {index + 1}: {slot.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextLogos = [...(config.bumperLogos || [])];
                            nextLogos[index] = { ...slot, enabled: !slot.enabled };
                            onUpdateConfig({ bumperLogos: nextLogos });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            slot.enabled ? 'bg-[#760D1C] text-[#E7D4AE]' : 'bg-[#C2B097] text-[#5B4734]'
                          }`}
                        >
                          {slot.enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                        {config.bumperLogos && config.bumperLogos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBumperSlot(index)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Hapus slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-12 h-10 flex items-center justify-center p-1 bg-white rounded border border-black/10 shrink-0">
                        {slot.url ? (
                          <img src={slot.url} alt={slot.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-neutral-50 border border-[#ADC4D1] rounded cursor-pointer text-xs font-bold text-[#181F2B] transition-colors">
                        <Upload className="w-3 h-3 text-[#760D1C]" />
                        <span>Upload Logo</span>
                        <input type="file" accept="image/*" onChange={(e) => handleSlotLogoUpload(index, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. FRAME VIDEO: Full Add Logo with More button */}
            {currentMode === 'frame_video' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider uppercase text-[#3E2916]">
                    LOGO WATERMARK SUDUT (FRAME VIDEO)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMoreFrameLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#760D1C] hover:bg-[#460C12] text-[#E7D4AE] text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ADD MORE LOGO</span>
                  </button>
                </div>

                {frameLogoUploadError && (
                  <p role="alert" className="text-[11px] font-semibold text-red-700">
                    {frameLogoUploadError}
                  </p>
                )}
                {!(config.frameLogos || []).some((logo) => logo.enabled && logo.url) && (
                  <p className="text-[10px] text-[#7A6451] leading-relaxed">
                    Logo NKE × UNP bawaan mengikuti template. Upload logo sendiri untuk menggantikannya.
                  </p>
                )}

                {(config.frameLogos || []).map((slot, index) => (
                  <div key={slot.id} className="p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#181F2B]">
                        LOGO {index + 1}{slot.name ? `: ${slot.name}` : ': Belum diunggah'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextLogos = [...(config.frameLogos || [])];
                            nextLogos[index] = { ...slot, enabled: !slot.enabled };
                            onUpdateConfig({ frameLogos: nextLogos, generateTrigger: Date.now() });
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            slot.enabled ? 'bg-[#760D1C] text-[#E7D4AE]' : 'bg-[#C2B097] text-[#5B4734]'
                          }`}
                        >
                          {slot.enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFrameSlot(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Hapus slot logo"
                          aria-label={`Hapus slot logo ${index + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-12 h-10 flex items-center justify-center p-1 bg-white rounded border border-black/10 shrink-0">
                        {slot.url ? <img src={slot.url} alt={slot.name} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-4 h-4 text-neutral-400" />}
                      </div>
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-neutral-50 border border-[#ADC4D1] rounded cursor-pointer text-xs font-bold text-[#181F2B] transition-colors">
                        <Upload className="w-3 h-3 text-[#760D1C]" />
                        <span>Upload Logo</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFrameSlotUpload(index, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. VIDEO TITLE: EMBLEM / LOGO MANAGEMENT */}
            {currentMode === 'video_title' && (
              <div className="flex flex-col gap-3.5">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#181F2B] uppercase">Tampilkan Logo di Video Title</span>
                    <span className="text-[11px] text-[#7A6451]">Aktifkan atau sembunyikan logo di atas judul video</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ titleEmblemEnabled: !config.titleEmblemEnabled, generateTrigger: Date.now() })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.titleEmblemEnabled !== false ? 'bg-[#760D1C]' : 'bg-[#C2B097]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.titleEmblemEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {config.titleEmblemEnabled !== false && (
                  <>
                    {/* Sub Mode Selector: Single Logo vs Multiple Logo */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#C9B69B] rounded-lg border border-[#E7D4AE]">
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ titleLogoMode: 'single', generateTrigger: Date.now() })}
                        className={`py-1.5 px-2 text-xs font-bold rounded-md transition-all text-center ${
                          config.titleLogoMode !== 'multiple'
                            ? 'bg-[#760D1C] text-[#F5F0E4] shadow-sm font-black'
                            : 'text-[#3E2916] hover:bg-black/5'
                        }`}
                      >
                        1 LOGO / EMBLEM UTAMA
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ titleLogoMode: 'multiple', generateTrigger: Date.now() })}
                        className={`py-1.5 px-2 text-xs font-bold rounded-md transition-all text-center ${
                          config.titleLogoMode === 'multiple'
                            ? 'bg-[#760D1C] text-[#F5F0E4] shadow-sm font-black'
                            : 'text-[#3E2916] hover:bg-black/5'
                        }`}
                      >
                        MULTIPLE LOGO MITRA
                      </button>
                    </div>

                    {/* SINGLE LOGO MODE */}
                    {config.titleLogoMode !== 'multiple' ? (
                      <div className="flex flex-col gap-3">
                        {/* Presets Grid */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-black uppercase text-[#3E2916]">
                            PILIH LOGO RESMI ATAU EMBLEM:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                name: 'Pohon Hayat IKN',
                                desc: 'Emblem Emas Resmi IKN',
                                url: '',
                                isVector: true,
                              },
                              {
                                name: 'PT Nusa Konstruksi Enjiniring',
                                desc: 'Logo Resmi NKE, Tbk',
                                url: '/assets/aistudio/kso_nke_hd.png',
                              },
                              {
                                name: 'PT Jaya Konstruksi',
                                desc: 'Logo Jaya Konstruksi',
                                url: '/assets/aistudio/kso_jaya_hd.png',
                              },
                              {
                                name: 'PT Wiswakharman',
                                desc: 'Logo Wiswakharman',
                                url: '/assets/aistudio/kso_wiswa_hd.png',
                              },
                              {
                                name: 'KSO Konsorsium',
                                desc: 'Nusa Jaya Wiswakharman',
                                url: '/assets/aistudio/LOGO_KSO_HD_vektor_edcea276.png',
                              },
                              {
                                name: 'Simbol Proyek',
                                desc: 'Simbol Hunian Vertikal',
                                url: '/assets/aistudio/image_460651e4.png',
                              },
                            ].map((preset, idx) => {
                              const isSelected = (!preset.url && !config.titleEmblemUrl) || config.titleEmblemUrl === preset.url;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    onUpdateConfig({
                                      titleEmblemUrl: preset.url,
                                      titleEmblemEnabled: true,
                                      generateTrigger: Date.now(),
                                    });
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                                    isSelected
                                      ? 'bg-[#760D1C] border-[#E7D4AE] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                                      : 'bg-[#EDE2D3] border-[#E7D4AE] text-[#181F2B] hover:bg-[#E2D4C1]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="w-9 h-7 rounded bg-white flex items-center justify-center p-0.5 border border-black/10 overflow-hidden">
                                      {preset.url ? (
                                        <img src={preset.url} alt={preset.name} className="max-w-full max-h-full object-contain" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-[10px] text-white font-bold">
                                          IKN
                                        </div>
                                      )}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-[#E7D4AE]" />}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold leading-tight block truncate">{preset.name}</span>
                                    <span className={`text-[10px] block truncate ${isSelected ? 'text-[#E7D4AE]' : 'text-[#7A6451]'}`}>
                                      {preset.desc}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Upload Custom Logo Button */}
                        <div className="p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] flex flex-col gap-2">
                          <span className="text-[11px] font-black uppercase text-[#3E2916]">
                            ATAU UPLOAD LOGO KUSTOM ANDA:
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#760D1C] hover:bg-[#4E0E15] text-[#E7D4AE] rounded-lg cursor-pointer text-xs font-bold transition-colors shadow-sm">
                              <Upload className="w-4 h-4" />
                              <span>Pilih File Logo (PNG/SVG)</span>
                              <input type="file" accept="image/*" onChange={handleVideoTitleLogoUpload} className="hidden" />
                            </label>

                            {Boolean(config.titleEmblemUrl) && (
                              <button
                                type="button"
                                onClick={() => onUpdateConfig({ titleEmblemUrl: '', generateTrigger: Date.now() })}
                                className="px-3 py-2 bg-white hover:bg-neutral-100 border border-[#E7D4AE] text-[#760D1C] text-xs font-bold rounded-lg transition-colors"
                              >
                                Reset ke Pohon Hayat
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Logo Scale Slider */}
                        <div className="p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#181F2B] flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-[#760D1C]" />
                              <span>Ukuran Logo Video Title</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#760D1C] text-[#E7D4AE] font-mono text-[11px]">
                              {Math.round((config.titleLogoScale || 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={config.titleLogoScale || 1.0}
                            onChange={(e) => onUpdateConfig({ titleLogoScale: parseFloat(e.target.value), generateTrigger: Date.now() })}
                            className="w-full accent-[#760D1C] h-1.5 bg-[#E7D4AE] rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Halo Glow Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#760D1C]" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#181F2B]">Efek Cahaya Halo Keemasan</span>
                              <span className="text-[10px] text-[#7A6451]">Pendaran aura bernafas di belakang logo</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateConfig({ titleLogoGlow: config.titleLogoGlow === false ? true : false, generateTrigger: Date.now() })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              config.titleLogoGlow !== false ? 'bg-[#760D1C]' : 'bg-[#C2B097]'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                config.titleLogoGlow !== false ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MULTIPLE LOGO MITRA MODE */
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-[#3E2916]">
                            BARIS LOGO MITRA / KONSORSIUM ({config.titleLogos?.filter((s) => s.enabled).length || 0} AKTIF)
                          </span>
                          <button
                            type="button"
                            onClick={handleAddMoreTitleLogo}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#760D1C] hover:bg-[#4E0E15] text-[#E7D4AE] rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Logo</span>
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {(config.titleLogos || []).map((slot, index) => (
                            <div
                              key={slot.id || index}
                              className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                                slot.enabled ? 'bg-[#EDE2D3] border-[#E7D4AE]' : 'bg-[#E5D7C4]/60 border-[#E7D4AE]/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={slot.enabled}
                                    onChange={(e) => {
                                      const next = [...(config.titleLogos || [])];
                                      next[index] = { ...next[index], enabled: e.target.checked };
                                      onUpdateConfig({ titleLogos: next, generateTrigger: Date.now() });
                                    }}
                                    className="accent-[#760D1C] w-4 h-4 rounded cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-[#181F2B]">
                                    {slot.name || `Mitra ${index + 1}`}
                                  </span>
                                </label>

                                {(config.titleLogos || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTitleSlot(index)}
                                    className="p-1 hover:bg-black/10 text-red-700 rounded transition-colors"
                                    title="Hapus slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-12 h-10 flex items-center justify-center p-1 bg-white rounded border border-black/10 shrink-0">
                                  {slot.url ? (
                                    <img src={slot.url} alt={slot.name} className="max-w-full max-h-full object-contain" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-neutral-400" />
                                  )}
                                </div>
                                <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-neutral-50 border border-[#ADC4D1] rounded cursor-pointer text-xs font-bold text-[#181F2B] transition-colors">
                                  <Upload className="w-3 h-3 text-[#760D1C]" />
                                  <span>Ganti Logo</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleTitleSlotUpload(index, e)} className="hidden" />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Multiple Logos Scale Slider */}
                        <div className="p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE] flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#181F2B] flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-[#760D1C]" />
                              <span>Ukuran Baris Logo Mitra</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#760D1C] text-[#E7D4AE] font-mono text-[11px]">
                              {Math.round((config.titleLogoScale || 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.8"
                            step="0.05"
                            value={config.titleLogoScale || 1.0}
                            onChange={(e) => onUpdateConfig({ titleLogoScale: parseFloat(e.target.value), generateTrigger: Date.now() })}
                            className="w-full accent-[#760D1C] h-1.5 bg-[#E7D4AE] rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION SET: EFFECT STYLE (DIVIDED: TRANSISI & EFEK)      */}
        {/* ======================================================== */}
        {activeSection === 'effects' && (
          <div className="flex flex-col gap-4">
            {/* 1. BAGIAN TRANSISI (TRANSITION ANIMATION) - SEPARATED BY MODE */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-black tracking-normal uppercase text-[#3E2916] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#760D1C]" />
                <span>
                  {currentMode === 'video_title'
                    ? '1. TRANSISI ANIMASI VIDEO TITLE'
                    : '1. TRANSISI ANIMASI BUMPER OPENING'}
                </span>
              </span>

              {/* A. KHUSUS MODE VIDEO TITLE SCREEN */}
              {currentMode === 'video_title' ? (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'fade_slide',
                      label: 'A. FADE & RISE',
                      desc: 'Judul naik tipis sambil memudar masuk; bersih dan modern untuk kartu judul.',
                      icon: MoveUp,
                    },
                    {
                      id: 'beam_wipe',
                      label: 'B. LIGHT SWEEP',
                      desc: 'Sapu cahaya tipis mengungkap judul dari kiri ke kanan dengan ritme halus.',
                      icon: Scan,
                    },
                    {
                      id: 'kinetic_typography',
                      label: 'C. KINETIC REVEAL',
                      desc: 'Judul muncul bertahap dengan gerak skala kecil dan aksen garis kontemporer.',
                      icon: Zap,
                    },
                    {
                      id: 'typewriter',
                      label: 'D. TYPEWRITER',
                      desc: 'Judul utama tampil bertahap dengan tempo rapi, tanpa efek berlebihan.',
                      icon: TypeIcon,
                    },
                    {
                      id: 'vertical_wipe',
                      label: 'E. VERTICAL WIPE',
                      desc: 'Judul terbuka dari atas ke bawah dengan sapuan yang halus.',
                      icon: MoveDown,
                    },
                    {
                      id: 'soft_scale',
                      label: 'F. SOFT SCALE',
                      desc: 'Judul muncul dari skala sedikit kecil lalu menetap dengan lembut.',
                      icon: Expand,
                    },
                  ].map((tr) => {
                    const currentTitleTrans = config.titleTransition || 'fade_slide';
                    const isSelected = currentTitleTrans === tr.id;
                    const Icon = tr.icon;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          onUpdateConfig({
                            titleTransition: tr.id as TitleTransitionStyle,
                            generateTrigger: Date.now(),
                          });
                        }}
                        className={`studio-transition-choice p-3.5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-[#760D1C] border-[#760D1C] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                            : 'bg-[#EDE2D3] border-[#D2BFA5] text-[#181F2B] hover:bg-[#E2D4C1] hover:border-[#760D1C]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-extrabold block">{tr.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#E7D4AE]" />}
                        </div>
                        <span className={`text-xs mt-1 block leading-relaxed ${isSelected ? 'text-[#E7D4AE]' : 'text-[#7A6451]'}`}>
                          {tr.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : isSingleLogo ? (
                /* B. KHUSUS BUMPER OPENING - SINGLE LOGO (EFEK ASLI YANG SUDAH BAGUS) */
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'puzzle_assemble',
                      label: 'A. PUZZLE POTONGAN KECIL SESUAI WARNA',
                      desc: 'Potongan puzzle kecil-kecil sesuai warna biru, oranye, dan hijau saling mengunci rapat',
                      icon: Puzzle,
                    },
                    {
                      id: 'faded',
                      label: 'B. FADED',
                      desc: 'Transisi blur optik lembut & perbesaran mikro sinematik',
                      icon: Eye,
                    },
                    {
                      id: 'smooth_zoom_flare',
                      label: 'C. SOFT ZOOM & LIGHT SWEEP',
                      desc: 'Logo mendekat perlahan dan garis cahaya tipis melintas untuk aksen yang elegan.',
                      icon: Scan,
                    },
                    {
                      id: 'flip_3d_reveal',
                      label: 'D. CLEAN 3D FLIP',
                      desc: 'Logo berputar singkat pada sumbu vertikal lalu berhenti dengan rapi.',
                      icon: RotateCw,
                    },
                    {
                      id: 'matrix_scan_reveal',
                      label: 'E. PRECISION SCAN',
                      desc: 'Logo terbuka dari atas ke bawah; garis pemindai berhenti saat logo utuh.',
                      icon: Scan,
                    },
                    {
                      id: 'cinematic_glint_flare',
                      label: 'F. CINEMATIC GLINT',
                      desc: 'Logo muncul bersih lalu mendapat sapuan kilau sinematik.',
                      icon: Sparkles,
                    },
                    {
                      id: 'corporate_clean_push',
                      label: 'G. CLEAN PUSH',
                      desc: 'Logo meluncur naik sedikit dan membesar ke posisi akhir dengan rapi.',
                      icon: MoveUp,
                    },
                    {
                      id: 'zoom_scale_reveal',
                      label: 'H. ZOOM REVEAL',
                      desc: 'Logo muncul dari dekat lalu mengecil halus ke ukuran normal.',
                      icon: ZoomIn,
                    },
                    {
                      id: 'line_draw',
                      label: 'I. GARIS LALU WARNA',
                      desc: 'Kontur logo digambar lebih dulu dengan garis bercahaya, lalu warna aslinya muncul.',
                      icon: Scan,
                    },
                    {
                      id: 'line_pen',
                      label: 'J. SATU PENA',
                      desc: 'Satu garis menggambar kontur secara berurutan seperti pena tanpa terangkat.',
                      icon: Scan,
                    },
                    {
                      id: 'line_neon',
                      label: 'K. NEON',
                      desc: 'Kontur bercahaya neon digambar sebelum logo tampil dengan warna aslinya.',
                      icon: Zap,
                    },
                    {
                      id: 'line_only',
                      label: 'L. GARIS SAJA',
                      desc: 'Logo diubah menjadi line art; garis yang sudah tergambar tetap terlihat.',
                      icon: Scan,
                    },
                    {
                      id: 'line_fill',
                      label: 'M. ISI NAIK',
                      desc: 'Setelah kontur selesai, warna logo naik dari bawah hingga terisi penuh.',
                      icon: MoveUp,
                    },
                    {
                      id: 'line_echo',
                      label: 'N. GARIS GEMA',
                      desc: 'Garis bayangan yang lebih besar mengikuti kontur utama sebelum logo muncul.',
                      icon: Layers,
                    },
                    {
                      id: 'line_glitch',
                      label: 'O. GLITCH',
                      desc: 'Irisan logo bergeser singkat lalu menyatu kembali dengan bersih.',
                      icon: Zap,
                    },
                    {
                      id: 'line_blur',
                      label: 'P. BLUR KE FOKUS',
                      desc: 'Logo muncul dari blur lembut dan berhenti tajam pada ukuran normal.',
                      icon: Eye,
                    },
                    {
                      id: 'line_zoom',
                      label: 'Q. ZOOM PUNCH',
                      desc: 'Logo datang dari dekat dengan hentakan halus dan cincin kejutan.',
                      icon: ZoomIn,
                    },
                    {
                      id: 'line_slice',
                      label: 'R. MASK SLICE',
                      desc: 'Potongan horizontal bergantian meluncur masuk hingga membentuk logo.',
                      icon: Layers,
                    },
                    {
                      id: 'line_pixel',
                      label: 'S. PIXEL ASSEMBLE',
                      desc: 'Kotak-kotak logo berkumpul bertahap ke posisi akhir.',
                      icon: Layers,
                    },
                    {
                      id: 'line_dust',
                      label: 'T. DUST ASSEMBLE',
                      desc: 'Partikel berwarna bergerak dari luar dan menyusun logo.',
                      icon: Sparkles,
                    },
                    {
                      id: 'line_liquid',
                      label: 'U. LIQUID FILL',
                      desc: 'Logo terisi dari bawah dengan permukaan cairan yang bergerak halus.',
                      icon: MoveUp,
                    },
                    {
                      id: 'line_dots',
                      label: 'V. DOT TRACE',
                      desc: 'Titik-titik cahaya berjalan mengikuti kontur sebelum logo muncul.',
                      icon: Circle,
                    },
                  ].map((tr) => {
                    const isSelected = (config.singleLogoAnimation || 'puzzle_assemble') === tr.id;
                    const Icon = tr.icon;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          onUpdateConfig({
                            singleLogoAnimation: tr.id as SingleLogoAnimation,
                            singleLogoTransition: tr.id as SingleLogoAnimation,
                            generateTrigger: Date.now(),
                          });
                        }}
                        className={`studio-transition-choice p-3.5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-[#760D1C] border-[#760D1C] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                            : 'bg-[#EDE2D3] border-[#D2BFA5] text-[#181F2B] hover:bg-[#E2D4C1] hover:border-[#760D1C]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-extrabold block">{tr.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#E7D4AE]" />}
                        </div>
                        <span className={`text-xs mt-1 block leading-relaxed ${isSelected ? 'text-[#E7D4AE]' : 'text-[#7A6451]'}`}>
                          {tr.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* C. KHUSUS BUMPER OPENING - MULTIPLE LOGO (EFEK ASLI YANG SUDAH BAGUS) */
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'slide_left',
                      label: 'A. KUMPULKAN, LALU GESER KE KIRI',
                      desc: 'Logo masuk berurutan di tengah; setelah terkumpul, baris bergeser ke kiri.',
                      icon: MoveLeft,
                    },
                    {
                      id: 'slide_up',
                      label: 'B. KUMPULKAN, LALU NAIK',
                      desc: 'Logo masuk berurutan di tengah; setelah terkumpul, baris naik membuka ruang judul.',
                      icon: MoveUp,
                    },
                    {
                      id: 'faded',
                      label: 'C. SOFT FADE BERURUTAN',
                      desc: 'Setiap logo muncul lembut secara bergantian, lalu tersusun dengan jarak rapi.',
                      icon: Eye,
                    },
                    {
                      id: 'cinematic_zoom',
                      label: 'D. CINEMATIC ZOOM',
                      desc: 'Seluruh baris logo muncul dari dekat lalu menetap dengan lembut.',
                      icon: ZoomIn,
                    },
                    {
                      id: 'sequential_slide_left',
                      label: 'E. MASUK SAMBIL BERGESER',
                      desc: 'Baris mulai bergeser ke kiri saat logo-logo berikutnya masih masuk.',
                      icon: MoveLeft,
                    },
                    {
                      id: 'sequential_slide_up',
                      label: 'F. MASUK SAMBIL NAIK',
                      desc: 'Baris mulai naik saat logo-logo berikutnya masih masuk.',
                      icon: MoveUp,
                    },
                  ].map((tr) => {
                    const isSelected = (config.transitionStyle || 'slide_left') === tr.id;
                    const Icon = tr.icon;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          onUpdateConfig({
                            transitionStyle: tr.id as TransitionStyle,
                            generateTrigger: Date.now(),
                          });
                        }}
                        className={`studio-transition-choice p-3.5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-[#760D1C] border-[#760D1C] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                            : 'bg-[#EDE2D3] border-[#D2BFA5] text-[#181F2B] hover:bg-[#E2D4C1] hover:border-[#760D1C]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-extrabold block">{tr.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#E7D4AE]" />}
                        </div>
                        <span className={`text-xs mt-1 block leading-relaxed ${isSelected ? 'text-[#E7D4AE]' : 'text-[#7A6451]'}`}>
                          {tr.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Optional finishing effects */}
            <div className="studio-finishing-panel flex flex-col gap-2.5 p-3 rounded-2xl bg-[#EDE2D3] border border-[#D2BFA5] border-l-4 border-l-[#760D1C]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black uppercase text-[#3E2916] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#760D1C]" />
                  <span>2. SENTUHAN AKHIR</span>
                </span>
                <span className="text-xs font-medium text-[#7A6451]">Bumper & kartu judul · bisa digabung</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    key: 'anamorphicFlare' as const,
                    label: 'Kilau tambahan',
                    description: 'Pantulan ekstra di logo/judul; sapuan utama pada transisi tetap berjalan.',
                    enabled: config.anamorphicFlare === true,
                    icon: Sparkles,
                  },
                  {
                    key: 'laserScanline' as const,
                    label: 'Garis pemindai',
                    description: 'Garis horizontal bergerak melintasi latar.',
                    enabled: config.laserScanline === true,
                    icon: Scan,
                  },
                  {
                    key: 'cyberHexMesh' as const,
                    label: 'Pola geometris',
                    description: 'Jaring heksagon tipis di atas latar.',
                    enabled: config.cyberHexMesh === true,
                    icon: Box,
                  },
                  {
                    key: 'vignette' as const,
                    label: 'Tepi sinematik',
                    description: 'Menggelapkan tepi secara halus; mati secara default.',
                    enabled: config.vignette === true,
                    icon: Eye,
                  },
                ].map((effect) => {
                  const Icon = effect.icon;
                  return (
                    <button
                      key={effect.key}
                      type="button"
                      aria-pressed={effect.enabled}
                      onClick={() =>
                        onUpdateConfig({
                          [effect.key]: !effect.enabled,
                          generateTrigger: Date.now(),
                        })
                      }
                      className={`studio-finishing-choice flex items-start gap-2.5 p-3.5 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#760D1C] ${
                        effect.enabled
                          ? 'bg-[#760D1C] text-[#F5F0E4] border-[#760D1C] shadow-sm'
                          : 'bg-white text-[#181F2B] border-[#D2BFA5] hover:border-[#760D1C] hover:bg-[#FFFDF8]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          effect.enabled ? 'bg-white/10 text-[#E7D4AE]' : 'bg-[#F5F0E4] text-[#760D1C]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold">{effect.label}</span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide ${
                              effect.enabled ? 'text-[#E7D4AE]' : 'text-[#7A6451]'
                            }`}
                          >
                            {effect.enabled ? 'Aktif' : 'Mati'}
                          </span>
                        </span>
                        <span
                          className={`mt-1 block text-xs leading-relaxed ${
                            effect.enabled ? 'text-[#F5F0E4]/75' : 'text-[#7A6451]'
                          }`}
                        >
                          {effect.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {currentMode === 'bumper_logo' && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#181F2B] uppercase">PENDARAN DI BELAKANG LOGO</span>
                    <span className="text-[10px] text-[#7A6451]">
                      Atur halo cahaya seperti pada pratinjau, atau matikan sepenuhnya.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.logoHaloEnabled !== false}
                    aria-label="Aktifkan pendaran di belakang logo"
                    onClick={() =>
                      onUpdateConfig({
                        logoHaloEnabled: config.logoHaloEnabled === false,
                        generateTrigger: Date.now(),
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      config.logoHaloEnabled !== false ? 'bg-[#760D1C]' : 'bg-[#C2B097]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.logoHaloEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {config.logoHaloEnabled !== false && (
                  <label className="flex flex-col gap-1 border-t border-black/10 pt-2">
                    <span className="flex items-center justify-between text-[11px] font-bold text-[#3E2916]">
                      <span>INTENSITAS PENDARAN</span>
                      <span className="font-mono text-[#760D1C]">
                        {Math.round((config.logoHaloIntensity ?? 0.6) * 100)}%
                      </span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={config.logoHaloIntensity ?? 0.6}
                      aria-label="Atur intensitas pendaran logo"
                      onChange={(e) =>
                        onUpdateConfig({
                          logoHaloIntensity: parseFloat(e.target.value),
                          generateTrigger: Date.now(),
                        })
                      }
                      className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                    />
                  </label>
                )}
              </div>
            )}

            {/* 3. PENGATURAN DURASI VIDEO (BUMPER / VIDEO TITLE) */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#3E2916] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#760D1C]" />
                  <span>
                    {currentMode === 'video_title'
                      ? '3. DURASI VIDEO TITLE SCREEN'
                      : '3. DURASI VIDEO BUMPER'}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#760D1C] text-[#E7D4AE] font-mono font-bold text-xs">
                  {(currentMode === 'video_title'
                    ? (config.videoTitleDuration || config.duration || 5.0)
                    : (config.bumperDuration || config.duration || 5.5)
                  ).toFixed(1)}s
                </span>
              </div>
              <p className="text-[11px] text-[#7A6451] leading-relaxed">
                {currentMode === 'video_title'
                  ? 'Atur panjang durasi penayangan teks dan kartu judul video (MP4/WebM).'
                  : 'Atur panjang durasi animasi intro bumper video dari awal hingga akhir.'}
              </p>
              <input
                type="range"
                min="2.5"
                max="12.0"
                step="0.5"
                value={
                  currentMode === 'video_title'
                    ? (config.videoTitleDuration || config.duration || 5.0)
                    : (config.bumperDuration || config.duration || 5.5)
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (currentMode === 'video_title') {
                    onUpdateConfig({ videoTitleDuration: val, duration: val, generateTrigger: Date.now() });
                  } else {
                    onUpdateConfig({ bumperDuration: val, duration: val, generateTrigger: Date.now() });
                  }
                }}
                className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-[#5B4734] uppercase mr-1">Pilihan Cepat:</span>
                {[3.0, 4.0, 5.0, 5.5, 7.0, 10.0].map((d) => {
                  const activeD = currentMode === 'video_title'
                    ? (config.videoTitleDuration || config.duration)
                    : (config.bumperDuration || config.duration);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        if (currentMode === 'video_title') {
                          onUpdateConfig({ videoTitleDuration: d, duration: d, generateTrigger: Date.now() });
                        } else {
                          onUpdateConfig({ bumperDuration: d, duration: d, generateTrigger: Date.now() });
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        activeD === d
                          ? 'bg-[#760D1C] text-[#E7D4AE] border-[#760D1C] shadow-sm font-black'
                          : 'bg-white hover:bg-[#F5F0E4] text-[#3E2916] border-[#E7D4AE]'
                      }`}
                    >
                      {d}s
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION SET: FRAME STYLE (14 VARIATIONS + COLOR CONTROLS) */}
        {/* ======================================================== */}
        {activeSection === 'frame_style' && (
          <div className="flex flex-col gap-4">
            {/* 1. PENGATURAN TONE & LATAR (WARNA & TEMA) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-[#3E2916] flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#760D1C]" />
                  <span>TONE PENGATURAN WARNA & LATAR</span>
                </span>
                <span className="text-[10px] font-bold text-[#7A6451] uppercase">Untuk semua proyek</span>
              </div>

              {/* Mode Latar Preview */}
              <div>
                <label className="text-[10px] font-bold uppercase text-[#5B4734] mb-1.5 block">
                  PILIH LATAR KANVAS PREVIEW
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'slate', name: 'Abu gelap', desc: 'Latar gelap netral', color: '#333F50' },
                    { id: 'putih', name: 'Putih', desc: 'Latar terang bersih', color: '#FFFFFF' },
                    {
                      id: 'video',
                      name: 'Gradien',
                      desc: 'Latar gradasi untuk cek kontras',
                      gradient: 'linear-gradient(120deg,#0e2a47 0%,#2c6e6a 45%,#d9a45b 100%)',
                    },
                    {
                      id: 'alpha',
                      name: 'Transparan',
                      desc: 'Pola transparansi untuk PNG',
                      alpha: true,
                    },
                  ].map((bg) => {
                    const isSelected = (config.frameBackgroundMode || 'slate') === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          onUpdateConfig({
                            studioMode: 'frame_video',
                            frameBackgroundMode: bg.id as FrameBackgroundMode,
                            generateTrigger: Date.now(),
                          });
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-[#760D1C] border-[#760D1C] text-white ring-2 ring-[#E7D4AE] shadow-sm'
                            : 'bg-white border-[#E7D4AE] text-[#181F2B] hover:bg-[#F5F0E4]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            {bg.alpha ? (
                              <span className="w-3.5 h-3.5 rounded-full border border-black/20 bg-[repeating-conic-gradient(#bbb_0%_25%,#fff_0%_50%)] bg-[length:6px_6px]" />
                            ) : bg.gradient ? (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                style={{ background: bg.gradient }}
                              />
                            ) : (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: bg.color }}
                              />
                            )}
                            <span className="text-xs font-bold">{bg.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#E7D4AE]" />}
                        </div>
                        <span className={`text-[10px] block ${isSelected ? 'text-white/80' : 'text-[#7A6451]'}`}>
                          {bg.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project-neutral frame palettes and custom color controls */}
              <div className="pt-2 border-t border-black/10 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-[#5B4734]">
                  PALET FRAME
                </span>

                <p className="text-[10px] text-[#7A6451]">
                  Pilih satu palet untuk menerapkan semua warna frame, atau atur tiap warna di bawah.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_PALETTES.map((palette) => {
                    const isSelected =
                      (config.frameAccentColor || '#144DFF') === palette.accent1 &&
                      (config.frameSecondaryAccent || '#FFB51C') === palette.accent2 &&
                      (config.frameTertiaryAccent || '#12A52A') === palette.accent3 &&
                      (config.frameCardBgColor || '#FFFFFF') === palette.bgCard;
                    return (
                      <button
                        key={palette.name}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          onUpdateConfig({
                            studioMode: 'frame_video',
                            frameAccentColor: palette.accent1,
                            frameSecondaryAccent: palette.accent2,
                            frameTertiaryAccent: palette.accent3,
                            frameCardBgColor: palette.bgCard,
                            generateTrigger: Date.now(),
                          })
                        }
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'bg-[#760D1C] text-[#F5F0E4] border-[#760D1C]'
                            : 'bg-white/80 text-[#2F2525] border-[#E7D4AE] hover:border-[#760D1C]'
                        }`}
                      >
                        <span className="text-[11px] font-bold">{palette.name}</span>
                        <span className="flex items-center gap-1 shrink-0" aria-hidden="true">
                          {[palette.accent1, palette.accent2, palette.accent3, palette.bgCard].map((color) => (
                            <span
                              key={color}
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Aksen 1 */}
                  <div className="p-2 rounded-lg bg-white/70 border border-[#E7D4AE]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#3E2916]">
                      <label htmlFor="frame-accent-1">AKSEN FRAME 1</label>
                      <span className="font-mono">{config.frameAccentColor || '#144DFF'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="frame-accent-1"
                        type="color"
                        value={config.frameAccentColor || '#144DFF'}
                        onChange={(e) =>
                          onUpdateConfig({ frameAccentColor: e.target.value, generateTrigger: Date.now() })
                        }
                        className="w-8 h-7 rounded cursor-pointer border border-[#ADC4D1]"
                        aria-label="Pilih warna aksen frame pertama"
                      />
                      <span className="text-[10px] text-[#7A6451]">Ornamen & garis</span>
                    </div>
                  </div>

                  {/* Aksen 2 */}
                  <div className="p-2 rounded-lg bg-white/70 border border-[#E7D4AE]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#3E2916]">
                      <label htmlFor="frame-accent-2">AKSEN FRAME 2</label>
                      <span className="font-mono">{config.frameSecondaryAccent || '#FFB51C'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="frame-accent-2"
                        type="color"
                        value={config.frameSecondaryAccent || '#FFB51C'}
                        onChange={(e) =>
                          onUpdateConfig({ frameSecondaryAccent: e.target.value, generateTrigger: Date.now() })
                        }
                        className="w-8 h-7 rounded cursor-pointer border border-[#ADC4D1]"
                        aria-label="Pilih warna aksen frame kedua"
                      />
                      <span className="text-[10px] text-[#7A6451]">Detail & garis aksen</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Aksen 3 */}
                  <div className="p-2 rounded-lg bg-white/70 border border-[#E7D4AE]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#3E2916]">
                      <label htmlFor="frame-accent-3">AKSEN FRAME 3</label>
                      <span className="font-mono">{config.frameTertiaryAccent || '#12A52A'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="frame-accent-3"
                        type="color"
                        value={config.frameTertiaryAccent || '#12A52A'}
                        onChange={(e) =>
                          onUpdateConfig({ frameTertiaryAccent: e.target.value, generateTrigger: Date.now() })
                        }
                        className="w-8 h-7 rounded cursor-pointer border border-[#ADC4D1]"
                        aria-label="Pilih warna aksen frame ketiga"
                      />
                      <span className="text-[10px] text-[#7A6451]">Warna tambahan frame</span>
                    </div>
                  </div>

                  {/* Warna Latar Kartu */}
                  <div className="p-2 rounded-lg bg-white/70 border border-[#E7D4AE]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#3E2916]">
                      <label htmlFor="frame-card-bg">LATAR FRAME</label>
                      <span className="font-mono">{config.frameCardBgColor || '#FFFFFF'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="frame-card-bg"
                        type="color"
                        value={config.frameCardBgColor || '#FFFFFF'}
                        onChange={(e) =>
                          onUpdateConfig({ frameCardBgColor: e.target.value, generateTrigger: Date.now() })
                        }
                        className="w-8 h-7 rounded cursor-pointer border border-[#ADC4D1]"
                        aria-label="Pilih warna latar frame"
                      />
                      <span className="text-[10px] text-[#7A6451]">Permukaan logo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PENGATURAN UKURAN & BAYANGAN (SCALE & GLOW) */}
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-[#3E2916] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#760D1C]" />
                  <span>UKURAN & EFEK BAYANGAN</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#760D1C] text-[#E7D4AE] hover:bg-[#460C12] text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSvg ? 'TERSALIN!' : svgCopyFailed ? 'GAGAL MENYALIN' : 'SALIN KODE SVG'}</span>
                </button>
              </div>

              {/* Slider Ukuran Watermark (70% - 130%) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#3E2916]">
                  <span>UKURAN WATERMARK (18.75% KANVAS)</span>
                  <span className="font-mono text-[#760D1C] font-bold">
                    {Math.round((config.frameWatermarkScale || 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={config.frameWatermarkScale || 1.0}
                  onChange={(e) =>
                    onUpdateConfig({
                      frameWatermarkScale: parseFloat(e.target.value),
                      generateTrigger: Date.now(),
                    })
                  }
                  className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[#7A6451] font-mono">
                  <span>70%</span>
                  <span>100% (STANDAR)</span>
                  <span>130%</span>
                </div>
              </div>

              {/* Slider Glow / Bayangan */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#3E2916]">
                  <span>INTENSITAS BAYANGAN & GLOW</span>
                  <span className="font-mono text-[#760D1C] font-bold">
                    {Math.round((config.frameGlowIntensity ?? 0.7) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.0}
                  step={0.05}
                  value={config.frameGlowIntensity ?? 0.7}
                  onChange={(e) =>
                    onUpdateConfig({
                      frameGlowIntensity: parseFloat(e.target.value),
                      generateTrigger: Date.now(),
                    })
                  }
                  className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Reusable frame variations */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-[#3E2916] flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-[#760D1C]" />
                  <span>{WATERMARK_VARIATIONS.length} GAYA FRAME WATERMARK</span>
                </span>
                <span className="text-[10px] font-bold text-[#760D1C] bg-white/70 px-2 py-0.5 rounded border border-[#E7D4AE]">
                  {WATERMARK_VARIATIONS.length} GAYA
                </span>
              </div>
              <p className="text-[10px] text-[#5B4734] leading-relaxed">
                Pilih bentuk template. Logo bawaan NKE × UNP dapat diganti dengan logo Anda.
              </p>

              <div className="grid grid-cols-3 gap-1.5 mt-1 p-2 rounded-xl bg-[#202B3A] border border-[#445267]">
                {(() => {
                  const frameToneOptions = {
                    accent1: config.frameAccentColor || '#144DFF',
                    accent2: config.frameSecondaryAccent || '#FFB51C',
                    accent3: config.frameTertiaryAccent || '#12A52A',
                    bgCard: config.frameCardBgColor || '#FFFFFF',
                  };
                  const activeFrameLogos = (config.frameLogos || []).filter((logo) => logo.enabled && logo.url);

                  return WATERMARK_VARIATIONS.map((fs, idx) => {
                    const isSelected = config.frameStyle === fs.id;
                    const numStr = String(idx + 1).padStart(2, '0');
                    const svgMarkup = generateWatermarkSvgString(fs.id, frameToneOptions, activeFrameLogos);

                    return (
                      <button
                        key={fs.id}
                        type="button"
                        aria-pressed={isSelected}
                        title={fs.desc}
                        onClick={() => {
                          onUpdateConfig({
                            studioMode: 'frame_video',
                            frameStyle: fs.id,
                            generateTrigger: Date.now(),
                          });
                        }}
                        className={`p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-[#344356] border-[#FFB51C] text-[#F5F0E4] ring-1 ring-[#FFB51C] shadow-md'
                            : 'bg-[#2C3948] border-[#445267] text-[#F5F0E4] hover:bg-[#37465A]'
                        }`}
                      >
                        <div
                          className="w-full h-9 bg-[#202B3A] rounded-md overflow-hidden border border-black/20 flex items-center justify-end px-1 shadow-inner"
                          dangerouslySetInnerHTML={{
                            __html: svgMarkup.replace('<svg ', '<svg class="h-7 w-auto max-w-full drop-shadow" '),
                          }}
                        />

                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[8px] leading-tight font-bold uppercase tracking-wide line-clamp-2">
                            {numStr}. {fs.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-[#FFB51C] shrink-0" />}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION SET: BACKGROUND STYLE                             */}
        {/* ======================================================== */}
        {activeSection === 'background' && (
          <div className="flex flex-col gap-4">
            {/* 1. Tipe Latar Belakang */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-[#3E2916]">
                TIPE LATAR BELAKANG
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gradient', name: 'Gradasi Sinematik', desc: 'Perpaduan dua warna' },
                  { id: 'solid', name: 'Warna Solid Pekat', desc: 'Satu warna penuh' },
                  { id: 'particles', name: 'Partikel Cahaya', desc: 'Pendar debu sinematik' },
                  { id: 'technical_grid', name: 'Arsitektural Grid', desc: 'Garis CAD teknis' },
                ].map((bg) => {
                  const isSelected =
                    config.backgroundStyle === bg.id ||
                    (bg.id === 'technical_grid' && config.backgroundStyle === 'technical_grid');
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        if (bg.id === 'technical_grid') {
                          onUpdateConfig({
                            backgroundStyle: 'technical_grid',
                            showGrid: true,
                            generateTrigger: Date.now(),
                          });
                        } else if (bg.id === 'particles') {
                          onUpdateConfig({
                            backgroundStyle: 'particles',
                            particleCount: 90,
                            generateTrigger: Date.now(),
                          });
                        } else {
                          onUpdateConfig({
                            backgroundStyle: bg.id as BackgroundStyle,
                            generateTrigger: Date.now(),
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#760D1C] border-[#E7D4AE] text-[#F5F0E4] ring-2 ring-[#E7D4AE] shadow-md'
                          : 'bg-[#EDE2D3] border-[#E7D4AE] text-[#181F2B] hover:bg-[#E2D4C1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold block">{bg.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E7D4AE]" />}
                      </div>
                      <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-[#E7D4AE]' : 'text-[#7A6451]'}`}>
                        {bg.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Background Color Pickers with Quick Swatches */}
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="grid grid-cols-2 gap-3">
                {/* Warna Latar 1 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-[#3E2916]">WARNA LATAR 1</label>
                    <span className="font-mono text-[10px] text-[#760D1C] font-bold">
                      {config.backgroundColor || '#181F2B'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={config.backgroundColor || '#181F2B'}
                      onChange={(e) =>
                        onUpdateConfig({ backgroundColor: e.target.value, generateTrigger: Date.now() })
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-white border border-[#ADC4D1] p-0.5"
                    />
                    <div className="flex items-center gap-1 flex-wrap">
                      {['#181F2B', '#760D1C', '#0B0E14', '#3A0E14', '#F5F0E4'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          title={c}
                          onClick={() => onUpdateConfig({ backgroundColor: c, generateTrigger: Date.now() })}
                          className={`w-5 h-5 rounded-full border ${
                            (config.backgroundColor || '#181F2B') === c
                              ? 'ring-2 ring-[#760D1C] scale-110 border-white'
                              : 'border-black/20'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warna Latar 2 */}
                <div className={`flex flex-col gap-1.5 ${config.backgroundStyle === 'solid' ? 'opacity-40' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-[#3E2916]">
                      WARNA LATAR 2 {config.backgroundStyle === 'solid' && '(Gradasi)'}
                    </label>
                    <span className="font-mono text-[10px] text-[#760D1C] font-bold">
                      {config.backgroundSecondaryColor || '#3A0E14'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      disabled={config.backgroundStyle === 'solid'}
                      value={config.backgroundSecondaryColor || '#3A0E14'}
                      onChange={(e) =>
                        onUpdateConfig({ backgroundSecondaryColor: e.target.value, generateTrigger: Date.now() })
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-white border border-[#ADC4D1] p-0.5 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1 flex-wrap">
                      {['#3A0E14', '#181F2B', '#760D1C', '#070D19', '#E7D4AE'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          disabled={config.backgroundStyle === 'solid'}
                          title={c}
                          onClick={() => onUpdateConfig({ backgroundSecondaryColor: c, generateTrigger: Date.now() })}
                          className={`w-5 h-5 rounded-full border ${
                            (config.backgroundSecondaryColor || '#3A0E14') === c
                              ? 'ring-2 ring-[#760D1C] scale-110 border-white'
                              : 'border-black/20'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Sorot Lampu Spotlight */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#181F2B] uppercase">SOROT LAMPU SPOTLIGHT</span>
                  <span className="text-[10px] text-[#7A6451]">Matikan untuk menghapus pendaran di tengah latar</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.spotlightEnabled === true}
                  aria-label="Aktifkan sorot lampu spotlight"
                  onClick={() =>
                    onUpdateConfig({
                      spotlightEnabled: !config.spotlightEnabled,
                      generateTrigger: Date.now(),
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.spotlightEnabled ? 'bg-[#760D1C]' : 'bg-[#C2B097]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.spotlightEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.spotlightEnabled && (
                <div className="flex flex-col gap-2.5 mt-2 pt-2 border-t border-black/10">
                  {/* Intensitas Sorot */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3E2916]">
                      <span>INTENSITAS CAHAYA SOROT</span>
                      <span className="font-mono text-[#760D1C]">
                        {((config.spotlightIntensity ?? 0.65) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={config.spotlightIntensity ?? 0.65}
                      onChange={(e) =>
                        onUpdateConfig({
                          spotlightIntensity: parseFloat(e.target.value),
                          generateTrigger: Date.now(),
                        })
                      }
                      className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                    />
                  </div>

                  {/* Radius Sorot */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3E2916]">
                      <span>JANGKAUAN / RADIUS SOROT</span>
                      <span className="font-mono text-[#760D1C]">
                        {(config.spotlightRadius ?? 70)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={130}
                      step={5}
                      value={config.spotlightRadius ?? 70}
                      onChange={(e) =>
                        onUpdateConfig({
                          spotlightRadius: parseInt(e.target.value),
                          generateTrigger: Date.now(),
                        })
                      }
                      className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                    />
                  </div>

                  {/* Pilihan Warna Sorot */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#3E2916]">WARNA PENDARAN</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { name: 'Warm Sand', hex: '#E7D4AE' },
                        { name: 'Putih Murni', hex: '#FFFFFF' },
                        { name: 'Cyan Tech', hex: '#38BDF8' },
                        { name: 'Sunset Amber', hex: '#F59E0B' },
                        { name: 'Burgundy', hex: '#760D1C' },
                      ].map((sc) => (
                        <button
                          key={sc.hex}
                          type="button"
                          title={sc.name}
                          onClick={() =>
                            onUpdateConfig({ spotlightColor: sc.hex, generateTrigger: Date.now() })
                          }
                          className={`w-5 h-5 rounded-full border ${
                            (config.spotlightColor || config.secondaryColor || '#E7D4AE') === sc.hex
                              ? 'ring-2 ring-[#760D1C] scale-110 border-white'
                              : 'border-black/20'
                          }`}
                          style={{ backgroundColor: sc.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Color Tone Grading */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#181F2B]">TONE WARNA (COLOR GRADING)</span>
                <span className="text-[10px] font-mono text-[#760D1C] font-bold uppercase">
                  {config.colorTone || 'none'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_TONE_OPTIONS.map((tone) => {
                  const isSelected = (config.colorTone || 'none') === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => onUpdateConfig({ colorTone: tone.id, generateTrigger: Date.now() })}
                      className={`p-2 rounded-lg border text-left text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#760D1C] border-[#E7D4AE] text-[#F5F0E4] ring-1 ring-[#E7D4AE] shadow-sm'
                          : 'bg-white border-[#E7D4AE] text-[#181F2B] hover:bg-[#F5F0E4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: tone.preview }}
                          />
                          <span className="truncate">{tone.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E7D4AE] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION SET: TEXT STYLE (ONLY IN MULTI LOGO & VIDEO TITLE)*/}
        {/* ======================================================== */}
        {activeSection === 'text' && (
          <div className="flex flex-col gap-4">
            {currentMode === 'video_title' ? (
              <>
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <label className="text-xs font-bold uppercase text-[#3E2916]">JUDUL ATAS (TOP TITLE)</label>
                  <input
                    type="text"
                    value={config.titleTop || ''}
                    onChange={(e) => onUpdateConfig({ titleTop: e.target.value, generateTrigger: Date.now() })}
                    placeholder="Judul pembuka (opsional)"
                    className="w-full px-2.5 py-1.5 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">UKURAN</label>
                      <input
                        type="number"
                        value={config.titleTopSize || 22}
                        onChange={(e) => onUpdateConfig({ titleTopSize: parseInt(e.target.value) || 22, generateTrigger: Date.now() })}
                        className="w-full px-2 py-1 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">WARNA</label>
                      <input
                        type="color"
                        value={config.titleTopColor || '#E7D4AE'}
                        onChange={(e) => onUpdateConfig({ titleTopColor: e.target.value, generateTrigger: Date.now() })}
                        className="w-full h-7 rounded cursor-pointer bg-white border border-[#ADC4D1]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <label className="text-xs font-bold uppercase text-[#3E2916]">JUDUL UTAMA (MAIN TITLE)</label>
                  <textarea
                    rows={2}
                    value={config.titleMain || ''}
                    onChange={(e) => onUpdateConfig({ titleMain: e.target.value, generateTrigger: Date.now() })}
                    placeholder="Judul utama video"
                    className="w-full px-2.5 py-1.5 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">UKURAN</label>
                      <input
                        type="number"
                        value={config.titleMainSize || 48}
                        onChange={(e) => onUpdateConfig({ titleMainSize: parseInt(e.target.value) || 48, generateTrigger: Date.now() })}
                        className="w-full px-2 py-1 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">WARNA</label>
                      <input
                        type="color"
                        value={config.titleMainColor || '#FFFFFF'}
                        onChange={(e) => onUpdateConfig({ titleMainColor: e.target.value, generateTrigger: Date.now() })}
                        className="w-full h-7 rounded cursor-pointer bg-white border border-[#ADC4D1]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <label className="text-xs font-bold uppercase text-[#3E2916]">JUDUL BAWAH (BOTTOM TITLE)</label>
                  <input
                    type="text"
                    value={config.titleBottom || ''}
                    onChange={(e) => onUpdateConfig({ titleBottom: e.target.value, generateTrigger: Date.now() })}
                    placeholder="Keterangan tambahan (opsional)"
                    className="w-full px-2.5 py-1.5 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">UKURAN</label>
                      <input
                        type="number"
                        value={config.titleBottomSize || 18}
                        onChange={(e) => onUpdateConfig({ titleBottomSize: parseInt(e.target.value) || 18, generateTrigger: Date.now() })}
                        className="w-full px-2 py-1 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5B4734]">WARNA</label>
                      <input
                        type="color"
                        value={config.titleBottomColor || '#ADC4D1'}
                        onChange={(e) => onUpdateConfig({ titleBottomColor: e.target.value, generateTrigger: Date.now() })}
                        className="w-full h-7 rounded cursor-pointer bg-white border border-[#ADC4D1]"
                      />
                    </div>
                  </div>
                </div>

                {/* PENGATURAN DURASI TAYANG VIDEO TITLE */}
                <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-[#3E2916] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#760D1C]" />
                      <span>DURASI TAYANG VIDEO TITLE</span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded bg-[#760D1C] text-[#E7D4AE] font-mono font-bold text-xs">
                      {(config.videoTitleDuration || config.duration || 5.0).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="12.0"
                    step="0.5"
                    value={config.videoTitleDuration || config.duration || 5.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateConfig({ videoTitleDuration: val, duration: val, generateTrigger: Date.now() });
                    }}
                    className="w-full accent-[#760D1C] h-2 bg-[#D5C2AA] rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-[#5B4734] uppercase mr-1">Pilihan Cepat:</span>
                    {[3.0, 4.0, 5.0, 6.0, 8.0, 10.0].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => onUpdateConfig({ videoTitleDuration: d, duration: d, generateTrigger: Date.now() })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          (config.videoTitleDuration || config.duration) === d
                            ? 'bg-[#760D1C] text-[#E7D4AE] border-[#760D1C] shadow-sm font-black'
                            : 'bg-white hover:bg-[#F5F0E4] text-[#3E2916] border-[#E7D4AE]'
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <label className="text-xs font-bold uppercase text-[#3E2916]">JUDUL UTAMA KONSORSIUM BUMPER</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => onUpdateConfig({ title: e.target.value, generateTrigger: Date.now() })}
                    placeholder="NUSA JAYA WISWAKHARMAN, KSO"
                    className="w-full px-2.5 py-1.5 rounded bg-white border border-[#ADC4D1] text-xs text-[#181F2B]"
                  />
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <label className="text-xs font-bold uppercase text-[#3E2916]">PILIHAN FONT TYPOGRAPHY</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateConfig({ fontFamily: f.id, generateTrigger: Date.now() })}
                        className={`p-2 rounded-lg border text-left text-xs font-bold transition-all ${
                          config.fontFamily === f.id
                            ? 'bg-[#760D1C] border-[#E7D4AE] text-[#F5F0E4] ring-1 ring-[#E7D4AE]'
                            : 'bg-white border-[#E7D4AE] text-[#181F2B] hover:bg-[#F5F0E4]'
                        }`}
                        style={{ fontFamily: f.id }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#EDE2D3] border border-[#E7D4AE]">
                  <span className="text-xs font-bold uppercase text-[#181F2B]">PRESET WARNA TEKS</span>
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_COLOR_PRESETS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => onUpdateConfig({ primaryColor: color.hex, titleColor: color.hex, generateTrigger: Date.now() })}
                        className={`p-1.5 rounded border flex items-center gap-1.5 text-[10px] font-bold ${
                          config.primaryColor === color.hex ? 'border-[#760D1C] bg-white ring-2 ring-[#760D1C]' : 'border-[#E7D4AE] bg-[#F5F0E4]'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />
                        <span className="truncate">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

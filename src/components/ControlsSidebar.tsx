import React, { useState } from 'react';
import {
  Film,
  Type,
  Layers,
  Sparkles,
  Upload,
  Check,
  Sun,
  Grid,
  Circle,
  Cpu,
  RotateCcw,
  Sliders,
  Palette,
  Volume2,
  Tv,
  Box,
  Compass,
  Zap,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  BumperConfig,
  StudioMode,
  LogoCountMode,
  BumperThemeId,
  AudioThemeId,
  BackgroundStyle,
  TransitionStyle,
  TitleTransitionStyle,
  FrameBackgroundMode,
  ColorTone,
  SingleLogoAnimation,
} from '../types/bumper';
import { audioEngine } from '../utils/audioEngine';
import { BUMPER_PRESETS } from '../data/presets';
import { WATERMARK_VARIATIONS } from '../utils/watermarkTemplates';

interface ControlsSidebarProps {
  config: BumperConfig;
  onUpdateConfig: (partial: Partial<BumperConfig>) => void;
  onOpenAIModal: () => void;
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
  { name: 'Emas Sinematik', hex: '#DF9B35' },
  { name: 'Electric Cyan', hex: '#38BDF8' },
  { name: 'Emerald NKE', hex: '#10B981' },
  { name: 'Kuning Amber', hex: '#F59E0B' },
  { name: 'Titanium Silver', hex: '#CBD5E1' },
];

const COLOR_TONE_OPTIONS: { id: ColorTone; name: string; preview: string; desc: string }[] = [
  { id: 'none', name: 'Natural / Asli', preview: '#94A3B8', desc: 'Tanpa filter warna tambahan' },
  { id: 'warm_cinematic', name: 'Warm Cinematic', preview: '#F59E0B', desc: 'Kehangatan emas sinematik' },
  { id: 'cool_tech', name: 'Cool Tech (Cyan)', preview: '#0284C7', desc: 'Nuansa biru korporat futuristik' },
  { id: 'cyber_neon', name: 'Cyber Neon', preview: '#06B6D4', desc: 'Gradasi cyan & magenta modern' },
  { id: 'emerald_signature', name: 'Emerald NKE', preview: '#10B981', desc: 'Kombinasi hijau & emas khas' },
  { id: 'sunset_amber', name: 'Sunset Amber', preview: '#F97316', desc: 'Pendaran senja dramatis' },
  { id: 'noir_luxe', name: 'Noir Luxe', preview: '#D4AF37', desc: 'Monokromatik kontras tinggi dengan aksen emas' },
];

export const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  config,
  onUpdateConfig,
  onOpenAIModal,
  lang,
}) => {
  const currentMode = config.studioMode || 'bumper_logo';
  const [generateFeedback, setGenerateFeedback] = useState<boolean>(false);

  // File upload handler for single logo
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
            scale: 1.25,
          },
          customLogoUrl: dataUrl,
          icon: 'custom',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Dynamic slot upload handler for multi logo slots
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
          onUpdateConfig({ bumperLogos: nextLogos });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Add a new bumper logo slot
  const handleAddBumperLogo = () => {
    const cur = config.bumperLogos || [];
    const newSlot = {
      id: `bumper_logo_${Date.now()}`,
      enabled: true,
      name: `Logo ${cur.length + 1}`,
      url: '',
      scale: 1,
    };
    onUpdateConfig({ bumperLogos: [...cur, newSlot] });
  };

  // Remove a bumper logo slot
  const handleRemoveBumperLogo = (index: number) => {
    const cur = [...(config.bumperLogos || [])];
    if (cur.length > 1) {
      cur.splice(index, 1);
      onUpdateConfig({ bumperLogos: cur });
    }
  };

  // Dynamic slot upload handler for Frame Video logo slots
  const handleFrameLogoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const nextLogos = [...(config.frameLogos || [])];
        if (nextLogos[index]) {
          nextLogos[index] = {
            ...nextLogos[index],
            url: dataUrl,
            name: file.name,
            enabled: true,
          };
          onUpdateConfig({ frameLogos: nextLogos });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Add a new frame video logo slot
  const handleAddFrameLogo = () => {
    const cur = config.frameLogos || [];
    const newSlot = {
      id: `frame_logo_${Date.now()}`,
      enabled: true,
      name: `Logo ${cur.length + 1}`,
      url: '',
      scale: 1,
    };
    onUpdateConfig({ frameLogos: [...cur, newSlot] });
  };

  // Remove a frame video logo slot
  const handleRemoveFrameLogo = (index: number) => {
    const cur = [...(config.frameLogos || [])];
    if (cur.length > 1) {
      cur.splice(index, 1);
      onUpdateConfig({ frameLogos: cur });
    }
  };

  // Custom background image upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateConfig({
          backgroundStyle: 'custom_image',
          customBackgroundUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Custom Title Emblem upload
  const handleTitleEmblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateConfig({
          titleEmblemUrl: dataUrl,
          titleEmblemEnabled: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate / Apply Changes handler
  const handleGenerateClick = () => {
    onUpdateConfig({ generateTrigger: Date.now() });
    setGenerateFeedback(true);
    setTimeout(() => {
      setGenerateFeedback(false);
    }, 2400);
  };

  return (
    <div className="flex flex-col bg-neutral-900/90 border border-neutral-800/90 rounded-2xl overflow-hidden shadow-2xl w-full">
      {/* ===================================================================== */}
      {/* TOP 3 PRIMARY MENU TABS                                               */}
      {/* 1. Bumper Logo  |  2. Video Title  |  3. Frame Video Logo             */}
      {/* ===================================================================== */}
      <div className="p-2.5 bg-neutral-950/90 border-b border-neutral-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            {lang === 'id' ? 'Pilih Menu Sidebar' : 'Sidebar Menu'}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono font-medium">Editor Video Effect</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateConfig({ studioMode: 'bumper_logo' })}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              currentMode === 'bumper_logo'
                ? 'bg-neutral-800 text-cyan-300 border border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-neutral-800/80'
            }`}
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="truncate w-full text-center">1. Bumper Logo</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateConfig({ studioMode: 'video_title' })}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              currentMode === 'video_title'
                ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-neutral-800/80'
            }`}
          >
            <Type className="w-4 h-4 text-amber-400" />
            <span className="truncate w-full text-center">2. Video Title</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateConfig({ studioMode: 'frame_video' })}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              currentMode === 'frame_video'
                ? 'bg-neutral-800 text-emerald-300 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20'
                : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-neutral-800/80'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="truncate w-full text-center">3. Frame Video</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MENU 1: BUMPER LOGO CONTROLS                                          */}
      {/* ===================================================================== */}
      {currentMode === 'bumper_logo' && (
        <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {/* Sub-mode Selector: a. Multiple Logo vs b. Single Logo */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-300">
              {lang === 'id' ? 'Pilih Tipe Logo Bumper:' : 'Logo Bumper Mode:'}
            </label>
            <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 gap-1">
              <button
                type="button"
                onClick={() => onUpdateConfig({ logoCountMode: 'single' })}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  config.logoCountMode === 'single'
                    ? 'bg-neutral-800 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                b. Single Logo (Hero Center)
              </button>
              <button
                type="button"
                onClick={() => onUpdateConfig({ logoCountMode: 'multiple' })}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  config.logoCountMode === 'multiple'
                    ? 'bg-neutral-800 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                a. Multiple Logo (2 Logo)
              </button>
            </div>
          </div>

          {/* 1. SINGLE LOGO CONTROLS */}
          {config.logoCountMode === 'single' ? (
            <div className="flex flex-col gap-4">
              {/* Single Logo Upload / Preset */}
              <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="text-xs font-bold text-neutral-200">
                  {lang === 'id' ? 'Add Logo (Single Logo):' : 'Single Logo Settings:'}
                </span>

                <div className="flex items-center gap-3 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="w-14 h-14 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    <img
                      src={config.singleLogo?.url || '/assets/aistudio/LOGO_WM_NKE_R3_c1d75e16.png'}
                      alt="Single Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-xs font-semibold text-neutral-200">
                      {config.singleLogo?.name || 'Nusa Konstruksi Enjiniring'}
                    </span>
                    <label className="w-fit px-3 py-1 text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg cursor-pointer border border-neutral-700">
                      <Upload className="w-3 h-3 inline mr-1" />
                      Upload Logo Baru
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSingleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Logo Scale Slider (Composure Smooth & Tidak Kebesaran) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-400">Ukuran Logo Center</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {(config.singleLogoScale || 1.25).toFixed(2)}x (Composure Ideal)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="2.2"
                    step="0.05"
                    value={config.singleLogoScale || 1.25}
                    onChange={(e) => onUpdateConfig({ singleLogoScale: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Skala seimbang dan elegan di tengah, kemudian bergeser mulus ke kiri.
                  </span>
                </div>
              </div>

              {/* Pilihan Effect Transisi Single Logo (Menggantikan Gambar 3 Sesuai Arahan) */}
              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Pilihan Effect Transisi Single Logo:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    {
                      id: 'nke_triangles_assemble',
                      label: 'Segitiga Bergantian (NKE Iconic)',
                      desc: 'Segitiga hijau, biru, dan kuning muncul bertahap, menyatu, glow, lalu geser kiri.',
                    },
                    {
                      id: 'smooth_zoom_flare',
                      label: 'Smooth Zoom & Flare Sweep',
                      desc: 'Transisi skalatis halus dengan sapuan cahaya anamorphic horizontal.',
                    },
                    {
                      id: 'flip_3d_reveal',
                      label: '3D Isometric Flip & Shimmer',
                      desc: 'Putaran 3 dimensi dengan aksen pendar neon futuristik.',
                    },
                    {
                      id: 'elastic_snap_pulse',
                      label: 'Elastic Snap & Shockwave Ring',
                      desc: 'Logo memantul elastis ke posisi dengan gelombang cincin energi.',
                    },
                    {
                      id: 'matrix_scan_reveal',
                      label: 'Digital Matrix Scan Reveal',
                      desc: 'Sapuan laser scanline vertikal dari atas ke bawah secara futuristik.',
                    },
                    {
                      id: 'line_draw',
                      label: 'I. Garis lalu warna',
                      desc: 'Kontur logo digambar lebih dulu dengan garis bercahaya, lalu warna aslinya muncul.',
                    },
                    {
                      id: 'line_pen',
                      label: 'J. Satu pena',
                      desc: 'Satu garis menggambar kontur secara berurutan seperti pena tanpa terangkat.',
                    },
                    {
                      id: 'line_neon',
                      label: 'K. Neon',
                      desc: 'Kontur bercahaya neon digambar sebelum logo tampil dengan warna aslinya.',
                    },
                    {
                      id: 'line_only',
                      label: 'L. Garis saja',
                      desc: 'Logo diubah menjadi line art; garis yang sudah tergambar tetap terlihat.',
                    },
                    {
                      id: 'line_fill',
                      label: 'M. Isi naik',
                      desc: 'Setelah kontur selesai, warna logo naik dari bawah hingga terisi penuh.',
                    },
                    {
                      id: 'line_echo',
                      label: 'N. Garis gema',
                      desc: 'Garis bayangan yang lebih besar mengikuti kontur utama sebelum logo muncul.',
                    },
                    {
                      id: 'line_glitch',
                      label: 'O. Glitch',
                      desc: 'Irisan logo bergeser singkat lalu menyatu kembali dengan bersih.',
                    },
                    {
                      id: 'line_blur',
                      label: 'P. Blur ke fokus',
                      desc: 'Logo muncul dari blur lembut dan berhenti tajam pada ukuran normal.',
                    },
                    {
                      id: 'line_zoom',
                      label: 'Q. Zoom punch',
                      desc: 'Logo datang dari dekat dengan hentakan halus dan cincin kejutan.',
                    },
                    {
                      id: 'line_slice',
                      label: 'R. Mask slice',
                      desc: 'Potongan horizontal bergantian meluncur masuk hingga membentuk logo.',
                    },
                    {
                      id: 'line_pixel',
                      label: 'S. Pixel assemble',
                      desc: 'Kotak-kotak logo berkumpul bertahap ke posisi akhir.',
                    },
                    {
                      id: 'line_dust',
                      label: 'T. Dust assemble',
                      desc: 'Partikel berwarna bergerak dari luar dan menyusun logo.',
                    },
                    {
                      id: 'line_liquid',
                      label: 'U. Liquid fill',
                      desc: 'Logo terisi dari bawah dengan permukaan cairan yang bergerak halus.',
                    },
                    {
                      id: 'line_dots',
                      label: 'V. Dot trace',
                      desc: 'Titik-titik cahaya berjalan mengikuti kontur sebelum logo muncul.',
                    },
                  ].map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({
                          singleLogoTransition: tr.id as SingleLogoAnimation,
                          singleLogoAnimation: tr.id as SingleLogoAnimation,
                        })
                      }
                      className={`p-2 rounded-xl border text-left transition-all ${
                        (config.singleLogoTransition || config.singleLogoAnimation || 'nke_triangles_assemble') === tr.id
                          ? 'bg-neutral-800 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-500/30'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-neutral-200 block">{tr.label}</span>
                      <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">{tr.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Title & Typography for Single Logo (Opsional) */}
              <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="text-xs font-bold text-neutral-200">
                  Judul Samping Logo (Opsional):
                </span>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => onUpdateConfig({ title: e.target.value })}
                  placeholder="(Opsional) Default: NUSA KONSTRUKSI ENJINIRING"
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />

                {/* Font Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Pilihan Font</label>
                  <select
                    value={config.bumperTitleFont || config.fontFamily || 'Plus Jakarta Sans'}
                    onChange={(e) => onUpdateConfig({ bumperTitleFont: e.target.value, fontFamily: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Color Presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400">Pilihan Warna Font</label>
                  <div className="flex items-center gap-2">
                    {FONT_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onUpdateConfig({ titleColor: c.hex })}
                        className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                          (config.titleColor || '#FFFFFF') === c.hex ? 'ring-2 ring-cyan-400 border-white' : 'border-neutral-700'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={config.titleColor || '#FFFFFF'}
                      onChange={(e) => onUpdateConfig({ titleColor: e.target.value })}
                      className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer p-0 ml-1"
                      title="Custom Color"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 2. MULTIPLE LOGO CONTROLS (DYNAMIC LOGOS - WITH MORE LOGO BUTTON) */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    Add Logo (Multiple Logo):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBumperLogo}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Tambah Logo</span>
                  </button>
                </div>

                {(config.bumperLogos || []).map((slot, idx) => (
                  <div
                    key={slot.id || `slot_${idx}`}
                    className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => {
                          const next = [...(config.bumperLogos || [])];
                          next[idx] = { ...next[idx], enabled: e.target.checked };
                          onUpdateConfig({ bumperLogos: next });
                        }}
                        className="w-4 h-4 rounded accent-cyan-400 cursor-pointer shrink-0"
                      />
                      <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                        {slot.url ? (
                          <img src={slot.url} alt={slot.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono">L{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-neutral-200 truncate">
                          {slot.name || `Logo ${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {slot.enabled ? 'Aktif di Bumper' : 'Dinonaktifkan'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg cursor-pointer border border-neutral-700">
                        <Upload className="w-3 h-3 inline mr-1" />
                        Ganti
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlotLogoUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                      {(config.bumperLogos || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBumperLogo(idx)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pilihan Effect Transisi Bumper (Multiple Logo) */}
              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Pilihan Effect Transisi Bumper:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'slide_left', label: 'Slide Left & Judul' },
                    { id: 'slide_up', label: 'Slide Up & Judul' },
                    { id: 'cinematic_zoom', label: 'Cinematic Zoom' },
                    { id: 'dissolve_flare', label: 'Dissolve & Flare' },
                  ].map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => onUpdateConfig({ transitionStyle: tr.id as TransitionStyle })}
                      className={`p-2 text-center rounded-xl border text-[11px] font-bold transition-all ${
                        (config.transitionStyle || 'slide_left') === tr.id
                          ? 'bg-neutral-800 border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-500/30'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Title (Sub-judul dihilangkan, judul opsional) */}
              <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="text-xs font-bold text-neutral-200">
                  Add Title (Opsional):
                </span>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => onUpdateConfig({ title: e.target.value })}
                  placeholder="(Opsional) Contoh: NUSA JAYA WISWAKHARMAN, KSO"
                  className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />

                {/* Font Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Pilihan Font</label>
                  <select
                    value={config.bumperTitleFont || config.fontFamily || 'Outfit'}
                    onChange={(e) => onUpdateConfig({ bumperTitleFont: e.target.value, fontFamily: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Color Presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400">Pilihan Warna Font</label>
                  <div className="flex items-center gap-2">
                    {FONT_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onUpdateConfig({ titleColor: c.hex })}
                        className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                          (config.titleColor || '#FFFFFF') === c.hex ? 'ring-2 ring-cyan-400 border-white' : 'border-neutral-700'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={config.titleColor || '#FFFFFF'}
                      onChange={(e) => onUpdateConfig({ titleColor: e.target.value })}
                      className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer p-0 ml-1"
                      title="Custom Color"
                    />
                  </div>
                </div>

                <span className="text-[10px] text-neutral-500">
                  Sub-judul telah ditiadakan. Kosongkan judul jika hanya ingin menampilkan logo di tengah.
                </span>
              </div>
            </div>
          )}

          {/* COMMON: TONE WARNA (COLOR GRADING) */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              Tone Warna (Color Grading)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => onUpdateConfig({ colorTone: tone.id })}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    (config.colorTone || 'none') === tone.id
                      ? 'bg-neutral-800 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-500/30'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tone.preview }} />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-bold truncate text-neutral-200">{tone.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* COMMON: PILIHAN BACKGROUND (VARIATIF & BERFUNGSI) */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200">
              Pilihan Background (Variatif & Berfungsi):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'gradient', label: 'Gradasi Sinematik' },
                { id: 'solid', label: 'Background Polos' },
                { id: 'technical_grid', label: 'Grid CAD Teknikal' },
                { id: 'radial_glow', label: 'Spotlight Bulatan' },
                { id: 'cyber_hex', label: 'Cyber Hex Mesh' },
                { id: 'hologram_lines', label: 'Hologram Line' },
                { id: 'custom_image', label: 'Upload Foto' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => onUpdateConfig({ backgroundStyle: bg.id as BackgroundStyle })}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold transition-all ${
                    (config.backgroundStyle || 'gradient') === bg.id
                      ? 'bg-neutral-800 border-cyan-400 text-cyan-300'
                      : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>

            {/* Quick solid color selector if solid */}
            {config.backgroundStyle === 'solid' && (
              <div className="flex items-center gap-2 p-2 bg-neutral-900 rounded-xl border border-neutral-800 mt-1">
                <span className="text-[10px] text-neutral-400">Pilih Warna:</span>
                {[
                  { name: 'Pure Black', hex: '#000000' },
                  { name: 'Dark Navy', hex: '#08101E' },
                  { name: 'Titanium Slate', hex: '#121212' },
                  { name: 'Deep Sapphire', hex: '#0B192C' },
                  { name: 'White Clean', hex: '#FFFFFF' },
                ].map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    onClick={() => onUpdateConfig({ backgroundColor: s.hex })}
                    className="w-5 h-5 rounded-full border border-neutral-700 transition-transform hover:scale-110"
                    style={{ backgroundColor: s.hex }}
                    title={s.name}
                  />
                ))}
              </div>
            )}

            {/* Custom Background Upload */}
            {config.backgroundStyle === 'custom_image' && (
              <label className="flex items-center justify-center gap-2 p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold text-cyan-300 cursor-pointer hover:bg-neutral-800">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto Background Sendiri</span>
                <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MENU 2: VIDEO TITLE CONTROLS                                          */}
      {/* Sesuai Permintaan: Judul Atas, Utama, Bawah (Opsional) + Ukuran Font  */}
      {/* ===================================================================== */}
      {currentMode === 'video_title' && (
        <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {/* Emblem Atas (Opsional) */}
          <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">
                Logo / Emblem Atas (Opsional):
              </span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ titleEmblemEnabled: !config.titleEmblemEnabled })}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  config.titleEmblemEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {config.titleEmblemEnabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            {config.titleEmblemEnabled && (
              <div className="flex items-center gap-3 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
                <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <Compass className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-semibold text-neutral-200">
                    Pohon Hayat IKN (Emas Vektor)
                  </span>
                  <label className="w-fit px-2.5 py-1 text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg cursor-pointer border border-neutral-700">
                    <Upload className="w-3 h-3 inline mr-1" />
                    Ganti Emblem Custom
                    <input type="file" accept="image/*" onChange={handleTitleEmblemUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 3 JUDUL: ATAS, UTAMA, BAWAH + PENGATURAN FONT, UKURAN, WARNA & JARAK */}
          <div className="flex flex-col gap-4 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200">
              Pengaturan 3 Judul (Semua Bersifat Opsional):
            </span>

            {/* Pilihan Font Global untuk Video Title */}
            <div className="flex flex-col gap-1.5 pb-2 border-b border-neutral-800">
              <label className="text-[11px] text-neutral-400">Pilihan Font Tipografi</label>
              <select
                value={config.titleFont || config.fontFamily || 'Plus Jakarta Sans'}
                onChange={(e) => onUpdateConfig({ titleFont: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Jarak Vertikal Antar Judul (Solusi Gambar 4: Bebas Atur Jarak) */}
            <div className="flex flex-col gap-1.5 pb-2 border-b border-neutral-800">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-neutral-300 font-bold">Jarak Vertikal Antar Judul</span>
                <span className="text-amber-400 font-mono font-bold">
                  {config.videoTitleSpacing !== undefined ? config.videoTitleSpacing : 22}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="2"
                value={config.videoTitleSpacing !== undefined ? config.videoTitleSpacing : 22}
                onChange={(e) => onUpdateConfig({ videoTitleSpacing: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-neutral-500">
                Otomatis merapat harmonis saat salah satu judul dikosongkan tanpa rongga kosong berlebih.
              </span>
            </div>

            {/* 1. Judul Atas (Overline) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-cyan-400 font-bold">1. Judul Atas (Opsional)</label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Ukuran: {config.titleTopSize || 20}px
                </span>
              </div>
              <input
                type="text"
                value={config.titleTop || ''}
                onChange={(e) => onUpdateConfig({ titleTop: e.target.value })}
                placeholder="Misal: SIMULASI KONSTRUKSI (Bisa dikosongkan)"
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
              <input
                type="range"
                min="14"
                max="36"
                step="1"
                value={config.titleTopSize || 20}
                onChange={(e) => onUpdateConfig({ titleTopSize: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              {/* Warna Judul Atas */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-neutral-400 mr-1">Warna:</span>
                {FONT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateConfig({ titleTopColor: c.hex })}
                    className={`w-4 h-4 rounded-full border ${
                      (config.titleTopColor || '#38BDF8') === c.hex ? 'ring-2 ring-cyan-400 border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={config.titleTopColor || '#38BDF8'}
                  onChange={(e) => onUpdateConfig({ titleTopColor: e.target.value })}
                  className="w-4 h-4 rounded-full bg-transparent border-0 cursor-pointer p-0 ml-1"
                />
              </div>
            </div>

            {/* 2. Judul Utama (Headline) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-850">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-white font-bold">2. Judul Utama (Opsional)</label>
                <span className="text-[10px] text-amber-400 font-mono">
                  Ukuran: {config.titleMainSize || 48}px
                </span>
              </div>
              <input
                type="text"
                value={config.titleMain || ''}
                onChange={(e) => onUpdateConfig({ titleMain: e.target.value })}
                placeholder="Misal: PEMBANGUNAN HUNIAN VERTIKAL NEGARA"
                className="w-full px-3 py-2 text-xs font-bold bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
              <input
                type="range"
                min="28"
                max="72"
                step="2"
                value={config.titleMainSize || 48}
                onChange={(e) => onUpdateConfig({ titleMainSize: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              {/* Warna Judul Utama */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-neutral-400 mr-1">Warna:</span>
                {FONT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateConfig({ titleMainColor: c.hex })}
                    className={`w-4 h-4 rounded-full border ${
                      (config.titleMainColor || '#FFFFFF') === c.hex ? 'ring-2 ring-amber-400 border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={config.titleMainColor || '#FFFFFF'}
                  onChange={(e) => onUpdateConfig({ titleMainColor: e.target.value })}
                  className="w-4 h-4 rounded-full bg-transparent border-0 cursor-pointer p-0 ml-1"
                />
              </div>
            </div>

            {/* Pill Tag Badge (Opsional, e.g. TIPE 65) */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-850">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-amber-400 font-semibold">Tag Badge Kotak (Opsional)</label>
                <input
                  type="checkbox"
                  checked={config.titleBadgeEnabled}
                  onChange={(e) => onUpdateConfig({ titleBadgeEnabled: e.target.checked })}
                  className="w-3.5 h-3.5 accent-amber-400"
                />
              </div>
              {config.titleBadgeEnabled && (
                <input
                  type="text"
                  value={config.titleBadgeText}
                  onChange={(e) => onUpdateConfig({ titleBadgeText: e.target.value })}
                  placeholder="Misal: TIPE 65"
                  className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            {/* 3. Judul Bawah (Footer) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-850">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-cyan-400 font-bold">3. Judul Bawah (Opsional)</label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Ukuran: {config.titleBottomSize || 18}px
                </span>
              </div>
              <input
                type="text"
                value={config.titleBottom || ''}
                onChange={(e) => onUpdateConfig({ titleBottom: e.target.value })}
                placeholder="Misal: DI IBU KOTA NUSANTARA"
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
              <input
                type="range"
                min="14"
                max="32"
                step="1"
                value={config.titleBottomSize || 18}
                onChange={(e) => onUpdateConfig({ titleBottomSize: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              {/* Warna Judul Bawah */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-neutral-400 mr-1">Warna:</span>
                {FONT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateConfig({ titleBottomColor: c.hex })}
                    className={`w-4 h-4 rounded-full border ${
                      (config.titleBottomColor || '#38BDF8') === c.hex ? 'ring-2 ring-cyan-400 border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={config.titleBottomColor || '#38BDF8'}
                  onChange={(e) => onUpdateConfig({ titleBottomColor: e.target.value })}
                  className="w-4 h-4 rounded-full bg-transparent border-0 cursor-pointer p-0 ml-1"
                />
              </div>
            </div>
          </div>

          {/* TONE WARNA FOR VIDEO TITLE */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              Tone Warna (Color Grading)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => onUpdateConfig({ colorTone: tone.id })}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    (config.colorTone || 'none') === tone.id
                      ? 'bg-neutral-800 border-amber-400 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tone.preview }} />
                  <span className="text-[11px] font-bold truncate text-neutral-200">{tone.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BACKGROUND UNTUK VIDEO TITLE */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200">
              Pilihan Background:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'technical_grid', label: 'Grid CAD (Resmi)' },
                { id: 'solid', label: 'Polos Solid' },
                { id: 'gradient', label: 'Gradasi Sinematik' },
                { id: 'radial_glow', label: 'Spotlight Bulatan' },
                { id: 'cyber_hex', label: 'Cyber Hex Mesh' },
                { id: 'hologram_lines', label: 'Hologram Line' },
                { id: 'custom_image', label: 'Upload Foto' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onUpdateConfig({ backgroundStyle: b.id as BackgroundStyle })}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                    (config.backgroundStyle || 'technical_grid') === b.id
                      ? 'bg-neutral-800 border-amber-400 text-amber-300'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MENU 3: FRAME VIDEO LOGO CONTROLS                                     */}
      {/* Sesuai Permintaan: Hanya Pojok Kanan Atas, Format PNG, + More Logo    */}
      {/* ===================================================================== */}
      {currentMode === 'frame_video' && (
        <div className="p-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {/* Position Banner: Strictly Top-Right */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Posisi Difokuskan Hanya Di Pojok Kanan Atas
            </span>
            <p className="text-[11px] text-neutral-300 leading-tight">
              Format ekspor otomatis berformat <strong>PNG Transparan Alpha Channel</strong>. Siap langsung ditumpuk (overlay watermark) pada video editor Anda.
            </p>
          </div>

          {/* 3.A. ADD LOGO (DYNAMIC LOGOS - WITH MORE LOGO BUTTON) */}
          <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200">
                Add Logo (Frame Video Overlay):
              </span>
              <button
                type="button"
                onClick={handleAddFrameLogo}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>+ Tambah Logo</span>
              </button>
            </div>

            {(config.frameLogos || []).map((slot, idx) => (
              <div
                key={slot.id || `f_slot_${idx}`}
                className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) => {
                      const next = [...(config.frameLogos || [])];
                      next[idx] = { ...next[idx], enabled: e.target.checked };
                      onUpdateConfig({ frameLogos: next });
                    }}
                    className="w-4 h-4 rounded accent-emerald-400 cursor-pointer shrink-0"
                  />
                  <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {slot.url ? (
                      <img src={slot.url} alt={slot.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">F{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-neutral-200 truncate">
                      {slot.name || `Logo ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {slot.enabled ? 'Tampil di Pojok Kanan' : 'Disembunyikan'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded-lg cursor-pointer border border-neutral-700">
                    <Upload className="w-3 h-3 inline mr-1" />
                    Ganti
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFrameLogoUpload(idx, e)}
                      className="hidden"
                    />
                  </label>
                  {(config.frameLogos || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFrameLogo(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 3.B. PILIHAN STYLE FRAME (POJOK KANAN ATAS BLENDED & FUTURISTIK) */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200">
              Pilihan Style Frame Pojok Kanan Atas:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {WATERMARK_VARIATIONS.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdateConfig({ frameStyle: style.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    config.frameStyle === style.id
                      ? 'bg-neutral-800 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/40'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-200 block">{style.name}</span>
                  <span className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TONE WARNA FOR FRAME */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              Tone Warna (Color Grading)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => onUpdateConfig({ colorTone: tone.id })}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    (config.colorTone || 'none') === tone.id
                      ? 'bg-neutral-800 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tone.preview }} />
                  <span className="text-[11px] font-bold truncate text-neutral-200">{tone.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3.C. PILIHAN BACKGROUND MODE */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-200">
              Pilihan Background Mode:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'transparent', label: 'Transparan (Alpha)', desc: 'Untuk ditumpuk di CapCut/Premiere (PNG)' },
                { id: 'solid', label: 'Background Polos', desc: 'Warna solid pekat' },
                { id: 'simulated_video', label: 'Simulasi Video', desc: 'Pratinjau dengan footage latar' },
                { id: 'gradient', label: 'Gradasi Halus', desc: 'Nuansa sapphire sinematik' },
              ].map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => onUpdateConfig({ frameBackgroundMode: bm.id as FrameBackgroundMode })}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    config.frameBackgroundMode === bm.id
                      ? 'bg-neutral-800 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/40'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-200 block">{bm.label}</span>
                  <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">{bm.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOMBOL GENERATE DI SISI BAWAH (STICKY FOOTER DISISI BAWAH)            */}
      {/* ===================================================================== */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={handleGenerateClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-extrabold text-neutral-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 hover:from-cyan-300 hover:via-teal-200 hover:to-amber-200 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-neutral-950 text-neutral-950" />
          <span>⚡ GENERATE / TERAPKAN EFEK VIDEO</span>
        </button>

        {generateFeedback ? (
          <div className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] animate-in fade-in duration-150">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Perubahan berhasil diterapkan! Animasi diputar ulang.</span>
          </div>
        ) : (
          <span className="text-[10px] text-center text-neutral-400">
            Klik tombol Generate untuk menerapkan semua perubahan & memutar ulang animasi
          </span>
        )}
      </div>
    </div>
  );
};

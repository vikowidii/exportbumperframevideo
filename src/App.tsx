import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LeftNavigation, LeftNavSection } from './components/LeftNavigation';
import { CenterPlayer } from './components/CenterPlayer';
import { ChooseInspector } from './components/ChooseInspector';
import { ExportModal } from './components/ExportModal';
import { BumperConfig, StudioMode } from './types/bumper';
import { WATERMARK_VARIATIONS } from './utils/watermarkTemplates';

const WORKSPACE_STORAGE_KEY = 'bumpercraft.workspace.v1';
const WORKSPACE_VERSION = 8;

interface SavedWorkspace {
  version: number;
  config: BumperConfig;
  activeSection: LeftNavSection;
}

const VALID_SECTIONS: LeftNavSection[] = [
  'logo',
  'background',
  'text',
  'effects',
  'audio',
  'frame_style',
];

const INITIAL_CONFIG: BumperConfig = {
  // 3 Primary Studio Modes: 'bumper_logo' | 'video_title' | 'frame_video'
  studioMode: 'bumper_logo',

  // 1. Bumper Logo Settings
  logoCountMode: 'single',
  bumperLogos: [
    { id: 'logo1', enabled: true, name: 'PT Nusa Konstruksi Enjiniring', url: '/assets/aistudio/kso_nke_hd.png', scale: 1 },
    { id: 'logo2', enabled: true, name: 'PT Jaya Konstruksi', url: '/assets/aistudio/kso_jaya_hd.png', scale: 1 },
  ],
  singleLogo: {
    id: 'single1',
    enabled: true,
    name: 'PT Nusa Konstruksi Enjiniring',
    url: '/assets/aistudio/kso_nke_hd.png',
    scale: 1.25,
  },
  singleLogoAnimation: 'puzzle_assemble',
  singleLogoTransition: 'puzzle_assemble',
  singleLogoScale: 1.25,
  singleLogoShowTitle: false,
  singleLogoTitle: 'PT Nusa Konstruksi Enjiniring, Tbk',
  singleLogoTitleColor: '#FFFFFF',
  singleLogoTitleFont: 'Plus Jakarta Sans',
  singleLogoTitleSize: 28,
  singleLogoSubtitle: '',
  logoHaloEnabled: true,
  logoHaloIntensity: 0.6,
  title: 'NUSA JAYA WISWAKHARMAN, KSO',
  subtitle: '',
  tagline: '',
  titleColor: '#FFFFFF',
  bumperTitleFont: 'Outfit',

  // 2. Video Title Screen Settings
  titleTop: '',
  titleTopSize: 22,
  titleTopColor: '#DFCEB5',
  titleMain: '',
  titleMainSize: 48,
  titleMainColor: '#FFFFFF',
  titleBottom: '',
  titleBottomSize: 18,
  titleBottomColor: '#98AFC3',
  titleFont: 'Plus Jakarta Sans',
  videoTitleSpacing: 22,
  titleBadgeText: '',
  titleBadgeEnabled: false,
  titleBadgeBgColor: '#DFCEB5',
  titleEmblemEnabled: true,
  titleEmblemUrl: '',
  titleLogoMode: 'single',
  titleLogoScale: 1.0,
  titleLogoGlow: false,
  titleLogos: [
    { id: 't_logo1', enabled: true, name: 'PT Nusa Konstruksi Enjiniring', url: '/assets/aistudio/kso_nke_hd.png', scale: 1 },
    { id: 't_logo2', enabled: true, name: 'PT Jaya Konstruksi', url: '/assets/aistudio/kso_jaya_hd.png', scale: 1 },
    { id: 't_logo3', enabled: true, name: 'PT Wiswakharman', url: '/assets/aistudio/kso_wiswa_hd.png', scale: 1 },
  ],
  titleTransition: 'fade_slide',

  // 3. Frame Video Logo Overlay Settings
  frameStyle: 'klasik',
  framePosition: 'top_right',
  frameBackgroundMode: 'slate',
  frameGlowIntensity: 0.7,
  frameBorderRadius: 10,
  frameWatermarkScale: 1.0,
  frameLogos: [],
  frameAccentColor: '#144DFF',
  frameSecondaryAccent: '#FFB51C',
  frameTertiaryAccent: '#12A52A',
  frameCardBgColor: '#FFFFFF',

  // Color Tone
  colorTone: 'none',

  // Theming & Backgrounds
  theme: 'kso_corporate',
  aspectRatio: '16:9',
  duration: 5.5,
  bumperDuration: 5.5,
  videoTitleDuration: 5.0,
  fps: 60,
  primaryColor: '#FFFFFF',
  secondaryColor: '#DFCEB5',
  accentColor: '#98AFC3',
  backgroundColor: '#181F2B',
  backgroundSecondaryColor: '#3A0E14',
  backgroundStyle: 'gradient',
  spotlightEnabled: false,
  spotlightIntensity: 0.65,
  spotlightRadius: 70,
  spotlightSoftness: 0.75,
  spotlightYOffset: 0,
  spotlightPulseSpeed: 1.0,
  futuristicEffect: 'none',
  laserScanline: false,
  cyberHexMesh: false,
  hologramLines: false,
  lightStreaks: false,
  showGrid: true,
  gridOpacity: 0.04,
  fontFamily: 'Outfit',
  fontSize: 1.0,
  letterSpacing: 3,
  icon: 'kso',
  customLogoUrl: '/assets/aistudio/LOGO_KSO_HD_vektor_edcea276.png',
  ksoLogoMode: 'hd_vector',
  transitionStyle: 'slide_left',
  showPartnerLabels: false,
  particleCount: 45,
  particleColor: '#DFCEB5',
  motionSpeed: 1.0,
  vignette: false,
  filmGrain: false,
  letterbox: false,
  anamorphicFlare: false,
  audioTheme: 'none',
  soundEnabled: false,
  soundVolume: 0,
};

function loadSavedWorkspace(): SavedWorkspace {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!stored) {
      return { version: WORKSPACE_VERSION, config: INITIAL_CONFIG, activeSection: 'logo' };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Format pengaturan tersimpan tidak valid.');
    }

    const saved = parsed as Partial<SavedWorkspace>;
    const config = { ...INITIAL_CONFIG, ...(saved.config || {}) };
    if ((saved.version || 1) < 2) {
      config.spotlightEnabled = false;
    }
    if ((saved.version || 1) < 4) {
      config.titleLogoGlow = false;
    }
    if ((saved.version || 1) < 5) {
      config.anamorphicFlare = false;
    }
    if ((saved.version || 1) < 6) {
      config.vignette = false;
    }
    if (config.frameAccentColor === '#5667E8') config.frameAccentColor = '#144DFF';
    if (config.frameSecondaryAccent === '#E7A74E') config.frameSecondaryAccent = '#FFB51C';
    if (config.frameTertiaryAccent === '#3BAA84') config.frameTertiaryAccent = '#12A52A';
    const legacyFrameStyles: Record<string, BumperConfig['frameStyle']> = {
      frame_minimal: 'minimal',
      frame_corner: 'segitigasudut',
      frame_double_line: 'ganda',
      frame_wave_band: 'ombak',
      frame_bracket: 'bingkai',
      frame_split_accent: 'birumuda',
    };
    const migratedFrameStyle = legacyFrameStyles[config.frameStyle] ?? config.frameStyle;
    config.frameStyle = WATERMARK_VARIATIONS.some((variation) => variation.id === migratedFrameStyle)
      ? migratedFrameStyle
      : 'klasik';
    if (config.titleTop === 'SIMULASI KONSTRUKSI') config.titleTop = '';
    if (config.titleMain === 'PEMBANGUNAN HUNIAN VERTIKAL NEGARA') config.titleMain = '';
    if (config.titleBottom === 'DI IBU KOTA NUSANTARA') config.titleBottom = '';
    if (
      ['come_from_anywhere', 'particle_trail', 'biometric_scan'].includes(
        config.singleLogoAnimation || ''
      )
    ) {
      config.singleLogoAnimation = 'puzzle_assemble';
      config.singleLogoTransition = 'puzzle_assemble';
    }
    if (['particle_trail', 'biometric_scan'].includes(config.transitionStyle || '')) {
      config.transitionStyle = 'slide_left';
    }
    if (
      ![
        'fade_slide',
        'beam_wipe',
        'kinetic_typography',
        'typewriter',
        'vertical_wipe',
        'soft_scale',
      ].includes(config.titleTransition || '')
    ) {
      config.titleTransition = 'fade_slide';
    }

    return {
      version: WORKSPACE_VERSION,
      config,
      activeSection: VALID_SECTIONS.includes(saved.activeSection as LeftNavSection)
        ? (saved.activeSection as LeftNavSection)
        : 'logo',
    };
  } catch (error) {
    console.error('Pengaturan tersimpan tidak dapat dibaca:', error);
    return { version: WORKSPACE_VERSION, config: INITIAL_CONFIG, activeSection: 'logo' };
  }
}

export default function App() {
  const [initialWorkspace] = useState(loadSavedWorkspace);
  const [config, setConfig] = useState<BumperConfig>(initialWorkspace.config);
  const [activeSection, setActiveSection] = useState<LeftNavSection>(initialWorkspace.activeSection);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const lang: 'id' | 'en' = 'id';
  const [saveFailed, setSaveFailed] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({ version: WORKSPACE_VERSION, config, activeSection } satisfies SavedWorkspace)
      );
      setSaveFailed(false);
    } catch (error) {
      console.error('Pengaturan tidak dapat disimpan di browser:', error);
      setSaveFailed(true);
    }
  }, [config, activeSection]);

  const handleUpdateConfig = (partial: Partial<BumperConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      // Keep mode-specific durations synchronized
      if (partial.bumperDuration !== undefined) {
        if (updated.studioMode === 'bumper_logo') {
          updated.duration = partial.bumperDuration;
        }
      }
      if (partial.videoTitleDuration !== undefined) {
        if (updated.studioMode === 'video_title') {
          updated.duration = partial.videoTitleDuration;
        }
      }
      if (partial.duration !== undefined) {
        if (updated.studioMode === 'bumper_logo') {
          updated.bumperDuration = partial.duration;
        } else if (updated.studioMode === 'video_title') {
          updated.videoTitleDuration = partial.duration;
        }
      }
      return updated;
    });
  };

  const handleSelectSection = (mode: StudioMode, section: LeftNavSection) => {
    setConfig((prev) => {
      let activeDur = prev.duration;
      if (mode === 'bumper_logo') {
        activeDur = prev.bumperDuration || 5.5;
      } else if (mode === 'video_title') {
        activeDur = prev.videoTitleDuration || 5.0;
      }
      return {
        ...prev,
        studioMode: mode,
        duration: activeDur,
      };
    });
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E4] text-[#2F2525] flex flex-col font-sans antialiased">
      {/* 1. TOP NAVBAR HEADER (Full Width, Matching Purple Top Bar in Wireframe) */}
      <Header
        config={config}
        onOpenExport={() => setIsExportModalOpen(true)}
        saveFailed={saveFailed}
      />

      {/* 2. THREE-COLUMN WORKSPACE (Matching Wireframe Columns: Left Nav, Center Player, Right Choose) */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-3 sm:p-4 lg:p-5 flex flex-col">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start flex-1">
          {/* LEFT COLUMN: Categories & Navigation (Wireframe Left Container: 3 Cards) */}
          <section className="xl:col-span-2 w-full min-w-0">
            <LeftNavigation
              config={config}
              onUpdateConfig={handleUpdateConfig}
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              lang={lang}
            />
          </section>

          {/* CENTER COLUMN: Video Viewport, Timeline Scrubber & Controls (Wireframe Center Container) */}
          <section className="xl:col-span-6 w-full min-w-0">
            <CenterPlayer
              config={config}
              onUpdateConfig={handleUpdateConfig}
              lang={lang}
            />
          </section>

          {/* RIGHT COLUMN: CHOOSE Options Inspector (Wireframe Right Container) */}
          <section className="xl:col-span-4 w-full min-w-0">
            <ChooseInspector
              config={config}
              onUpdateConfig={handleUpdateConfig}
              activeSection={activeSection}
              lang={lang}
            />
          </section>
        </div>
      </main>

      {/* MODALS */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        lang={lang}
      />
    </div>
  );
}

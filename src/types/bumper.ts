export type StudioMode = 'bumper_logo' | 'video_title' | 'frame_video';

export type LogoCountMode = 'multiple' | 'single';

export type BumperThemeId =
  | 'kso_corporate'
  | 'kso_cinematic'
  | 'kso_cyber_aurora'
  | 'kso_obsidian_luxe'
  | 'kso_sunset_amber'
  | 'kso_blueprint_cad';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type AudioThemeId =
  | 'sfx_kso_official'
  | 'sfx_cinematic_impact'
  | 'sfx_modern_tech'
  | 'sfx_minimal_tactile'
  | 'lofi_chill'
  | 'lofi_rhodes'
  | 'cinematic'
  | 'custom'
  | 'none';

export type TransitionStyle =
  | 'spin_shrink_up'
  | 'faded'
  | 'letters_falling'
  | 'paint_peel_wind'
  | 'slide_left'
  | 'slide_up'
  | 'particle_trail'
  | 'biometric_scan'
  | 'sequential_slide_left'
  | 'sequential_slide_up'
  | 'sliced_assemble'
  | 'cinematic_zoom';

export type TitleTransitionStyle =
  | 'fade_slide'
  | 'beam_wipe'
  | 'kinetic_typography'
  | 'typewriter'
  | 'vertical_wipe'
  | 'soft_scale';

export type FrameStyle =
  | 'klasik'
  | 'kapsul'
  | 'chevron'
  | 'potong'
  | 'gelombang'
  | 'bar'
  | 'kaca'
  | 'jajar'
  | 'miring'
  | 'segitiga'
  | 'pita'
  | 'tangga'
  | 'lengkung'
  | 'dua'
  | 'kanan'
  | 'bingkai'
  | 'birumuda'
  | 'krem'
  | 'hijaumuda'
  | 'ombak'
  | 'panah'
  | 'minimal'
  | 'titik'
  | 'undakan'
  | 'swoosh'
  | 'tegak'
  | 'gradien'
  | 'ganda'
  | 'segitigasudut'
  | 'lipat';

export type FrameBackgroundMode =
  | 'slate'
  | 'putih'
  | 'video'
  | 'alpha'
  | 'transparent'
  | 'solid'
  | 'simulated_video'
  | 'gradient';

export type FramePosition = 'top_right' | 'top_left' | 'bottom_right' | 'bottom_center' | 'top_bar';

export type KsoLogoMode = 'hd_vector' | 'raster_png';

export type ColorTone =
  | 'none'
  | 'warm_cinematic'
  | 'cool_tech'
  | 'cyber_neon'
  | 'emerald_signature'
  | 'sunset_amber'
  | 'noir_luxe';

export type BackgroundStyle =
  | 'gradient'
  | 'solid'
  | 'radial_glow'
  | 'technical_grid'
  | 'cyber_hex'
  | 'hologram_lines'
  | 'custom_image'
  | 'particles';

export type SingleLogoAnimation =
  | 'spin_shrink_up'
  | 'faded'
  | 'letters_falling'
  | 'paint_peel_wind'
  | 'puzzle_assemble'
  | 'come_from_anywhere'
  | 'particle_trail'
  | 'biometric_scan'
  | 'nke_triangles_assemble'
  | 'smooth_zoom_flare'
  | 'flip_3d_reveal'
  | 'elastic_snap_pulse'
  | 'matrix_scan_reveal'
  | 'cinematic_glint_flare'
  | 'corporate_clean_push'
  | 'minimalist_soft_fade'
  | 'zoom_scale_reveal'
  | 'line_draw'
  | 'line_pen'
  | 'line_neon'
  | 'line_only'
  | 'line_fill'
  | 'line_echo'
  | 'line_glitch'
  | 'line_blur'
  | 'line_zoom'
  | 'line_slice'
  | 'line_pixel'
  | 'line_dust'
  | 'line_liquid'
  | 'line_dots';

export type FuturisticEffectType =
  | 'none'
  | 'laser_scan'
  | 'cyber_hex'
  | 'circuit_matrix'
  | 'hologram_lines'
  | 'light_streaks';

export interface LogoSlot {
  id: string;
  enabled: boolean;
  name: string;
  url: string;
  scale?: number;
}

export interface BumperConfig {
  // Core mode selector
  studioMode: StudioMode;

  // 1. BUMPER LOGO SPECIFICS
  logoCountMode: LogoCountMode;
  bumperLogos: LogoSlot[]; // Dynamic logos
  singleLogo: LogoSlot;
  singleLogoAnimation?: SingleLogoAnimation;
  singleLogoScale?: number; // 0.8 to 2.2 (default ~1.25)
  singleLogoTransition?: SingleLogoAnimation;

  // Text for Bumper (Main title is optional, subtitle removed in single logo, optional in multi logo)
  title: string;
  subtitle: string;
  tagline?: string;
  titleColor?: string;
  bumperTitleFont?: string;
  singleLogoShowTitle?: boolean;
  singleLogoTitle?: string;
  singleLogoTitleColor?: string;
  singleLogoTitleFont?: string;
  singleLogoTitleSize?: number;
  singleLogoSubtitle?: string;
  logoHaloEnabled?: boolean;
  logoHaloIntensity?: number;

  // 2. VIDEO TITLE SPECIFICS (Top, Main, Bottom Titles - all optional with font sizes & colors)
  titleTop: string; // e.g. "SIMULASI KONSTRUKSI"
  titleTopSize: number; // in px (e.g. 18 - 36)
  titleTopColor?: string;
  titleMain: string; // e.g. "PEMBANGUNAN HUNIAN VERTIKAL"
  titleMainSize: number; // in px (e.g. 36 - 76)
  titleMainColor?: string;
  titleBottom: string; // e.g. "DI IBU KOTA NUSANTARA"
  titleBottomSize: number; // in px (e.g. 16 - 32)
  titleBottomColor?: string;
  titleFont: string;
  videoTitleSpacing?: number; // vertical gap in px (default ~24)
  titleCategory?: string; // legacy alias
  titleFooter?: string; // legacy alias

  titleBadgeText: string; // e.g. "TIPE 65"
  titleBadgeEnabled: boolean;
  titleBadgeBgColor?: string;
  titleBadgeTextColor?: string;
  titleEmblemEnabled: boolean;
  titleEmblemUrl: string; // e.g. Tree of life IKN gold emblem or uploaded logo
  titleLogoMode?: 'single' | 'multiple';
  titleLogoScale?: number; // 0.5 to 2.0 (default 1.0)
  titleLogoGlow?: boolean; // toggle golden radial halo
  titleLogos?: LogoSlot[]; // multiple partner logos for Video Title
  titleTransition: TitleTransitionStyle;

  // 3. FRAME VIDEO LOGO SPECIFICS (Strictly Top-Right Corner Overlay)
  frameStyle: FrameStyle;
  framePosition: 'top_right';
  frameBackgroundMode: FrameBackgroundMode;
  frameGlowIntensity: number; // 0 to 1
  frameBorderRadius: number; // in px
  frameLogos: LogoSlot[]; // Dynamic logos inside the frame
  frameAccentColor?: string;
  frameSecondaryAccent?: string;
  frameTertiaryAccent?: string;
  frameCardBgColor?: string;
  frameWatermarkScale?: number;

  // COLOR TONE (Color Grading applied across all modes)
  colorTone: ColorTone;

  // COMMON THEMING & BACKGROUND
  theme: BumperThemeId;
  aspectRatio: AspectRatio;
  duration: number; // in seconds
  bumperDuration?: number; // duration specifically for bumper mode (e.g. 3s - 12s)
  videoTitleDuration?: number; // duration specifically for video title mode (e.g. 2s - 12s)
  fps: 30 | 60;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundSecondaryColor?: string;
  backgroundStyle?: BackgroundStyle;
  customBackgroundUrl?: string;

  // Bulatan Cahaya (Spotlight Circle) Adjustments
  spotlightEnabled?: boolean;
  spotlightIntensity?: number; // 0 to 1.0
  spotlightRadius?: number; // 10 to 150
  spotlightSoftness?: number; // 0.1 to 1.0
  spotlightYOffset?: number; // -30 to +30 %
  spotlightColor?: string;
  spotlightPulseSpeed?: number;

  // Efek Modern & Futuristik
  futuristicEffect?: FuturisticEffectType;
  laserScanline?: boolean;
  cyberHexMesh?: boolean;
  hologramLines?: boolean;
  lightStreaks?: boolean;

  // Coordinate CAD grid
  showGrid?: boolean;
  gridOpacity?: number;

  // Typography
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;

  // Backward compatibility / motion
  icon: string;
  customLogoUrl?: string;
  ksoLogoMode?: KsoLogoMode;
  transitionStyle?: TransitionStyle;
  showPartnerLabels?: boolean;
  particleCount: number;
  particleColor?: string;
  motionSpeed: number;
  vignette: boolean;
  filmGrain: boolean;
  letterbox: boolean;
  anamorphicFlare?: boolean;

  // Audio Synth
  audioTheme: AudioThemeId;
  soundEnabled: boolean;
  soundVolume: number;
  customAudioUrl?: string;
  customAudioName?: string;

  // Re-render / trigger animation replay
  generateTrigger?: number;
}

export interface BumperPreset {
  id: BumperThemeId;
  name: string;
  nameId: string;
  tagline: string;
  description: string;
  category: 'Modern' | 'Cinematic' | 'Executive' | 'Futuristic' | 'Technical';
  defaultTitle: string;
  defaultSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundSecondaryColor?: string;
  spotlightIntensity?: number;
  particleColor?: string;
  fontFamily: string;
  icon: string;
  audioTheme: AudioThemeId;
  duration: number;
}

export interface AIConcept {
  title: string;
  slogan: string;
  themeId: BumperThemeId;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  audioTheme: AudioThemeId;
  description: string;
}

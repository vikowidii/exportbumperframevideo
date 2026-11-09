import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Camera,
  Maximize2,
  Volume2,
  VolumeX,
  Smartphone,
  Tv,
  Square,
  Sparkles,
} from 'lucide-react';
import { BumperConfig, AspectRatio } from '../types/bumper';
import { renderBumperFrame } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { downloadPosterFrame } from '../utils/videoExporter';
import { BUMPER_PRESETS } from '../data/presets';

interface PreviewViewportProps {
  config: BumperConfig;
  onUpdateConfig: (partial: Partial<BumperConfig>) => void;
  lang: 'id' | 'en';
}

export const PreviewViewport: React.FC<PreviewViewportProps> = ({
  config,
  onUpdateConfig,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Time tracking ref for smooth animation loop
  const timeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Aspect ratio display dimensions
  const getCanvasDimensions = useCallback((ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return { width: 720, height: 1280, aspectClass: 'aspect-[9/16] max-h-[560px]' };
      case '1:1':
        return { width: 1080, height: 1080, aspectClass: 'aspect-square max-h-[500px]' };
      case '16:9':
      default:
        return { width: 1920, height: 1080, aspectClass: 'aspect-video max-w-full' };
    }
  }, []);

  const dims = getCanvasDimensions(config.aspectRatio);

  // Render current frame to canvas
  const drawFrame = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderBumperFrame(ctx, canvas.width, canvas.height, config, t);
    },
    [config]
  );

  // Trigger sound effect on playback start
  const playSoundAt = useCallback(
    (timeOffset: number) => {
      if (config.soundEnabled && config.audioTheme !== 'none') {
        audioEngine.play(config.audioTheme, config.soundVolume, timeOffset, config.customAudioUrl);
      }
    },
    [config.soundEnabled, config.audioTheme, config.soundVolume, config.customAudioUrl]
  );

  // Animation Loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlaying && !isScrubbing) {
        let nextTime = timeRef.current + delta;
        const dur = Math.max(1, config.duration);

        if (nextTime >= dur) {
          if (isLooping) {
            nextTime = 0;
            timeRef.current = 0;
            playSoundAt(0);
          } else {
            nextTime = dur;
            setIsPlaying(false);
            audioEngine.stop();
          }
        }

        timeRef.current = nextTime;
        setCurrentTime(nextTime);
        drawFrame(nextTime);
      } else {
        // Redraw current static frame when paused or scrubbing
        drawFrame(timeRef.current);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimestampRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      audioEngine.stop();
    };
  }, [isPlaying, isScrubbing, isLooping, config.duration, drawFrame, playSoundAt]);

  // Replay when Generate button in sidebar is clicked
  useEffect(() => {
    if (config.generateTrigger) {
      timeRef.current = 0;
      setCurrentTime(0);
      drawFrame(0);
      playSoundAt(0);
      setIsPlaying(true);
    }
  }, [config.generateTrigger, drawFrame, playSoundAt]);

  // Handle Play / Pause Toggle
  const togglePlay = () => {
    if (!isPlaying) {
      if (timeRef.current >= config.duration) {
        timeRef.current = 0;
        setCurrentTime(0);
      }
      playSoundAt(timeRef.current);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      audioEngine.stop();
    }
  };

  // Handle Restart
  const handleRestart = () => {
    timeRef.current = 0;
    setCurrentTime(0);
    drawFrame(0);
    playSoundAt(0);
    setIsPlaying(true);
  };

  // Handle Slider Scrubbing
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    timeRef.current = val;
    setCurrentTime(val);
    drawFrame(val);
  };

  // Handle Snapshot PNG Download
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const safeTitle = config.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadPosterFrame(canvas, `poster_${safeTitle}_${config.theme}.png`);
  };

  // Fullscreen canvas
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Viewport Header: Mode Badge, Aspect Ratio & Resolution Info */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {/* Active Studio Mode Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-white">
            <span
              className={`w-2 h-2 rounded-full ${
                config.studioMode === 'video_title'
                  ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                  : config.studioMode === 'frame_video'
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
              }`}
            />
            <span>
              {config.studioMode === 'video_title'
                ? 'Mode 2: Video Title Screen'
                : config.studioMode === 'frame_video'
                ? 'Mode 3: Frame Video Logo'
                : `Mode 1: Bumper Logo (${config.logoCountMode === 'single' ? 'Single' : 'Multi-Logo'})`}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => onUpdateConfig({ aspectRatio: '16:9' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                config.aspectRatio === '16:9'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ aspectRatio: '9:16' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                config.aspectRatio === '9:16'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ aspectRatio: '1:1' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                config.aspectRatio === '1:1'
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-500">
            {dims.width} × {dims.height}px · {config.fps} FPS
          </span>
          <button
            onClick={handleCaptureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-800 transition-colors"
            title={lang === 'id' ? 'Ambil poster frame (PNG)' : 'Capture poster frame (PNG)'}
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'id' ? 'Unduh Foto (PNG)' : 'Snapshot'}</span>
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center p-4 bg-neutral-950 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl min-h-[360px] lg:min-h-[460px]"
      >
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className={`rounded-xl shadow-lg border border-neutral-800/50 object-contain max-w-full ${dims.aspectClass}`}
        />

        {/* Floating Quick Play Overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 backdrop-blur-md shadow-xl transition-all scale-100 hover:scale-105"
            aria-label="Play video preview"
          >
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </button>
        )}
      </div>

      {/* Interactive Timeline & Scrub Controls */}
      <div className="flex flex-col gap-2 p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
        {/* Scrubber slider */}
        <div className="relative flex items-center w-full group">
          <input
            type="range"
            min={0}
            max={config.duration}
            step={0.01}
            value={currentTime}
            onChange={handleSliderChange}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        {/* Playback action row */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold shadow-sm shadow-cyan-500/25 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title={lang === 'id' ? 'Putar dari awal' : 'Restart'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                isLooping
                  ? 'bg-neutral-800 text-cyan-400 border border-cyan-400/30'
                  : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              title={isLooping ? 'Loop aktif' : 'Loop mati'}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-1" />

            <button
              onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                config.soundEnabled
                  ? 'bg-neutral-800 text-emerald-400'
                  : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
              title={config.soundEnabled ? 'Suara aktif' : 'Suara dimatikan'}
            >
              {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Timecode display */}
          <div className="flex items-center gap-2 font-mono tabular-nums text-neutral-300">
            <span className="text-cyan-400 font-semibold">{currentTime.toFixed(2)}s</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{config.duration.toFixed(2)}s</span>
          </div>
        </div>
      </div>

      {/* Curated Bumper Theme Quick-Strip */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold text-neutral-300">
            {lang === 'id' ? 'Pilih Gaya Tema Cepat' : 'Quick Theme Styles'}
          </span>
          <span className="text-cyan-400 font-mono text-[11px]">
            {lang === 'id' ? '6 Tema Sinematik Tersedia' : '6 Cinematic Themes Available'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {BUMPER_PRESETS.map((preset) => {
            const isSelected = config.theme === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onUpdateConfig({
                    theme: preset.id,
                    primaryColor: preset.primaryColor,
                    secondaryColor: preset.secondaryColor,
                    accentColor: preset.accentColor,
                    backgroundColor: preset.backgroundColor,
                    backgroundSecondaryColor: preset.backgroundSecondaryColor,
                    spotlightIntensity: preset.spotlightIntensity,
                    particleColor: preset.particleColor,
                    fontFamily: preset.fontFamily,
                    icon: preset.icon,
                    audioTheme: preset.audioTheme,
                    duration: preset.duration,
                  });
                  timeRef.current = 0;
                  setCurrentTime(0);
                  playSoundAt(0);
                  setIsPlaying(true);
                }}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-neutral-800/90 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/50 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-neutral-200'}`}>
                    {lang === 'id' ? preset.nameId : preset.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/30"
                      style={{ backgroundColor: preset.backgroundColor }}
                      title="Background"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/30"
                      style={{ backgroundColor: preset.secondaryColor }}
                      title="Accent"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 line-clamp-1 leading-snug">
                  {preset.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
  Clock,
  Download,
  Layers,
  Sliders,
  Check,
  Loader2,
} from 'lucide-react';
import { BumperConfig, AspectRatio, FrameBackgroundMode } from '../types/bumper';
import { renderBumperFrame, waitForConfigFonts } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { downloadPosterFrame, exportFramePng, triggerBlobDownload } from '../utils/videoExporter';

interface CenterPlayerProps {
  config: BumperConfig;
  onUpdateConfig: (partial: Partial<BumperConfig>) => void;
  lang: 'id' | 'en';
}

export const CenterPlayer: React.FC<CenterPlayerProps> = ({
  config,
  onUpdateConfig,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isFrameMode = config.studioMode === 'frame_video';
  const [isPlaying, setIsPlaying] = useState<boolean>(!isFrameMode);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [framePngExportError, setFramePngExportError] = useState<string | null>(null);

  // Smooth animation tracking
  const timeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Aspect ratio display dimensions
  const getCanvasDimensions = useCallback((ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return { width: 720, height: 1280, aspectClass: 'aspect-[9/16] max-h-[520px]' };
      case '1:1':
        return { width: 1080, height: 1080, aspectClass: 'aspect-square max-h-[480px]' };
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderBumperFrame(ctx, canvas.width, canvas.height, config, t);
    },
    [config]
  );

  useEffect(() => {
    const redrawWhenAssetsLoad = () => drawFrame(timeRef.current);
    window.addEventListener('canvas-assets-ready', redrawWhenAssetsLoad);
    return () => window.removeEventListener('canvas-assets-ready', redrawWhenAssetsLoad);
  }, [drawFrame]);

  useEffect(() => {
    let cancelled = false;
    waitForConfigFonts(config)
      .then(() => {
        if (!cancelled) drawFrame(timeRef.current);
      })
      .catch((error) => {
        console.error('Font untuk preview tidak dapat dimuat:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [
    config.studioMode,
    config.logoCountMode,
    config.fontFamily,
    config.bumperTitleFont,
    config.singleLogoShowTitle,
    config.singleLogoTitleFont,
    config.titleFont,
    drawFrame,
  ]);

  // Trigger sound effect on playback start
  const playSoundAt = useCallback(
    (timeOffset: number) => {
      if (isFrameMode) return;
      if (config.soundEnabled && config.audioTheme !== 'none') {
        audioEngine.play(config.audioTheme, config.soundVolume, timeOffset, config.customAudioUrl);
      }
    },
    [isFrameMode, config.soundEnabled, config.audioTheme, config.soundVolume, config.customAudioUrl]
  );

  // Animation Loop: Only active when NOT in frame mode (Frame mode is purely static PNG!)
  useEffect(() => {
    if (isFrameMode) {
      drawFrame(1.0);
      audioEngine.stop();
      return;
    }

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
  }, [isFrameMode, isPlaying, isScrubbing, isLooping, config.duration, drawFrame, playSoundAt]);

  // Replay when Triggered or Redraw static frame
  useEffect(() => {
    if (isFrameMode) {
      drawFrame(1.0);
    } else if (config.generateTrigger) {
      timeRef.current = 0;
      setCurrentTime(0);
      drawFrame(0);
      playSoundAt(0);
      setIsPlaying(true);
    }
  }, [isFrameMode, config.generateTrigger, drawFrame, playSoundAt]);

  // Handle Play / Pause Toggle
  const togglePlay = () => {
    if (isFrameMode) return;
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
    if (isFrameMode) return;
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

  // Direct PNG export specifically for Frame Watermark Mode
  const handleDirectFramePngDownload = async (resolution: '1080p' | '4k') => {
    try {
      setIsExportingPng(true);
      setFramePngExportError(null);
      const blob = await exportFramePng(config, resolution);
      const filename = `watermark_overlay_${config.frameStyle || 'klasik'}_${resolution}.png`;
      triggerBlobDownload(blob, filename);
    } catch (err) {
      console.error('PNG watermark tidak dapat diekspor:', err);
      setFramePngExportError(
        err instanceof Error ? err.message : 'PNG watermark gagal diekspor. Silakan coba lagi.'
      );
    } finally {
      setIsExportingPng(false);
    }
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
    <div className="studio-player flex flex-col gap-3.5 w-full min-w-0">
      {/* ======================================================== */}
      {/* 1. TOP BOX: MAIN VIDEO SCREEN VIEWPORT (Wireframe top box) */}
      {/* ======================================================== */}
      <div className="flex flex-col bg-[#F5F0E4] border border-[#ADC4D1] rounded-2xl p-2 sm:p-3 shadow-sm relative overflow-hidden text-[#2F2525]">
        {/* The Canvas Stage */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center bg-[#211A1B] rounded-xl overflow-hidden shadow-inner min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] border border-[#ADC4D1]"
          style={
            isFrameMode && ['transparent', 'alpha'].includes(config.frameBackgroundMode || '')
              ? {
                  backgroundColor: '#FFFFFF',
                  backgroundImage:
                    'linear-gradient(45deg, #D9DDE4 25%, transparent 25%), linear-gradient(-45deg, #D9DDE4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #D9DDE4 75%), linear-gradient(-45deg, transparent 75%, #D9DDE4 75%)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
                }
              : undefined
          }
        >
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className={`rounded-lg object-contain ${dims.aspectClass}`}
          />

          {/* Floating Play Overlay Button When Paused (Only for video modes) */}
          {!isFrameMode && !isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center rounded-full bg-[#760D1C]/80 hover:bg-[#760D1C] text-[#E7D4AE] border-2 border-[#E7D4AE] backdrop-blur-md shadow-2xl transition-all scale-100 hover:scale-105"
              aria-label="Play video preview"
            >
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mt-2 px-3 py-2 bg-[#760D1C] rounded-lg text-[#F5F0E4]">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isFrameMode ? 'bg-[#ADC4D1]' : 'bg-[#E7D4AE] animate-pulse'}`} />
            <span className="font-semibold text-xs sm:text-sm">
              {config.studioMode === 'video_title'
                ? 'Pratinjau: Kartu Judul Video'
                : isFrameMode
                ? `Pratinjau: Watermark · ${config.frameStyle?.toUpperCase() || 'KLASIK'}`
                : `Pratinjau: Bumper Logo · ${config.logoCountMode === 'single' ? 'Satu Logo' : 'Multi-logo'}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#E7D4AE]">
            <span>{dims.width} × {dims.height}px</span>
            <span aria-hidden="true">·</span>
            <span>{isFrameMode ? 'PNG statis' : `${config.fps} FPS`}</span>
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="Layar penuh"
              aria-label="Tampilkan pratinjau layar penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDDLE BOX:                                           */}
      {/* - For Frame Mode: Static PNG Watermark Settings Strip    */}
      {/* - For Video Modes: Interactive Timeline + Duration Control*/}
      {/* ======================================================== */}
      {isFrameMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#E7D4AE] border border-[#ADC4D1] rounded-xl shadow-sm text-[#2F2525]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#17614B] shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-[#17614B] uppercase">
                OVERLAY WATERMARK (PNG STATIS)
              </span>
              <span className="text-xs text-[#584747]">
                Tidak memakai video · Siap tumpuk di CapCut / Premiere / DaVinci
              </span>
            </div>
          </div>

          {/* Preview Background Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#121620] rounded-lg border border-[#ADC4D1]/20">
            <span className="text-xs text-[#E7D4AE] font-bold uppercase px-1">Latar:</span>
            {[
              { id: 'alpha', label: 'Transparan' },
              { id: 'slate', label: 'Dark Slate' },
              { id: 'putih', label: 'Soft Cream' },
            ].map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => onUpdateConfig({ frameBackgroundMode: bg.id as FrameBackgroundMode, generateTrigger: Date.now() })}
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                  (config.frameBackgroundMode || 'slate') === bg.id
                    ? 'bg-[#760D1C] text-[#E7D4AE] border border-[#E7D4AE]'
                    : 'text-[#ADC4D1] hover:text-white'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>

          {/* Scale Slider */}
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#760D1C]" />
            <span className="text-xs font-bold text-[#3E2916] uppercase">Ukuran:</span>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.02}
              value={config.frameWatermarkScale || 1.0}
              onChange={(e) => onUpdateConfig({ frameWatermarkScale: parseFloat(e.target.value), generateTrigger: Date.now() })}
              className="w-24 h-2 accent-[#760D1C] cursor-pointer"
            />
            <span className="font-mono text-sm text-[#181F2B] font-bold">
              {Math.round((config.frameWatermarkScale || 1.0) * 100)}%
            </span>
          </div>
          {framePngExportError && (
            <span role="alert" className="basis-full text-xs font-semibold text-red-700">
              {framePngExportError}
            </span>
          )}
        </div>
      ) : (
        /* Video Mode: Interactive Timeline with Scrubbing + Duration Control */
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#E7D4AE] border border-[#ADC4D1] rounded-xl shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-[#E7D4AE]">
              TIMELINE
            </span>
          </div>

          {/* Range Scrubber Slider */}
          <div className="relative flex-1 min-w-[140px] flex items-center group">
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
              className="w-full h-2 bg-[#121620] rounded-lg appearance-none cursor-pointer accent-[#E7D4AE] focus:outline-none"
            />
          </div>

          {/* Timecode */}
          <div className="font-mono text-xs font-bold text-[#E7D4AE] tabular-nums shrink-0">
            <span className="text-[#F5F0E4]">{currentTime.toFixed(2)}s</span>
            <span className="text-[#ADC4D1] mx-1">/</span>
            <span>{config.duration.toFixed(2)}s</span>
          </div>

          {/* Integrated Duration Control for Bumper and Video Title */}
          <div className="flex items-center gap-1.5 shrink-0 bg-[#121620] px-2.5 py-1 rounded-lg border border-[#ADC4D1]/20">
            <Clock className="w-3.5 h-3.5 text-[#E7D4AE]" />
            <span className="text-[10px] font-mono text-[#E7D4AE] font-bold uppercase">Durasi:</span>
            <input
              type="range"
              min={config.studioMode === 'video_title' ? 2 : 3}
              max={12}
              step={0.5}
              value={config.duration}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (config.studioMode === 'video_title') {
                  onUpdateConfig({ videoTitleDuration: val, duration: val, generateTrigger: Date.now() });
                } else {
                  onUpdateConfig({ bumperDuration: val, duration: val, generateTrigger: Date.now() });
                }
              }}
              className="w-16 h-1.5 accent-[#E7D4AE] cursor-pointer"
              title="Atur durasi video"
            />
            <span className="font-mono text-xs font-bold text-[#F5F0E4] min-w-[28px]">
              {config.duration.toFixed(1)}s
            </span>

            {/* Quick duration pills */}
            <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-1.5">
              {[3, 5, 7, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    if (config.studioMode === 'video_title') {
                      onUpdateConfig({ videoTitleDuration: sec, duration: sec, generateTrigger: Date.now() });
                    } else {
                      onUpdateConfig({ bumperDuration: sec, duration: sec, generateTrigger: Date.now() });
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    Math.round(config.duration) === sec
                      ? 'bg-[#760D1C] text-[#E7D4AE] border border-[#E7D4AE]'
                      : 'bg-[#181F2B] text-[#ADC4D1] hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BOTTOM BOX:                                           */}
      {/* - For Frame Mode: Instant High-Res PNG Download Buttons  */}
      {/* - For Video Modes: Playback Buttons & Unduh Snapshot     */}
      {/* ======================================================== */}
      {isFrameMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#E7D4AE] border border-[#ADC4D1] rounded-xl shadow-sm">
          {/* Aspect Ratio Toggles */}
          <div className="flex items-center gap-1 p-1 bg-[#141A24] rounded-lg border border-[#ADC4D1]/30">
            <span className="text-[10px] text-[#ADC4D1] font-bold uppercase px-1.5">Format:</span>
            <button
              onClick={() => onUpdateConfig({ aspectRatio: '16:9', generateTrigger: Date.now() })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '16:9'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>16:9 Landscape</span>
            </button>
            <button
              onClick={() => onUpdateConfig({ aspectRatio: '9:16', generateTrigger: Date.now() })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '9:16'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16 Reels/Shorts</span>
            </button>
            <button
              onClick={() => onUpdateConfig({ aspectRatio: '1:1', generateTrigger: Date.now() })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '1:1'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>1:1 Square</span>
            </button>
          </div>

          {/* Instant PNG Download Buttons for Frame */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDirectFramePngDownload('1080p')}
              disabled={isExportingPng}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isExportingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>UNDUH PNG 1080P</span>
            </button>

            <button
              onClick={() => handleDirectFramePngDownload('4k')}
              disabled={isExportingPng}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#760D1C] hover:bg-[#460C12] text-[#E7D4AE] rounded-xl border border-[#E7D4AE] text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>UNDUH PNG 4K</span>
            </button>
          </div>
        </div>
      ) : (
        /* Video Mode Bottom Controls */
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#181F2B] border-2 border-[#ADC4D1]/30 rounded-xl shadow-lg">
          {/* Playback Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#E7D4AE] hover:bg-[#F5F0E4] text-[#760D1C] font-black shadow-md shadow-black/40 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#141A24] hover:bg-[#202938] text-[#E7D4AE] border border-[#ADC4D1]/30 transition-colors"
              title="Putar dari awal (Restart)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                isLooping
                  ? 'bg-[#760D1C] text-[#E7D4AE] font-bold border-[#E7D4AE] shadow-sm'
                  : 'bg-[#141A24] text-[#ADC4D1] border-[#ADC4D1]/30 hover:text-white'
              }`}
              title={isLooping ? 'Loop aktif' : 'Loop mati'}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
              className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                config.soundEnabled
                  ? 'bg-[#141A24] text-[#E7D4AE] border-[#E7D4AE]/50'
                  : 'bg-[#141A24] text-[#ADC4D1]/50 border-[#ADC4D1]/20'
              }`}
              title={config.soundEnabled ? 'Suara aktif' : 'Suara dimatikan'}
            >
              {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Aspect Ratio Toggles */}
          <div className="flex items-center gap-1 p-1 bg-[#141A24] rounded-lg border border-[#ADC4D1]/30">
            <button
              onClick={() => onUpdateConfig({ aspectRatio: '16:9' })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '16:9'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>16:9</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ aspectRatio: '9:16' })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '9:16'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ aspectRatio: '1:1' })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                config.aspectRatio === '1:1'
                  ? 'bg-[#E7D4AE] text-[#760D1C] shadow-sm'
                  : 'text-[#ADC4D1] hover:text-[#F5F0E4]'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>1:1</span>
            </button>
          </div>

          {/* Snapshot PNG Download Button */}
          <button
            onClick={handleCaptureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#760D1C] hover:bg-[#460C12] text-[#E7D4AE] rounded-lg border border-[#E7D4AE]/50 text-xs font-bold transition-colors shadow-sm"
            title="Unduh Poster Snapshot PNG"
          >
            <Camera className="w-3.5 h-3.5 text-[#E7D4AE]" />
            <span>UNDUH PNG</span>
          </button>
        </div>
      )}
    </div>
  );
};

import { BumperConfig } from '../types/bumper';
import { renderBumperFrame, waitForConfigFonts, waitForFrameRenderAssets } from './canvasRenderer';
import { audioEngine } from './audioEngine';

export interface ExportOptions {
  resolution: '1080p' | '720p';
  onProgress?: (progress: number, status: string) => void;
}

export async function exportBumperVideo(
  config: BumperConfig,
  options: ExportOptions
): Promise<Blob> {
  const { resolution = '1080p', onProgress } = options;

  // Determine export dimensions according to aspect ratio
  let w = 1920;
  let h = 1080;

  if (config.aspectRatio === '9:16') {
    w = resolution === '1080p' ? 1080 : 720;
    h = resolution === '1080p' ? 1920 : 1280;
  } else if (config.aspectRatio === '1:1') {
    w = resolution === '1080p' ? 1080 : 720;
    h = resolution === '1080p' ? 1080 : 720;
  } else {
    // 16:9
    w = resolution === '1080p' ? 1920 : 1280;
    h = resolution === '1080p' ? 1080 : 720;
  }

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Gagal menginisialisasi canvas context.');
  }

  await waitForConfigFonts(config);

  const fps = config.fps || 60;
  const duration = Math.max(1, config.duration);
  const totalFrames = Math.round(duration * fps);

  // Set up audio destination
  let audioStreamDestination: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;

  if (config.soundEnabled && config.audioTheme !== 'none' && config.soundVolume > 0) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtx();
    audioStreamDestination = audioCtx.createMediaStreamDestination();
  }

  // Capture canvas stream
  const canvasStream = canvas.captureStream(fps);

  // Combine video and audio tracks
  const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (audioStreamDestination) {
    combinedTracks.push(...audioStreamDestination.stream.getAudioTracks());
  }

  const exportStream = new MediaStream(combinedTracks);

  // Select supported mimeType
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser pick default
      }
    }
  }

  const mediaRecorder = new MediaRecorder(exportStream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<Blob>(async (resolve, reject) => {
    mediaRecorder.onerror = (err) => reject(err);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      resolve(blob);
    };

    mediaRecorder.start();

    // Start synthesizing audio into the recorder stream
    if (audioCtx && audioStreamDestination) {
      audioEngine.synthesizeToDestination(
        audioCtx,
        audioStreamDestination,
        config.audioTheme,
        config.soundVolume,
        audioCtx.currentTime
      );
    }

    // Playback and capture frames deterministically
    const frameInterval = 1000 / fps;
    const startTime = performance.now();

    for (let frame = 0; frame <= totalFrames; frame++) {
      const currentTime = (frame / totalFrames) * duration;
      renderBumperFrame(ctx, w, h, config, currentTime);

      const percent = Math.min(100, Math.round((frame / totalFrames) * 100));
      onProgress?.(percent, `Merender frame ${frame}/${totalFrames} (${percent}%)`);

      // Wait for frame interval timing to keep MediaRecorder timestamping accurate
      const targetTime = startTime + frame * frameInterval;
      const delay = Math.max(0, targetTime - performance.now());
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    onProgress?.(100, 'Menyelesaikan enkoding video...');
    await new Promise((r) => setTimeout(r, 400));
    mediaRecorder.stop();
  });
}

/**
 * Trigger browser file download
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Capture high-resolution PNG poster snapshot of the current frame
 */
export function downloadPosterFrame(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * High-Resolution Transparent PNG export specifically for Frame Video Logo overlay
 */
export async function exportFramePng(
  config: BumperConfig,
  resolution: '1080p' | '4k' = '1080p'
): Promise<Blob> {
  let w = 1920;
  let h = 1080;

  if (config.aspectRatio === '9:16') {
    w = resolution === '4k' ? 2160 : 1080;
    h = resolution === '4k' ? 3840 : 1920;
  } else if (config.aspectRatio === '1:1') {
    w = resolution === '4k' ? 2160 : 1080;
    h = resolution === '4k' ? 2160 : 1080;
  } else {
    // 16:9
    w = resolution === '4k' ? 3840 : 1920;
    h = resolution === '4k' ? 2160 : 1080;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gagal menginisialisasi canvas');

  await waitForConfigFonts(config);
  await waitForFrameRenderAssets(config);

  // Render purely the transparent overlay (no checkerboard)
  ctx.clearRect(0, 0, w, h);
  renderBumperFrame(ctx, w, h, { ...config, frameBackgroundMode: 'transparent' }, 1.5);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal mengekspor file PNG overlay'));
    }, 'image/png');
  });
}

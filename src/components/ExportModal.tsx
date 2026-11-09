import React, { useState } from 'react';
import { X, Download, Film, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { BumperConfig } from '../types/bumper';
import { exportBumperVideo, exportFramePng, triggerBlobDownload } from '../utils/videoExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BumperConfig;
  lang: 'id' | 'en';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  lang,
}) => {
  const isFrameMode = config.studioMode === 'frame_video';
  const [resolution, setResolution] = useState<'1080p' | '720p' | '4k'>(isFrameMode ? '1080p' : '1080p');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setErrorMessage(null);
    setExportedBlob(null);

    try {
      if (isFrameMode) {
        setStatusText('Membuat overlay transparan PNG Ultra HD...');
        setProgress(50);
        const blob = await exportFramePng(config, resolution === '4k' ? '4k' : '1080p');
        setProgress(100);
        setExportedBlob(blob);
        const filename = `watermark_overlay_${config.frameStyle || 'klasik'}_${resolution}.png`;
        triggerBlobDownload(blob, filename);
      } else {
        const blob = await exportBumperVideo(config, {
          resolution: resolution === '720p' ? '720p' : '1080p',
          onProgress: (p, msg) => {
            setProgress(p);
            setStatusText(msg);
          },
        });

        setExportedBlob(blob);
        const modePrefix = config.studioMode === 'video_title' ? 'video_title' : 'bumper_logo';
        const safeTitle = (config.studioMode === 'video_title' ? config.titleMain : config.title)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_') || 'video';
        const filename = `${modePrefix}_${safeTitle}_${config.aspectRatio.replace(':', 'x')}.webm`;
        triggerBlobDownload(blob, filename);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err?.message || 'Gagal mengekspor file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReDownload = () => {
    if (!exportedBlob) return;
    if (isFrameMode) {
      const filename = `watermark_overlay_${config.frameStyle || 'klasik'}_${resolution}.png`;
      triggerBlobDownload(exportedBlob, filename);
    } else {
      const modePrefix = config.studioMode === 'video_title' ? 'video_title' : 'bumper_logo';
      const safeTitle = (config.studioMode === 'video_title' ? config.titleMain : config.title)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_') || 'video';
      const filename = `${modePrefix}_${safeTitle}_${config.aspectRatio.replace(':', 'x')}.webm`;
      triggerBlobDownload(exportedBlob, filename);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {isFrameMode ? <ImageIcon className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-white">
                {isFrameMode ? 'Ekspor PNG Frame Overlay (Pojok Kanan Atas)' : (lang === 'id' ? 'Ekspor Hasil Video' : 'Export Video Result')}
              </h3>
              <span className="text-xs text-neutral-400">
                {isFrameMode
                  ? 'Format PNG Transparan Alpha Channel: Siap ditumpuk (overlay) langsung di CapCut, Premiere, & DaVinci'
                  : 'Format MP4 / WebM resolusi tinggi dengan trek audio sinkron'}
              </span>
            </div>
          </div>

          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Export Configuration Options (only if not exporting) */}
        {!isExporting && !exportedBlob && (
          <div className="flex flex-col gap-4">
            {/* Resolution Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300">
                {isFrameMode ? 'Format & Resolusi PNG' : (lang === 'id' ? 'Kualitas Resolusi' : 'Resolution Quality')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    resolution === '1080p'
                      ? 'bg-neutral-800 border-cyan-400 text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-cyan-300">{isFrameMode ? 'PNG 1080p Full HD' : '1080p Full HD'}</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">
                    {isFrameMode ? 'Transparan murni 1920x1080' : 'Ketajaman maksimal untuk YouTube & TV'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution(isFrameMode ? '4k' : '720p')}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    (isFrameMode ? resolution === '4k' : resolution === '720p')
                      ? 'bg-neutral-800 border-cyan-400 text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-cyan-300">{isFrameMode ? 'PNG 4K Ultra HD' : '720p HD'}</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">
                    {isFrameMode ? 'Transparan tajam 3840x2160' : 'Ukuran file ringan & render lebih cepat'}
                  </span>
                </button>
              </div>
            </div>

            {/* Video Specs Summary List */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>{lang === 'id' ? 'Rasio Layar' : 'Aspect Ratio'}</span>
                <span className="font-mono text-neutral-200">{config.aspectRatio}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>{lang === 'id' ? 'Durasi & FPS' : 'Duration & FPS'}</span>
                <span className="font-mono text-neutral-200">
                  {config.duration}s · {config.fps} FPS
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>{lang === 'id' ? 'Trek Audio' : 'Audio Track'}</span>
                <span className="font-mono text-neutral-200">
                  {config.soundEnabled ? config.audioTheme.toUpperCase() : 'MUTED'}
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleStartExport}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-neutral-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Download className="w-4 h-4 text-neutral-950" />
              <span>
                {isFrameMode
                  ? 'Unduh File PNG Transparan (Watermark Pojok Kanan Atas)'
                  : lang === 'id'
                  ? 'Mulai Render Video & Unduh'
                  : 'Start Render Video & Download'}
              </span>
            </button>
          </div>
        )}

        {/* Progress Display while exporting */}
        {isExporting && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">
                {lang === 'id' ? 'Sedang Merender Video Bumper...' : 'Rendering Bumper Video...'}
              </span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">
                {statusText || `${progress}%`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-neutral-800 mt-2">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-2.5 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-neutral-500">
              Jangan tutup jendela ini hingga proses selesai
            </span>
          </div>
        )}

        {/* Success State */}
        {!isExporting && exportedBlob && (
          <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-white">
                {isFrameMode
                  ? lang === 'id'
                    ? 'Watermark PNG Berhasil Diekspor!'
                    : 'Watermark PNG Successfully Exported!'
                  : lang === 'id'
                    ? 'Video Berhasil Diekspor!'
                    : 'Video Successfully Exported!'}
              </span>
              <span className="text-xs text-neutral-400">
                {isFrameMode
                  ? 'PNG transparan siap digunakan dan tersimpan di folder Unduhan (Downloads).'
                  : 'File otomatis tersimpan di folder Unduhan (Downloads) komputer Anda.'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={handleReDownload}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'id' ? 'Unduh Ulang File' : 'Download Again'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                {lang === 'id' ? 'Selesai' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

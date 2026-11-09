import React from 'react';
import { Download } from 'lucide-react';
import { BumperConfig } from '../types/bumper';

interface HeaderProps {
  config: BumperConfig;
  onOpenExport: () => void;
  saveFailed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenExport,
  saveFailed,
}) => {
  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#760D1C] border-b border-[#E7D4AE]/40 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden border border-[#E7D4AE]/70 bg-[#F5F0E4] shrink-0">
          <img
            src="/assets/logo-construction-digital.svg"
            alt="Construction Digital Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#F5F0E4]">
            Studio Bumper &amp; Frame
          </h1>
          <span
            role={saveFailed ? 'status' : undefined}
            aria-label={saveFailed ? 'Penyimpanan lokal gagal; perubahan mungkin tidak tersimpan' : undefined}
            title={saveFailed ? 'Penyimpanan lokal gagal; perubahan mungkin tidak tersimpan' : 'Perubahan tersimpan otomatis'}
            className={`w-2 h-2 rounded-full shrink-0 ${saveFailed ? 'bg-amber-300' : 'bg-emerald-300'}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold tracking-wide text-[#760D1C] bg-[#E7D4AE] hover:bg-[#F5F0E4] border border-white/60 rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">
            {config.studioMode === 'frame_video'
              ? 'EXPORT PNG WATERMARK'
              : 'EXPORT VIDEO (MP4)'}
          </span>
          <span className="sm:hidden">Ekspor</span>
        </button>
      </div>
    </header>
  );
};

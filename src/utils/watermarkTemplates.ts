import { FrameStyle, LogoSlot } from '../types/bumper';

export interface WatermarkVariation {
  id: FrameStyle;
  name: string;
  desc: string;
  decorOffset: number;
}

export const WATERMARK_VARIATIONS: WatermarkVariation[] = [
  { id: 'klasik', name: 'Klasik', desc: 'Lekukan diagonal biru dan emas dari template', decorOffset: 36 },
  { id: 'kapsul', name: 'Kapsul', desc: 'Sudut membulat dengan dua garis kontur', decorOffset: 30 },
  { id: 'chevron', name: 'Garis tiga warna', desc: 'Tiga garis miring biru, emas, dan hijau', decorOffset: 42 },
  { id: 'potong', name: 'Sudut potong', desc: 'Bingkai dengan potongan diagonal dan garis ganda', decorOffset: 50 },
  { id: 'gelombang', name: 'Gelombang', desc: 'Lengkung bawah dengan dua garis aksen', decorOffset: 28 },
  { id: 'bar', name: 'Bar tiga warna', desc: 'Garis tepi dan tiga aksen warna di bagian bawah', decorOffset: 38 },
  { id: 'kaca', name: 'Kartu melayang', desc: 'Panel kartu dengan kontur tipis dan garis dasar', decorOffset: 42 },
  { id: 'jajar', name: 'Jajar genjang', desc: 'Dua bentuk miring dengan garis dasar ganda', decorOffset: 38 },
  { id: 'miring', name: 'Miring naik', desc: 'Panel diagonal dengan aksen biru dan emas', decorOffset: 42 },
  { id: 'segitiga', name: 'Segitiga NKE', desc: 'Aksen segitiga dan garis tiga warna', decorOffset: 46 },
  { id: 'pita', name: 'Pita', desc: 'Pita geometris dengan lipatan dan garis bawah', decorOffset: 38 },
  { id: 'tangga', name: 'Bertingkat', desc: 'Garis kontur bertangga dengan bingkai berlapis', decorOffset: 34 },
  { id: 'lengkung', name: 'Lengkung besar', desc: 'Sudut melengkung lebar dengan garis kontur ganda', decorOffset: 44 },
  { id: 'dua', name: 'Dua kartu', desc: 'Dua bidang logo dengan aksen terpisah', decorOffset: 44 },
  { id: 'kanan', name: 'Tepi kanan', desc: 'Aksen warna vertikal pada ujung kanan panel', decorOffset: 42 },
  { id: 'bingkai', name: 'Bingkai biru', desc: 'Bidang biru dengan panel putih dan garis emas', decorOffset: 36 },
  { id: 'birumuda', name: 'Biru muda', desc: 'Panel biru pucat dengan kontur biru', decorOffset: 46 },
  { id: 'krem', name: 'Krem hangat', desc: 'Bidang krem dengan aksen diagonal hangat', decorOffset: 40 },
  { id: 'hijaumuda', name: 'Hijau muda', desc: 'Panel hijau pucat dengan garis kontur', decorOffset: 46 },
  { id: 'ombak', name: 'Tepi ombak', desc: 'Tepi bergelombang dengan tiga aksen warna', decorOffset: 42 },
  { id: 'panah', name: 'Panah kiri', desc: 'Dua garis chevron pada ujung kiri panel', decorOffset: 42 },
  { id: 'minimal', name: 'Minimalis', desc: 'Panel ringkas dengan garis bawah dua warna', decorOffset: 36 },
  { id: 'titik', name: 'Tiga titik', desc: 'Tiga titik aksen dan satu garis tipis', decorOffset: 38 },
  { id: 'undakan', name: 'Tiga undakan', desc: 'Tiga tingkat garis geometris yang rapi', decorOffset: 42 },
  { id: 'swoosh', name: 'Swoosh', desc: 'Garis lengkung dinamis dengan aksen berlapis', decorOffset: 36 },
  { id: 'tegak', name: 'Tiga garis tegak', desc: 'Tiga garis warna dengan bidang panel bersih', decorOffset: 42 },
  { id: 'gradien', name: 'Gradien biru', desc: 'Panel gradasi dengan aksen diagonal biru dan emas', decorOffset: 40 },
  { id: 'ganda', name: 'Garis ganda', desc: 'Sudut membulat dengan dua garis kontur', decorOffset: 40 },
  { id: 'segitigasudut', name: 'Sudut diagonal', desc: 'Potongan segitiga dengan garis aksen tiga warna', decorOffset: 44 },
  { id: 'lipat', name: 'Sudut terlipat', desc: 'Sudut panel terlipat dengan garis bawah biru', decorOffset: 44 },
];

export interface WatermarkToneOptions {
  accent1?: string;
  accent2?: string;
  accent3?: string;
  bgCard?: string;
}

const FRAME_PATHS: Record<FrameStyle, string> = {
  klasik: '<path d="M9 0H17L35 54 23 28Z" fill="#144DFF"/><path d="M22.5 28 30 60 150 50 35 54Z" fill="#FFB51C"/><path d="M17 0H240V45L35 54Z" fill="#fff"/><path d="M145 49.2 240 45V49.2Z" fill="#144DFF"/>',
  kapsul: '<path d="M14 0H240V50H28A14 14 0 0 1 14 36Z" fill="#fff"/><path d="M14 0V36A14 14 0 0 0 28 50H240" fill="none" stroke="#144DFF" stroke-width="2.6"/><path d="M10.8 0V36.5A17.2 17.2 0 0 0 28 53.7H240" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  chevron: '<path d="M24 0H240V50H40Z" fill="#fff"/><g fill="none" stroke-width="3.4"><path d="M18.5 0 34.5 50" stroke="#144DFF"/><path d="M13 0 29 50" stroke="#FFB51C"/><path d="M7.5 0 23.5 50" stroke="#12A52A"/></g><path d="M40 51.5H240" stroke="#144DFF" stroke-width="2.6"/><path d="M40 54.7H240" stroke="#FFB51C" stroke-width="2.2"/>',
  potong: '<path d="M30 0H240V50H48L30 32Z" fill="#fff"/><path d="M30 0V32L48 50H240" fill="none" stroke="#144DFF" stroke-width="2.8"/><path d="M24.5 0V34.3L46.7 56.5H240" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  gelombang: '<path d="M22 0H240V46C220 52 190 58 160 54C110 46 60 62 22 44Z" fill="#fff"/><path d="M22 44C60 62 110 46 160 54C190 58 220 52 240 46" fill="none" stroke="#144DFF" stroke-width="2.4"/><path d="M22 48C60 66 110 50 160 58C190 62 220 56 240 50" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  bar: '<path d="M36 0H240V47H36Z" fill="#fff"/><rect x="30.5" width="5.5" height="51.4" fill="#144DFF"/><rect x="30.5" y="47" width="119.5" height="4.4" fill="#144DFF"/><rect x="150" y="47" width="52" height="4.4" fill="#FFB51C"/><rect x="202" y="47" width="38" height="4.4" fill="#12A52A"/>',
  kaca: '<rect x="38" y="1" width="198" height="48" rx="10" fill="#fff" fill-opacity=".95" stroke="#144DFF" stroke-width="1"/><path d="M50 49H224" stroke="#FFB51C" stroke-width="2.4" stroke-linecap="round"/>',
  jajar: '<path d="M36 0H240V47H20Z" fill="#fff"/><path d="M28 0H36L20 47H12Z" fill="#144DFF"/><path d="M18 0H26L10 47H2Z" fill="#FFB51C"/><path d="M20 47H240" stroke="#144DFF" stroke-width="2.6"/><path d="M4 50.6H240" stroke="#FFB51C" stroke-width="2.2"/>',
  miring: '<path d="M40 0H240V42L40 52Z" fill="#fff"/><path d="M40 52 240 42V46.2L40 56.2Z" fill="#144DFF"/><path d="M40 56.2 150 50.7V53.4L40 58.9Z" fill="#FFB51C"/><path d="M34 0H40V52L34 56Z" fill="#144DFF"/>',
  segitiga: '<path d="M44 0H240V48H44Z" fill="#fff"/><path d="M20 0H44V24Z" fill="#FFB51C"/><path d="M20 48H44V24Z" fill="#144DFF"/><path d="M44 48H240V51.4H44Z" fill="#12A52A"/><path d="M44 51.4H150V54.2H44Z" fill="#FFB51C"/>',
  pita: '<path d="M26 0H240V50H26L37 25Z" fill="#fff"/><path d="M20 0H26L37 25 26 50H20L31 25Z" fill="#144DFF"/><path d="M26 50H240V53.4H26Z" fill="#144DFF"/><path d="M26 53.4H120V56.4H26Z" fill="#FFB51C"/>',
  tangga: '<path d="M32 0H240V42H120V50H32Z" fill="#fff"/><path d="M32 0V50H120V42H240" fill="none" stroke="#144DFF" stroke-width="2.8"/><path d="M27 0V55H125V47H240" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  lengkung: '<path d="M20 0H240V46H60A40 40 0 0 1 20 6Z" fill="#fff"/><path d="M20 6A40 40 0 0 0 60 46H240" fill="none" stroke="#144DFF" stroke-width="2.6"/><path d="M16.5 6A43.5 43.5 0 0 0 60 49.5H240" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  dua: '<path d="M42 0H96V40A8 8 0 0 1 88 48H50A8 8 0 0 1 42 40Z" fill="#fff"/><path d="M97.5 0H240V40A8 8 0 0 1 232 48H105.5A8 8 0 0 1 97.5 40Z" fill="#fff"/><path d="M46 49.5H92" stroke="#FFB51C" stroke-width="2.6" stroke-linecap="round"/><path d="M102 49.5H236" stroke="#144DFF" stroke-width="2.6" stroke-linecap="round"/>',
  kanan: '<path d="M30 0H232V47H30Z" fill="#fff"/><rect x="24" width="6" height="47" fill="#FFB51C"/><rect x="232" width="3" height="47" fill="#144DFF"/><rect x="235" width="3" height="47" fill="#FFB51C"/><rect x="238" width="2" height="47" fill="#12A52A"/>',
  bingkai: '<path d="M22 0H240V54H22Z" fill="#144DFF"/><path d="M28 0H240V48H28Z" fill="#fff"/><rect x="28" y="50.4" width="212" height="1.6" fill="#FFB51C"/>',
  birumuda: '<path d="M30 0H240V47H44A14 14 0 0 1 30 33Z" fill="#EAF1FF"/><path d="M30 0V33A14 14 0 0 0 44 47H240" fill="none" stroke="#144DFF" stroke-width="3"/><path d="M60 51H150" stroke="#FFB51C" stroke-width="2" stroke-linecap="round"/>',
  krem: '<path d="M14 0H22L36 47H28Z" fill="#FFB51C" transform="translate(-6 0)"/><path d="M8 0H12L26 47H22Z" fill="#144DFF" transform="translate(-2 0)"/><path d="M22 0H240V47H36Z" fill="#FFF6DC"/><path d="M36 47H240" stroke="#FFB51C" stroke-width="2.6" transform="translate(0 1.3)"/>',
  hijaumuda: '<path d="M36 0H240V47H46A10 10 0 0 1 36 37Z" fill="#EAF8ED"/><path d="M36 0V37A10 10 0 0 0 46 47H240" fill="none" stroke="#12A52A" stroke-width="2.8"/><path d="M46 50.8H130" stroke="#FFB51C" stroke-width="2" stroke-linecap="round"/>',
  ombak: '<path d="M30 0H240V47H30C44 38 16 30 30 23C42 15 18 8 30 0Z" fill="#fff"/><path d="M30 47C44 38 16 30 30 23C42 15 18 8 30 0" fill="none" stroke="#144DFF" stroke-width="2.4"/><path d="M30 47C44 38 16 30 30 23C42 15 18 8 30 0" fill="none" stroke="#FFB51C" stroke-width="2" transform="translate(-4 0)"/><path d="M30 48.3H240" stroke="#12A52A" stroke-width="2.2"/>',
  panah: '<path d="M36 0H240V47H36L22 23.5Z" fill="#fff"/><path d="M36 0 22 23.5 36 47" fill="none" stroke="#144DFF" stroke-width="3"/><path d="M30.5 0 16 23.5 30.5 47" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  minimal: '<path d="M30 0H240V46H36A6 6 0 0 1 30 40Z" fill="#fff"/><rect x="36" y="46" width="60" height="3" fill="#144DFF"/><rect x="96" y="46" width="144" height="3" fill="#FFB51C"/>',
  titik: '<path d="M30 0H240V46H30Z" fill="#fff"/><circle cx="38" cy="50.5" r="2.4" fill="#144DFF"/><circle cx="46" cy="50.5" r="2.4" fill="#FFB51C"/><circle cx="54" cy="50.5" r="2.4" fill="#12A52A"/><path d="M62 50.5H240" stroke="#144DFF" stroke-width="1.2"/>',
  undakan: '<path d="M32 0H240V43H170V46H100V50H32Z" fill="#fff"/><path d="M32 0V50H100V46H170V43H240" fill="none" stroke="#144DFF" stroke-width="2.6"/><path d="M27 0V54.6H105V50.6H175V47.6H240" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  swoosh: '<path d="M30 0H240V42C190 48 120 52 30 52Z" fill="#fff"/><rect x="24" width="6" height="52" fill="#144DFF"/><path d="M30 52C120 52 190 48 240 42" fill="none" stroke="#144DFF" stroke-width="2.6"/><path d="M30 55.6C120 55.6 190 51.6 240 45.6" fill="none" stroke="#FFB51C" stroke-width="2.2"/>',
  tegak: '<rect x="28" width="4" height="47" fill="#144DFF"/><rect x="33" width="4" height="47" fill="#FFB51C"/><rect x="38" width="4" height="47" fill="#12A52A"/><path d="M42 0H240V47H42Z" fill="#fff"/><rect x="42" y="47" width="198" height="2.4" fill="#144DFF"/>',
  gradien: '<defs><linearGradient id="gPanel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#D3E3FF"/></linearGradient></defs><path d="M10 0H15L29 47H24Z" fill="#FFB51C"/><path d="M18 0H26L40 47H32Z" fill="#144DFF"/><path d="M26 0H240V47H40Z" fill="url(#gPanel)"/><path d="M40 48.3H240" stroke="#144DFF" stroke-width="2.6"/>',
  ganda: '<path d="M30 0H240V50H38A8 8 0 0 1 30 42Z" fill="#fff"/><path d="M33.5 0V42.2A5 5 0 0 0 38.5 47.2H240" fill="none" stroke="#144DFF" stroke-width=".8"/><path d="M30 0V42A8 8 0 0 0 38 50H240" fill="none" stroke="#FFB51C" stroke-width="2"/>',
  segitigasudut: '<path d="M22 0H240V47H22Z" fill="#fff"/><path d="M22 0H48L22 26Z" fill="#144DFF"/><path d="M22 47H44L22 25Z" fill="#FFB51C"/><path d="M44 48.4H240" stroke="#12A52A" stroke-width="2.2"/>',
  lipat: '<path d="M30 0H240V47H44L30 33Z" fill="#fff"/><path d="M30 33 44 47V33Z" fill="#FFB51C"/><path d="M44 48.3H240" stroke="#144DFF" stroke-width="2.6"/>',
};

const TEMPLATE_LOGOS_SVG = `
  <g transform="translate(71 23.5) scale(.86) translate(-71 -23.5)">
    <circle cx="71" cy="23.5" r="21" fill="#FFFFFF" stroke="#1C1C1C" stroke-width=".5"/>
    <circle cx="71" cy="23.5" r="15.9" fill="none" stroke="#1C1C1C" stroke-width=".35"/>
    <text font-family="Cinzel, 'Trajan Pro', 'Times New Roman', serif" font-weight="700" font-size="3.3" fill="#1C1C1C">
      <textPath href="#arcUNP" startOffset="1.5" textLength="76" lengthAdjust="spacing">UNIVERSITAS NEGERI PADANG</textPath>
    </text>
    <text x="71" y="42.4" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="3.6" letter-spacing=".3" fill="#1C1C1C">UNP</text>
    <g transform="translate(71 23.5)">
      <circle r="14.2" fill="#1D4EA6"/>
      <g id="tandukUNP" fill="#FFB51C">
        <path d="M-5.2 6C-9.5 2-8.5-6-5.6-11.2-5.4-6.8-3.8-3.6-3.3-.6-4.2 1.6-4.6 3.6-4 5.4Z"/>
        <path d="M-12 1C-11.2-3-9.5-5.5-8.4-7.2-8.4-4-8.8-1.2-7.2 2.2Z"/>
      </g>
      <use href="#tandukUNP" transform="scale(-1 1)"/>
      <path d="M-9.4 3.2C-9.4 8.4-4.6 11.4 0 11.4S9.4 8.4 9.4 3.2C7 6.4 3.8 7.8 0 7.8S-7 6.4-9.4 3.2Z" fill="#F59A05"/>
      <path d="M-7 5.2C-5 8 -2.5 8.8 0 8.8S5 8 7 5.2" fill="none" stroke="#FFD25E" stroke-width=".5"/>
      <rect x="-2.3" y="-2.4" width="4.6" height="9.2" rx="1" fill="#FFF6D6"/>
      <g fill="#E58A00">
        <rect x="-2.3" y="-.6" width="4.6" height="1.1"/>
        <rect x="-2.3" y="1.9" width="4.6" height="1.1"/>
        <rect x="-2.3" y="4.4" width="4.6" height="1.1"/>
      </g>
      <path d="M0-8C1.9-5.4 2.5-3.8 0-2.4-2.5-3.8-1.9-5.4 0-8Z" fill="#E8262E"/>
    </g>
  </g>
  <path d="M116 8V42" stroke="#D5DBE5" stroke-width="1" stroke-dasharray="2 2"/>
  <g transform="translate(11 0) translate(167.5 26) scale(.96 1.12) translate(-167.5 -26)">
    <path d="M100.8 38.8 133.3 14.2V38.8Z" fill="url(#gHijau)"/>
    <path d="M133.3 14.2 166.7 38.8H133.3Z" fill="#144DFF"/>
    <path d="M133.3 14.2H166.7V38.8Z" fill="#FFB51C"/>
    <g font-family="Cinzel, 'Trajan Pro', 'Times New Roman', serif" font-weight="400" fill="#454545" font-size="6.6">
      <text x="171" y="19.7" textLength="54" lengthAdjust="spacing">NUSA</text>
      <text x="171" y="29.7" textLength="54" lengthAdjust="spacingAndGlyphs">KONSTRUKSI</text>
      <text x="171" y="37.6" textLength="54" lengthAdjust="spacing">ENJINIRING</text>
    </g>
  </g>
`;

const TEMPLATE_LOGO_DEFS = `
  <path id="arcUNP" d="M59.05 35.45A16.9 16.9 0 1 1 82.95 35.45"/>
  <linearGradient id="gHijau" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#1DB13A"/>
    <stop offset="1" stop-color="#0B8A1E"/>
  </linearGradient>
`;

export function getDynamicWatermarkWidth(_logoCount: number): number {
  return 240;
}

export function getDecorOffset(styleId: string): number {
  const variation = WATERMARK_VARIATIONS.find((item) => item.id === styleId);
  return variation?.decorOffset ?? 40;
}

export function getFrameSvgPath(
  styleId: string,
  _width: number,
  tone?: WatermarkToneOptions,
): string {
  const template = FRAME_PATHS[styleId as FrameStyle] || FRAME_PATHS.klasik;
  return template
    .replaceAll('#144DFF', tone?.accent1 || '#144DFF')
    .replaceAll('#FFB51C', tone?.accent2 || '#FFB51C')
    .replaceAll('#12A52A', tone?.accent3 || '#12A52A')
    .replaceAll('#fff', tone?.bgCard || '#FFFFFF');
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });
}

export function generateLogosSvg(logos: LogoSlot[], width: number, decorOffset: number): string {
  const activeLogos = (logos || []).filter((logo) => logo.enabled && logo.url);
  if (activeLogos.length === 0) return '';

  const startX = decorOffset;
  const contentW = Math.max(40, width - startX - 10);
  const slotW = contentW / activeLogos.length;

  return activeLogos
    .map((logo, index) => {
      const centerX = startX + (index + 0.5) * slotW;
      const boxW = Math.max(20, slotW * 0.92);
      const boxH = 42;
      const x = centerX - boxW / 2;
      const y = 4.5;
      const divider =
        index > 0
          ? `<line x1="${startX + index * slotW}" y1="12" x2="${startX + index * slotW}" y2="38" stroke="#D5DBE5" stroke-width=".8" stroke-dasharray="2 2" opacity=".6"/>`
          : '';
      const content = logo.url
        ? `<image href="${escapeXml(logo.url)}" x="${x}" y="${y}" width="${boxW}" height="${boxH}" preserveAspectRatio="xMidYMid meet"/>`
        : `<text x="${centerX}" y="27.5" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="${Math.min(10, Math.max(7, slotW * 0.12))}" fill="#1B2432">${escapeXml(logo.name)}</text>`;
      return `${divider}${content}`;
    })
    .join('');
}

export function generateWatermarkSvgString(
  styleId: string,
  tone?: WatermarkToneOptions,
  logos?: LogoSlot[],
): string {
  const variation = WATERMARK_VARIATIONS.find((item) => item.id === styleId) || WATERMARK_VARIATIONS[0];
  const activeLogos = (logos || []).filter((logo) => logo.enabled && logo.url);
  const width = getDynamicWatermarkWidth(activeLogos.length);
  const frameInner = getFrameSvgPath(variation.id, width, tone);
  const logoInner =
    activeLogos.length > 0
      ? generateLogosSvg(activeLogos, width, variation.decorOffset)
      : TEMPLATE_LOGOS_SVG;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" width="1920" height="512" role="img" aria-label="Watermark ${escapeXml(variation.name)}">
  <defs>${TEMPLATE_LOGO_DEFS}</defs>
  ${frameInner}
  ${logoInner}
</svg>`;
}

const watermarkImageCache = new Map<string, HTMLImageElement>();

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}

function notifyCanvasAssetsReady(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('canvas-assets-ready'));
  }
}

export function getWatermarkImage(
  styleId: string,
  tone?: WatermarkToneOptions,
  logos?: LogoSlot[],
): HTMLImageElement {
  const variation = WATERMARK_VARIATIONS.find((item) => item.id === styleId) || WATERMARK_VARIATIONS[0];
  const activeLogos = (logos || []).filter((logo) => logo.enabled && logo.url);
  const logoKey = hashText(activeLogos.map((logo) => `${logo.id}:${logo.url}:${logo.name}`).join('|'));
  const cacheKey = [
    variation.id,
    tone?.accent1 || '#144DFF',
    tone?.accent2 || '#FFB51C',
    tone?.accent3 || '#12A52A',
    tone?.bgCard || '#FFFFFF',
    logoKey,
  ].join('_');
  const cachedImage = watermarkImageCache.get(cacheKey);
  if (cachedImage) return cachedImage;

  const image = new Image();
  image.onload = notifyCanvasAssetsReady;
  image.onerror = () => console.error(`Watermark "${variation.name}" gagal dimuat.`);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    generateWatermarkSvgString(variation.id, tone, activeLogos),
  )}`;
  watermarkImageCache.set(cacheKey, image);
  return image;
}

export async function waitForWatermarkImage(
  styleId: string,
  tone?: WatermarkToneOptions,
  logos?: LogoSlot[],
): Promise<void> {
  const image = getWatermarkImage(styleId, tone, logos);
  if (image.complete && image.naturalWidth > 0) return;
  try {
    await image.decode();
  } catch (error) {
    throw new Error(`Watermark "${styleId}" gagal disiapkan untuk ekspor.`, { cause: error });
  }
  if (image.naturalWidth === 0) {
    throw new Error(`Watermark "${styleId}" gagal disiapkan untuk ekspor.`);
  }
}

if (typeof window !== 'undefined') {
  WATERMARK_VARIATIONS.forEach((variation) => getWatermarkImage(variation.id));
}

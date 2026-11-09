import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API route for AI-generated bumper concepts & slogans
app.post('/api/generate-bumper-ideas', async (req, res) => {
  try {
    const { topic, channelType, language = 'id' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topik atau nama channel diperlukan' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return rich default suggestions if API key is not configured
      return res.json({
        concepts: [
          {
            title: topic.trim().toUpperCase(),
            slogan: language === 'id' ? 'KARYA TANPA BATAS' : 'LIMITLESS CREATIVITY',
            themeId: 'cinematic',
            primaryColor: '#D4AF37',
            secondaryColor: '#FF6B00',
            fontFamily: 'Cinzel',
            audioTheme: 'cinematic',
            description: language === 'id' ? 'Kesan mewah, berwibawa, dan megah dengan kilau emas' : 'High-end prestigious gold shine'
          },
          {
            title: topic.trim().toUpperCase(),
            slogan: language === 'id' ? 'LEVEL UP YOUR GAME' : 'ENTER THE NEXT LEVEL',
            themeId: 'cyberpunk',
            primaryColor: '#00F0FF',
            secondaryColor: '#FF0055',
            fontFamily: 'Outfit',
            audioTheme: 'cyber',
            description: language === 'id' ? 'Aura futuristik glitch & neon energetik' : 'High energy glitch neon aura'
          },
          {
            title: topic.trim().toUpperCase(),
            slogan: language === 'id' ? 'SIMPEL. JELAS. BERDAMPAK.' : 'PURE & PURPOSEFUL',
            themeId: 'minimal',
            primaryColor: '#FFFFFF',
            secondaryColor: '#06B6D4',
            fontFamily: 'Plus Jakarta Sans',
            audioTheme: 'minimal',
            description: language === 'id' ? 'Desain bersih modern minimalis dengan tipografi tegas' : 'Clean modernist typography reveal'
          }
        ]
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Anda adalah art director motion graphics kelas dunia.
Buatkan 4 konsep video bumper (intro/outro animasi pendek 3-6 detik) untuk channel/brand dengan detail:
- Nama / Topik: "${topic}"
- Kategori/Genre: "${channelType || 'Umum / Content Creator'}"
- Bahasa slogan: ${language === 'id' ? 'Bahasa Indonesia yang punchy, keren, berkarakter' : 'Punchy English'}

Pilih tema visual yang paling pas dari daftar tema berikut:
['cinematic', 'cyberpunk', 'cosmic', 'synthwave', 'minimal', 'gaming', 'glass', 'broadcast']

Pilih audio theme dari:
['cinematic', 'cyber', 'retro', 'cosmic', 'minimal', 'gaming']

Pilih font family dari:
['Outfit', 'Oswald', 'Cinzel', 'Playfair Display', 'Plus Jakarta Sans', 'Space Grotesk']

Format JSON respon yang ketat sesuai skema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Nama brand/channel yang direkomendasikan' },
                  slogan: { type: Type.STRING, description: 'Slogan pendek atau tagline menarik (max 5 kata)' },
                  themeId: { type: Type.STRING, description: 'ID tema: cinematic, cyberpunk, cosmic, synthwave, minimal, gaming, glass, broadcast' },
                  primaryColor: { type: Type.STRING, description: 'Kode hex warna utama seperti #FF4500' },
                  secondaryColor: { type: Type.STRING, description: 'Kode hex warna kedua seperti #00F0FF' },
                  fontFamily: { type: Type.STRING, description: 'Nama font' },
                  audioTheme: { type: Type.STRING, description: 'Tema audio' },
                  description: { type: Type.STRING, description: 'Alasan konsep ini cocok' },
                },
                required: ['title', 'slogan', 'themeId', 'primaryColor', 'secondaryColor', 'fontFamily', 'audioTheme', 'description'],
              },
            },
          },
          required: ['concepts'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    return res.json(data);
  } catch (error: any) {
    console.error('Error or spike generating bumper ideas:', error?.message);
    const topicUpper = (req.body?.topic || 'CREATOR').trim().toUpperCase();
    const lang = req.body?.language || 'id';

    // Graceful smart concepts based on the user's requested topic
    return res.json({
      concepts: [
        {
          title: topicUpper,
          slogan: lang === 'id' ? 'KARYA TANPA BATAS' : 'LIMITLESS CREATION',
          themeId: 'cinematic',
          primaryColor: '#D4AF37',
          secondaryColor: '#FF9E2C',
          fontFamily: 'Cinzel',
          audioTheme: 'cinematic',
          description: lang === 'id' ? 'Kesan mewah, berwibawa, dan megah dengan kilau emas' : 'High-end prestigious gold shine',
        },
        {
          title: topicUpper,
          slogan: lang === 'id' ? 'ENERGI GENERASI BARU' : 'NEXT-GEN PULSE',
          themeId: 'cyberpunk',
          primaryColor: '#00F0FF',
          secondaryColor: '#FF0055',
          fontFamily: 'Outfit',
          audioTheme: 'cyber',
          description: lang === 'id' ? 'Aura futuristik glitch & neon energetik' : 'High energy glitch neon aura',
        },
        {
          title: topicUpper,
          slogan: lang === 'id' ? 'SIMPEL. JELAS. BERDAMPAK.' : 'PURE & PURPOSEFUL',
          themeId: 'minimal',
          primaryColor: '#FFFFFF',
          secondaryColor: '#38BDF8',
          fontFamily: 'Plus Jakarta Sans',
          audioTheme: 'minimal',
          description: lang === 'id' ? 'Desain bersih modern minimalis dengan tipografi tegas' : 'Clean modernist typography reveal',
        },
        {
          title: topicUpper,
          slogan: lang === 'id' ? 'RAIH KEMENANGAN MAKSIMAL' : 'DOMINATE THE GAME',
          themeId: 'gaming',
          primaryColor: '#EF4444',
          secondaryColor: '#F97316',
          fontFamily: 'Oswald',
          audioTheme: 'gaming',
          description: lang === 'id' ? 'Dampak agresif dengan dentuman bass 808 dan tebasan visual' : 'Aggressive impact with heavy 808 bass drop',
        },
      ],
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  let vite: Awaited<ReturnType<typeof import('vite')['createServer']>> | undefined;

  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: {
        middlewareMode: true,
        port: Number(PORT),
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Video Bumper Studio server running at http://localhost:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} sudah digunakan. Jika Studio Bumper sudah berjalan, buka http://localhost:${PORT} tanpa menjalankan server kedua.`
      );
      console.error(
        `Untuk mencari proses yang memakai port ini di Windows, jalankan: Get-NetTCPConnection -LocalPort ${PORT} -State Listen`
      );
      void vite?.close().finally(() => {
        process.exitCode = 1;
      });
      return;
    }

    console.error('Server lokal gagal dijalankan:', error);
    void vite?.close().finally(() => {
      process.exitCode = 1;
    });
  });
}

startServer().catch((error: unknown) => {
  console.error('Server lokal gagal disiapkan:', error);
  process.exitCode = 1;
});

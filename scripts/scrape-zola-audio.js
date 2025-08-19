#!/usr/bin/env node

/**
 * Script de scraping pour récupérer les sons de ZOLA
 * Utilise Puppeteer pour naviguer et télécharger les fichiers audio
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ZolaAudioScraper {
  constructor() {
    this.baseDir = path.join(__dirname, '../assets/audio');
    this.downloadedFiles = new Set();
    this.errors = [];
  }

  async init() {
    console.log('🎵 Initialisation du scraper audio ZOLA...');
    
    // Créer les dossiers s'ils n'existent pas
    await this.createDirectories();
    
    // Démarrer le navigateur
    this.browser = await puppeteer.launch({
      headless: false, // Pour voir ce qui se passe
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    
    // Configurer les permissions audio
    await this.page.setPermissions('microphone', 'granted');
    
    console.log('✅ Scraper initialisé');
  }

  async createDirectories() {
    const dirs = [
      'songs',
      'effects', 
      'interviews',
      'albums/origines',
      'albums/evolution',
      'albums/nouveau-monde'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.baseDir, dir);
      try {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
      } catch (error) {
        console.log(`📁 Dossier existe déjà: ${dir}`);
      }
    }
  }

  async scrapeSpotify() {
    console.log('🎧 Scraping Spotify...');
    
    try {
      // Aller sur la page Spotify de ZOLA
      await this.page.goto('https://open.spotify.com/artist/example-zola', {
        waitUntil: 'networkidle2'
      });

      // Attendre que la page se charge
      await this.page.waitForTimeout(3000);

      // Extraire les informations des chansons
      const songs = await this.page.evaluate(() => {
        const songElements = document.querySelectorAll('[data-testid="track-row"]');
        return Array.from(songElements).map(song => {
          const title = song.querySelector('[data-testid="track-name"]')?.textContent;
          const album = song.querySelector('[data-testid="album-name"]')?.textContent;
          const duration = song.querySelector('[data-testid="duration"]')?.textContent;
          
          return { title, album, duration };
        }).filter(song => song.title);
      });

      console.log(`🎵 ${songs.length} chansons trouvées sur Spotify`);
      
      // Sauvegarder les métadonnées
      await this.saveMetadata('spotify', songs);
      
    } catch (error) {
      console.error('❌ Erreur Spotify:', error.message);
      this.errors.push({ source: 'spotify', error: error.message });
    }
  }

  async scrapeYouTube() {
    console.log('📺 Scraping YouTube...');
    
    try {
      // Rechercher ZOLA sur YouTube
      await this.page.goto('https://www.youtube.com/results?search_query=ZOLA+rap+français', {
        waitUntil: 'networkidle2'
      });

      // Attendre que les résultats se chargent
      await this.page.waitForTimeout(3000);

      // Extraire les informations des vidéos
      const videos = await this.page.evaluate(() => {
        const videoElements = document.querySelectorAll('#video-title');
        return Array.from(videoElements).slice(0, 20).map(video => {
          const title = video.textContent?.trim();
          const url = video.href;
          const duration = video.closest('ytd-video-renderer')?.querySelector('#text')?.textContent;
          
          return { title, url, duration };
        }).filter(video => video.title && video.url);
      });

      console.log(`📺 ${videos.length} vidéos trouvées sur YouTube`);
      
      // Sauvegarder les métadonnées
      await this.saveMetadata('youtube', videos);
      
    } catch (error) {
      console.error('❌ Erreur YouTube:', error.message);
      this.errors.push({ source: 'youtube', error: error.message });
    }
  }

  async scrapeSoundCloud() {
    console.log('🎵 Scraping SoundCloud...');
    
    try {
      // Aller sur SoundCloud
      await this.page.goto('https://soundcloud.com/search?q=ZOLA', {
        waitUntil: 'networkidle2'
      });

      // Attendre que la page se charge
      await this.page.waitForTimeout(3000);

      // Extraire les informations des tracks
      const tracks = await this.page.evaluate(() => {
        const trackElements = document.querySelectorAll('article');
        return Array.from(trackElements).slice(0, 15).map(track => {
          const title = track.querySelector('h2')?.textContent?.trim();
          const artist = track.querySelector('span[class*="artist"]')?.textContent?.trim();
          const duration = track.querySelector('span[class*="duration"]')?.textContent;
          
          return { title, artist, duration };
        }).filter(track => track.title);
      });

      console.log(`🎵 ${tracks.length} tracks trouvés sur SoundCloud`);
      
      // Sauvegarder les métadonnées
      await this.saveMetadata('soundcloud', tracks);
      
    } catch (error) {
      console.error('❌ Erreur SoundCloud:', error.message);
      this.errors.push({ source: 'soundcloud', error: error.message });
    }
  }

  async scrapeDeezer() {
    console.log('🎧 Scraping Deezer...');
    
    try {
      // Aller sur Deezer
      await this.page.goto('https://www.deezer.com/fr/search/ZOLA', {
        waitUntil: 'networkidle2'
      });

      // Attendre que la page se charge
      await this.page.waitForTimeout(3000);

      // Extraire les informations des chansons
      const songs = await this.page.evaluate(() => {
        const songElements = document.querySelectorAll('.track');
        return Array.from(songElements).slice(0, 20).map(song => {
          const title = song.querySelector('.track-title')?.textContent?.trim();
          const artist = song.querySelector('.track-artist')?.textContent?.trim();
          const album = song.querySelector('.track-album')?.textContent?.trim();
          
          return { title, artist, album };
        }).filter(song => song.title);
      });

      console.log(`🎧 ${songs.length} chansons trouvées sur Deezer`);
      
      // Sauvegarder les métadonnées
      await this.saveMetadata('deezer', songs);
      
    } catch (error) {
      console.error('❌ Erreur Deezer:', error.message);
      this.errors.push({ source: 'deezer', error: error.message });
    }
  }

  async scrapeAppleMusic() {
    console.log('🍎 Scraping Apple Music...');
    
    try {
      // Aller sur Apple Music
      await this.page.goto('https://music.apple.com/fr/search?term=ZOLA', {
        waitUntil: 'networkidle2'
      });

      // Attendre que la page se charge
      await this.page.waitForTimeout(3000);

      // Extraire les informations des chansons
      const songs = await this.page.evaluate(() => {
        const songElements = document.querySelectorAll('[data-testid="shelf-item"]');
        return Array.from(songElements).slice(0, 20).map(song => {
          const title = song.querySelector('[data-testid="title"]')?.textContent?.trim();
          const artist = song.querySelector('[data-testid="artist"]')?.textContent?.trim();
          const album = song.querySelector('[data-testid="album"]')?.textContent?.trim();
          
          return { title, artist, album };
        }).filter(song => song.title);
      });

      console.log(`🍎 ${songs.length} chansons trouvées sur Apple Music`);
      
      // Sauvegarder les métadonnées
      await this.saveMetadata('apple-music', songs);
      
    } catch (error) {
      console.error('❌ Erreur Apple Music:', error.message);
      this.errors.push({ source: 'apple-music', error: error.message });
    }
  }

  async saveMetadata(source, data) {
    const metadataPath = path.join(this.baseDir, `${source}-metadata.json`);
    
    try {
      const metadata = {
        source,
        scrapedAt: new Date().toISOString(),
        count: data.length,
        data
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`💾 Métadonnées sauvegardées: ${metadataPath}`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde métadonnées ${source}:`, error.message);
    }
  }

  async downloadSampleAudio() {
    console.log('⬇️ Téléchargement d\'échantillons audio...');
    
    // URLs d'échantillons audio gratuits (remplacer par de vrais liens ZOLA)
    const sampleUrls = [
      {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        filename: 'mission-passed.wav',
        category: 'effects'
      },
      {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        filename: 'gtatheme.wav',
        category: 'effects'
      },
      {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        filename: 'origines-sample.wav',
        category: 'albums/origines'
      },
      {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        filename: 'evolution-sample.wav',
        category: 'albums/evolution'
      },
      {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        filename: 'nouveau-monde-sample.wav',
        category: 'albums/nouveau-monde'
      }
    ];

    for (const sample of sampleUrls) {
      try {
        await this.downloadFile(sample.url, sample.filename, sample.category);
        console.log(`✅ Téléchargé: ${sample.filename}`);
      } catch (error) {
        console.error(`❌ Erreur téléchargement ${sample.filename}:`, error.message);
      }
    }
  }

  async downloadFile(url, filename, category) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.baseDir, category, filename);
      
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          this.downloadedFiles.add(filePath);
          resolve(filePath);
        });
        
        file.on('error', (error) => {
          fs.unlink(filePath);
          reject(error);
        });
      }).on('error', reject);
    });
  }

  async generateAudioIndex() {
    console.log('📝 Génération de l\'index audio...');
    
    try {
      const audioIndex = {
        generatedAt: new Date().toISOString(),
        totalFiles: this.downloadedFiles.size,
        categories: {
          effects: [],
          songs: [],
          interviews: [],
          albums: {
            origines: [],
            evolution: [],
            'nouveau-monde': []
          }
        },
        metadata: {}
      };

      // Scanner tous les dossiers
      const categories = ['effects', 'songs', 'interviews'];
      
      for (const category of categories) {
        const categoryPath = path.join(this.baseDir, category);
        try {
          const files = await fs.readdir(categoryPath);
          audioIndex.categories[category] = files.filter(file => 
            file.match(/\.(wav|mp3|ogg|m4a)$/i)
          );
        } catch (error) {
          console.log(`📁 Dossier ${category} vide ou inexistant`);
        }
      }

      // Scanner les albums
      const albumCategories = ['origines', 'evolution', 'nouveau-monde'];
      for (const album of albumCategories) {
        const albumPath = path.join(this.baseDir, 'albums', album);
        try {
          const files = await fs.readdir(albumPath);
          audioIndex.categories.albums[album] = files.filter(file => 
            file.match(/\.(wav|mp3|ogg|m4a)$/i)
          );
        } catch (error) {
          console.log(`📁 Album ${album} vide ou inexistant`);
        }
      }

      // Charger les métadonnées
      const metadataFiles = await fs.readdir(this.baseDir);
      for (const file of metadataFiles) {
        if (file.endsWith('-metadata.json')) {
          try {
            const metadataPath = path.join(this.baseDir, file);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            audioIndex.metadata[file.replace('-metadata.json', '')] = metadata;
          } catch (error) {
            console.log(`📄 Erreur lecture métadonnées ${file}`);
          }
        }
      }

      // Sauvegarder l'index
      const indexPath = path.join(this.baseDir, 'audio-index.json');
      await fs.writeFile(indexPath, JSON.stringify(audioIndex, null, 2));
      
      console.log(`💾 Index audio généré: ${indexPath}`);
      console.log(`📊 Total: ${audioIndex.totalFiles} fichiers`);
      
    } catch (error) {
      console.error('❌ Erreur génération index:', error.message);
    }
  }

  async run() {
    try {
      console.log('🚀 Démarrage du scraping audio ZOLA...');
      
      await this.init();
      
      // Exécuter tous les scrapers
      await Promise.allSettled([
        this.scrapeSpotify(),
        this.scrapeYouTube(),
        this.scrapeSoundCloud(),
        this.scrapeDeezer(),
        this.scrapeAppleMusic()
      ]);
      
      // Télécharger des échantillons audio
      await this.downloadSampleAudio();
      
      // Générer l'index audio
      await this.generateAudioIndex();
      
      // Afficher le résumé
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Erreur critique:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  showSummary() {
    console.log('\n📊 RÉSUMÉ DU SCRAPING');
    console.log('========================');
    console.log(`✅ Fichiers téléchargés: ${this.downloadedFiles.size}`);
    console.log(`❌ Erreurs: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Erreurs rencontrées:');
      this.errors.forEach(error => {
        console.log(`  - ${error.source}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 Prochaines étapes:');
    console.log('  1. Vérifier les fichiers téléchargés');
    console.log('  2. Organiser les fichiers par catégorie');
    console.log('  3. Mettre à jour la configuration du site');
    console.log('  4. Tester la lecture audio');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Navigateur fermé');
    }
  }
}

// Exécuter le scraper si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new ZolaAudioScraper();
  scraper.run().catch(console.error);
}

export default ZolaAudioScraper;

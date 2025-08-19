// Gestionnaire audio avancé pour le site ZOLA
// Gère la lecture, la recherche et l'organisation des fichiers audio scrapés

export class AudioManager {
  constructor(config) {
    this.config = config;
    this.audioContext = null;
    this.currentAudio = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.volume = 0.7;
    this.audioIndex = null;
    this.searchIndex = null;
    this.filters = {
      category: 'all',
      album: 'all',
      duration: 'all',
      year: 'all'
    };
  }

  async init() {
    try {
      console.log('🎵 Initialisation du gestionnaire audio...');
      
      // Charger l'index audio
      await this.loadAudioIndex();
      
      // Créer l'index de recherche
      this.buildSearchIndex();
      
      // Initialiser le contexte audio
      await this.initAudioContext();
      
      // Configurer les événements
      this.setupEventListeners();
      
      console.log('✅ Gestionnaire audio initialisé');
      
    } catch (error) {
      console.error('❌ Erreur initialisation audio:', error);
    }
  }

  async loadAudioIndex() {
    try {
      const response = await fetch('/assets/audio/audio-index.json');
      if (response.ok) {
        this.audioIndex = await response.json();
        console.log(`📊 Index audio chargé: ${this.audioIndex.totalFiles} fichiers`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger l\'index audio, utilisation de la configuration par défaut');
      this.audioIndex = this.getDefaultAudioIndex();
    }
  }

  getDefaultAudioIndex() {
    return {
      generatedAt: new Date().toISOString(),
      totalFiles: 5,
      categories: {
        effects: ['mission-passed.wav', 'gtatheme.wav'],
        songs: [],
        interviews: [],
        albums: {
          origines: ['origines-sample.wav'],
          evolution: ['evolution-sample.wav'],
          'nouveau-monde': ['nouveau-monde-sample.wav']
        }
      },
      metadata: {}
    };
  }

  buildSearchIndex() {
    this.searchIndex = {
      files: [],
      categories: new Set(),
      albums: new Set(),
      years: new Set(),
      tags: new Map()
    };

    // Indexer tous les fichiers
    Object.entries(this.audioIndex.categories).forEach(([category, files]) => {
      if (Array.isArray(files)) {
        files.forEach(file => {
          this.searchIndex.files.push({
            filename: file,
            category,
            path: `/assets/audio/${category}/${file}`,
            metadata: this.extractMetadata(file)
          });
        });
      } else if (typeof files === 'object') {
        // Albums
        Object.entries(files).forEach(([album, albumFiles]) => {
          this.searchIndex.albums.add(album);
          albumFiles.forEach(file => {
            this.searchIndex.files.push({
              filename: file,
              category: 'albums',
              album,
              path: `/assets/audio/albums/${album}/${file}`,
              metadata: this.extractMetadata(file)
            });
          });
        });
      }
      
      if (category !== 'albums') {
        this.searchIndex.categories.add(category);
      }
    });

    console.log(`🔍 Index de recherche construit: ${this.searchIndex.files.length} fichiers indexés`);
  }

  extractMetadata(filename) {
    const metadata = {
      title: '',
      artist: 'ZOLA',
      album: '',
      year: '',
      duration: '',
      genre: 'rap',
      tags: []
    };

    // Extraire les informations du nom de fichier
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split('-');
    
    if (parts.length > 1) {
      metadata.title = parts.slice(1).join(' ').replace(/_/g, ' ');
    } else {
      metadata.title = nameWithoutExt.replace(/_/g, ' ');
    }

    // Ajouter des tags basés sur le nom
    if (filename.includes('sample')) metadata.tags.push('sample');
    if (filename.includes('mission')) metadata.tags.push('gta', 'mission');
    if (filename.includes('theme')) metadata.tags.push('gta', 'theme');
    if (filename.includes('origines')) metadata.tags.push('ep', 'debuts');
    if (filename.includes('evolution')) metadata.tags.push('album', 'succes');
    if (filename.includes('nouveau')) metadata.tags.push('single', 'actuel');

    return metadata;
  }

  async initAudioContext() {
    try {
      // Créer le contexte audio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Démarrer le contexte si nécessaire
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('🎧 Contexte audio initialisé');
      
    } catch (error) {
      console.error('❌ Erreur contexte audio:', error);
    }
  }

  setupEventListeners() {
    // Écouter les changements de volume
    document.addEventListener('volumechange', (e) => {
      this.volume = e.detail?.volume || this.volume;
      if (this.currentAudio) {
        this.currentAudio.volume = this.volume;
      }
    });

    // Écouter les changements de filtre
    document.addEventListener('filterchange', (e) => {
      this.filters = { ...this.filters, ...e.detail };
      this.updateAudioDisplay();
    });
  }

  // Recherche audio
  search(query, options = {}) {
    const {
      category = 'all',
      album = 'all',
      duration = 'all',
      year = 'all',
      tags = []
    } = options;

    let results = this.searchIndex.files;

    // Filtrage par catégorie
    if (category !== 'all') {
      results = results.filter(file => file.category === category);
    }

    // Filtrage par album
    if (album !== 'all') {
      results = results.filter(file => file.album === album);
    }

    // Filtrage par tags
    if (tags.length > 0) {
      results = results.filter(file => 
        tags.some(tag => file.metadata.tags.includes(tag))
      );
    }

    // Recherche textuelle
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(file => 
        file.filename.toLowerCase().includes(queryLower) ||
        file.metadata.title.toLowerCase().includes(queryLower) ||
        file.metadata.artist.toLowerCase().includes(queryLower) ||
        file.metadata.album.toLowerCase().includes(queryLower) ||
        file.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    // Tri par pertinence
    results.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Score pour la correspondance exacte du titre
      if (query && a.metadata.title.toLowerCase() === query.toLowerCase()) scoreA += 10;
      if (query && b.metadata.title.toLowerCase() === query.toLowerCase()) scoreB += 10;

      // Score pour la correspondance partielle
      if (query && a.filename.toLowerCase().includes(query.toLowerCase())) scoreA += 5;
      if (query && b.filename.toLowerCase().includes(query.toLowerCase())) scoreB += 5;

      return scoreB - scoreA;
    });

    return results;
  }

  // Lecture audio
  async playAudio(filePath, options = {}) {
    try {
      // Arrêter l'audio en cours
      if (this.currentAudio) {
        this.stopAudio();
      }

      // Créer un nouvel élément audio
      this.currentAudio = new Audio(filePath);
      
      // Configurer les options
      this.currentAudio.volume = this.volume;
      this.currentAudio.loop = options.loop || false;
      
      // Événements
      this.currentAudio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.dispatchEvent('audio:ended', { filePath });
      });

      this.currentAudio.addEventListener('error', (error) => {
        console.error('❌ Erreur lecture audio:', error);
        this.dispatchEvent('audio:error', { filePath, error });
      });

      // Démarrer la lecture
      await this.currentAudio.play();
      this.isPlaying = true;
      
      this.dispatchEvent('audio:started', { filePath, options });
      
      console.log(`▶️ Lecture démarrée: ${filePath}`);
      
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      this.dispatchEvent('audio:error', { filePath, error });
    }
  }

  pauseAudio() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
      this.dispatchEvent('audio:paused', { filePath: this.currentAudio.src });
    }
  }

  resumeAudio() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
      this.isPlaying = true;
      this.dispatchEvent('audio:resumed', { filePath: this.currentAudio.src });
    }
  }

  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
      this.dispatchEvent('audio:stopped');
    }
  }

  // Gestion de la playlist
  addToQueue(filePath, options = {}) {
    this.audioQueue.push({ filePath, options });
    this.dispatchEvent('queue:added', { filePath, options });
    
    // Démarrer la lecture si rien n'est en cours
    if (!this.isPlaying && this.audioQueue.length === 1) {
      this.playNextInQueue();
    }
  }

  async playNextInQueue() {
    if (this.audioQueue.length > 0) {
      const { filePath, options } = this.audioQueue.shift();
      await this.playAudio(filePath, options);
      
      this.dispatchEvent('queue:next', { filePath, options });
    }
  }

  clearQueue() {
    this.audioQueue = [];
    this.dispatchEvent('queue:cleared');
  }

  // Contrôles avancés
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    
    this.dispatchEvent('audio:volume', { volume: this.volume });
  }

  setPlaybackRate(rate) {
    if (this.currentAudio) {
      this.currentAudio.playbackRate = Math.max(0.5, Math.min(2, rate));
      this.dispatchEvent('audio:playbackRate', { rate: this.currentAudio.playbackRate });
    }
  }

  seekTo(time) {
    if (this.currentAudio && !isNaN(time)) {
      this.currentAudio.currentTime = Math.max(0, Math.min(time, this.currentAudio.duration));
      this.dispatchEvent('audio:seeked', { time: this.currentAudio.currentTime });
    }
  }

  // Gestion des effets audio
  async applyAudioEffect(effect, options = {}) {
    if (!this.audioContext) return;

    try {
      switch (effect) {
        case 'reverb':
          await this.applyReverb(options);
          break;
        case 'delay':
          await this.applyDelay(options);
          break;
        case 'distortion':
          await this.applyDistortion(options);
          break;
        case 'filter':
          await this.applyFilter(options);
          break;
        default:
          console.warn(`⚠️ Effet audio inconnu: ${effect}`);
      }
    } catch (error) {
      console.error(`❌ Erreur application effet ${effect}:`, error);
    }
  }

  async applyReverb(options = {}) {
    // Implémentation de l'effet de réverbération
    console.log('🎵 Application de la réverbération...');
  }

  async applyDelay(options = {}) {
    // Implémentation de l'effet de délai
    console.log('🎵 Application du délai...');
  }

  async applyDistortion(options = {}) {
    // Implémentation de l'effet de distorsion
    console.log('🎵 Application de la distorsion...');
  }

  async applyFilter(options = {}) {
    // Implémentation du filtre audio
    console.log('🎵 Application du filtre...');
  }

  // Mise à jour de l'affichage
  updateAudioDisplay() {
    const results = this.search('', this.filters);
    this.dispatchEvent('audio:display:update', { results, filters: this.filters });
  }

  // Gestion des événements
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  // Getters
  getCurrentAudio() {
    return this.currentAudio;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getVolume() {
    return this.volume;
  }

  getQueue() {
    return [...this.audioQueue];
  }

  getAudioIndex() {
    return this.audioIndex;
  }

  getSearchIndex() {
    return this.searchIndex;
  }

  getFilters() {
    return { ...this.filters };
  }

  // Méthodes utilitaires
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  // Nettoyage
  destroy() {
    this.stopAudio();
    this.clearQueue();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🗑️ Gestionnaire audio détruit');
  }
}

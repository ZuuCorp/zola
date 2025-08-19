// Client-only web catalog fetcher for ZOLA using public APIs (no backend required)

export class WebCatalog {
  constructor() {
    this.tracks = [];
    this.albums = [];
    this.artistId = null;
    this.artistName = 'Zola';
    this.artistViewUrl = null;
    this.source = 'itunes';
  }

  async init() {
    try {
      await this.detectArtistId(this.artistName);
      if (this.artistId) {
        await this.fetchLookupAlbums(this.artistId);
        await this.fetchLookupTracks(this.artistId);
      } else {
        // Fallback: broad search
        await this.fetchItunesAlbums('Zola rap FR');
        await this.fetchItunesTracks('Zola rap FR');
      }
      this.dispatchEvent('catalog:loaded', {
        total: this.tracks.length,
        albums: this.albums.length,
        artistId: this.artistId,
        artistViewUrl: this.artistViewUrl
      });
    } catch (error) {
      console.warn('Catalog load failed', error);
    }
  }

  async detectArtistId(query) {
    try {
      const searchArtists = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=10&country=FR`;
      const res = await fetch(searchArtists, { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      const candidates = (data.results || []).filter(a => (a.artistName || '').toLowerCase() === 'zola');
      if (candidates.length === 0) return;

      const requiredTitles = ['Cicatrices', 'Survie', 'Diamant du Bled'];
      let best = { id: null, score: -1, viewUrl: null };
      for (const c of candidates) {
        const id = c.artistId;
        const lookupUrl = `https://itunes.apple.com/lookup?id=${id}&entity=album&limit=200&country=FR`;
        const lr = await fetch(lookupUrl, { mode: 'cors' });
        if (!lr.ok) continue;
        const ld = await lr.json();
        const albums = (ld.results || []).filter(r => r.wrapperType === 'collection');
        const names = new Set(albums.map(a => (a.collectionName || '').toLowerCase()));
        const score = requiredTitles.reduce((s, t) => s + (names.has(t.toLowerCase()) ? 1 : 0), 0);
        if (score > best.score) {
          best = { id, score, viewUrl: c.artistLinkUrl || c.artistViewUrl || null };
        }
      }
      if (best.id) {
        this.artistId = best.id;
        this.artistViewUrl = best.viewUrl;
      }
    } catch (e) {
      console.warn('detectArtistId failed', e);
    }
  }

  async fetchLookupAlbums(artistId) {
    const endpoint = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200&country=FR`;
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) return;
    const data = await response.json();
    this.albums = (data.results || [])
      .filter(item => item.wrapperType === 'collection')
      .map(item => ({
        id: item.collectionId,
        title: item.collectionName,
        cover: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        url: item.collectionViewUrl,
        artist: item.artistName,
        releaseDate: item.releaseDate
      }));
  }

  async fetchLookupTracks(artistId) {
    const endpoint = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=200&country=FR`;
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) return;
    const data = await response.json();
    this.tracks = (data.results || [])
      .filter(item => item.wrapperType === 'track')
      .map(item => ({
        id: item.trackId,
        title: item.trackName,
        album: item.collectionName,
        artist: item.artistName,
        cover: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        previewUrl: item.previewUrl,
        genre: item.primaryGenreName,
        releaseDate: item.releaseDate
      }))
      .filter(t => !!t.previewUrl);
  }

  async fetchItunesAlbums(artistQuery) {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(artistQuery)}&entity=album&limit=20&country=FR`;
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) return;
    const data = await response.json();
    this.albums = (data.results || [])
      .filter(item => item.collectionType === 'Album')
      .map(item => ({
        id: item.collectionId,
        title: item.collectionName,
        cover: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        url: item.collectionViewUrl,
        artist: item.artistName,
        releaseDate: item.releaseDate
      }));
  }

  async fetchItunesTracks(artistQuery) {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(artistQuery)}&entity=song&limit=100&country=FR`;
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) return;
    const data = await response.json();
    this.tracks = (data.results || []).map(item => ({
      id: item.trackId,
      title: item.trackName,
      album: item.collectionName,
      artist: item.artistName,
      cover: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      previewUrl: item.previewUrl,
      genre: item.primaryGenreName,
      releaseDate: item.releaseDate
    })).filter(t => !!t.previewUrl);
  }

  getTracks() {
    return this.tracks;
  }

  getAlbums() {
    return this.albums;
  }

  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }
}


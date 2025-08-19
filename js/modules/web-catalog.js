// Client-only web catalog fetcher for ZOLA using public APIs (no backend required)

export class WebCatalog {
  constructor() {
    this.tracks = [];
    this.albums = [];
    this.source = 'itunes';
  }

  async init() {
    try {
      await this.fetchItunesAlbums('Zola');
      await this.fetchItunesTracks('Zola');
      this.dispatchEvent('catalog:loaded', { total: this.tracks.length, albums: this.albums.length });
    } catch (error) {
      console.warn('Catalog load failed', error);
    }
  }

  async fetchItunesAlbums(artistQuery) {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(artistQuery)}&entity=album&limit=20&country=FR`;
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) return;
    const data = await response.json();
    this.albums = (data.results || [])
      .filter(item => item.collectionType === 'Album' || item.collectionType === 'Album')
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


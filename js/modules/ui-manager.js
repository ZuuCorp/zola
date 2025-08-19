export class UIManager {
  constructor(config) { this.config = config; }
  async init() { return; }
  showNotification(message, type = 'info') { console.log(`[${type}]`, message); }
}


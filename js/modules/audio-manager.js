export class AudioManager {
  constructor(config){ this.config = config; }
  async init(){ return; }
  pauseAll(){ if (this.current) this.current.pause?.(); }
  resumeAll(){ if (this.current) this.current.play?.(); }
  async playAudio(src){
    if (this.current) { try { this.current.pause(); } catch {}
    }
    const a = new Audio(src);
    this.current = a;
    await a.play();
  }
}
// Module de gestion de la configuration du site ZOLA

export class ConfigManager {
    constructor(config = null) {
        this.config = config;
        this.defaultConfig = this.getDefaultConfig();
    }

    static async load() {
        try {
            const response = await fetch('assets/config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            return new ConfigManager(config);
        } catch (error) {
            console.warn('Impossible de charger la configuration, utilisation des valeurs par défaut:', error);
            return new ConfigManager();
        }
    }

    getDefaultConfig() {
        return {
            audio: {
                sounds: {
                    missionPassed: {
                        src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                        type: "audio/wav",
                        description: "Son Mission Passed GTA 4"
                    },
                    gtatheme: {
                        src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                        type: "audio/wav",
                        description: "Thème GTA 4 ambiance urbaine"
                    }
                },
                music: {
                    origines: {
                        title: "Origines",
                        album: "EP - 2020",
                        src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                        type: "audio/wav",
                        duration: "3:45"
                    },
                    evolution: {
                        title: "Évolution",
                        album: "Album - 2022",
                        src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                        type: "audio/wav",
                        duration: "4:12"
                    },
                    nouveauMonde: {
                        title: "Nouveau Monde",
                        album: "Single - 2023",
                        src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
                        type: "audio/wav",
                        duration: "3:28"
                    }
                }
            },
            images: {
                logo: {
                    src: "https://via.placeholder.com/400x200/00ff41/000000?text=ZOLA",
                    alt: "Logo ZOLA",
                    description: "Logo principal de l'artiste"
                },
                sections: {
                    intro: {
                        src: "https://via.placeholder.com/300x300/00ff41/000000?text=Portrait+ZOLA",
                        alt: "Portrait ZOLA",
                        description: "Portrait de l'artiste ZOLA"
                    },
                    debuts: {
                        src: "https://via.placeholder.com/300x300/ff6b35/000000?text=Freestyles",
                        alt: "Premiers Freestyles",
                        description: "ZOLA en train de freestyler"
                    },
                    succes: {
                        src: "https://via.placeholder.com/300x300/ffd700/000000?text=EP+Origines",
                        alt: "EP Origines",
                        description: "Couverture de l'EP Origines"
                    },
                    albums: {
                        src: "https://via.placeholder.com/300x300/00ff41/000000?text=Album+Evolution",
                        alt: "Album Évolution",
                        description: "Couverture de l'album Évolution"
                    },
                    moments: {
                        src: "https://via.placeholder.com/300x300/ff6b35/000000?text=Recompenses",
                        alt: "Récompenses",
                        description: "Trophées et récompenses"
                    },
                    actuel: {
                        src: "https://via.placeholder.com/300x300/ffd700/000000?text=Projets+Futurs",
                        alt: "Projets Futurs",
                        description: "Futurs projets de ZOLA"
                    }
                }
            },
            colors: {
                primary: "#00ff41",
                secondary: "#ff6b35",
                accent: "#ffd700",
                dark: "#0a0a0a",
                darker: "#050505",
                text: "#ffffff",
                textSecondary: "#cccccc"
            },
            animations: {
                enabled: true,
                duration: {
                    fast: 300,
                    medium: 500,
                    slow: 800
                },
                easing: "cubic-bezier(0.4, 0, 0.2, 1)"
            },
            performance: {
                enableParticles: true,
                maxParticles: 50,
                enableParallax: true,
                enableRain: true
            }
        };
    }

    get(path, defaultValue = null) {
        if (!this.config) {
            return this.getFromDefault(path, defaultValue);
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return this.getFromDefault(path, defaultValue);
            }
        }

        return value !== undefined ? value : defaultValue;
    }

    getFromDefault(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.defaultConfig;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value !== undefined ? value : defaultValue;
    }

    set(path, value) {
        if (!this.config) {
            this.config = {};
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;

        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[lastKey] = value;
    }

    has(path) {
        return this.get(path) !== null;
    }

    merge(newConfig) {
        this.config = this.deepMerge(this.config || {}, newConfig);
    }

    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    validate() {
        const errors = [];
        
        // Validation de la configuration audio
        if (!this.get('audio.sounds.missionPassed.src')) {
            errors.push('Configuration audio manquante: missionPassed');
        }
        
        if (!this.get('audio.music.origines.src')) {
            errors.push('Configuration audio manquante: musique origines');
        }
        
        // Validation des couleurs
        if (!this.get('colors.primary')) {
            errors.push('Configuration des couleurs manquante');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    export() {
        return JSON.stringify(this.config || this.defaultConfig, null, 2);
    }

    reset() {
        this.config = null;
    }

    // Méthodes utilitaires
    getAudioConfig() {
        return this.get('audio', this.defaultConfig.audio);
    }

    getImageConfig() {
        return this.get('images', this.defaultConfig.images);
    }

    getColorConfig() {
        return this.get('colors', this.defaultConfig.colors);
    }

    getAnimationConfig() {
        return this.get('animations', this.defaultConfig.animations);
    }

    getPerformanceConfig() {
        return this.get('performance', this.defaultConfig.performance);
    }

    // Méthodes de debug
    debug() {
        console.group('🔧 ConfigManager Debug');
        console.log('Configuration actuelle:', this.config);
        console.log('Configuration par défaut:', this.defaultConfig);
        console.log('Validation:', this.validate());
        console.groupEnd();
    }
}

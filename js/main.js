// Fichier JavaScript principal pour le site ZOLA
// Initialisation et coordination de tous les modules

import { AudioManager } from './modules/audio-manager.js';
import { TimelineManager } from './modules/timeline-manager.js';
import { EffectsManager } from './modules/effects-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { ConfigManager } from './modules/config-manager.js';

class ZolaSite {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.config = null;
    }

    async init() {
        try {
            console.log('🚀 Initialisation du site ZOLA...');
            
            // Charger la configuration
            this.config = await ConfigManager.load();
            
            // Initialiser tous les modules
            await this.initializeModules();
            
            // Démarrer les effets visuels
            this.startVisualEffects();
            
            // Configurer les événements globaux
            this.setupGlobalEvents();
            
            this.isInitialized = true;
            console.log('✅ Site ZOLA initialisé avec succès !');
            
            // Déclencher l'événement d'initialisation
            this.dispatchEvent('zola:initialized');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeModules() {
        // Initialiser le gestionnaire de configuration
        this.modules.config = new ConfigManager(this.config);
        
        // Initialiser le gestionnaire audio
        this.modules.audio = new AudioManager(this.config.audio);
        
        // Initialiser le gestionnaire de timeline
        this.modules.timeline = new TimelineManager();
        
        // Initialiser le gestionnaire d'effets visuels
        this.modules.effects = new EffectsManager();
        
        // Initialiser le gestionnaire d'interface
        this.modules.ui = new UIManager(this.config);
        
        // Initialiser tous les modules
        const initPromises = Object.values(this.modules).map(module => 
            module.init ? module.init() : Promise.resolve()
        );
        
        await Promise.all(initPromises);
    }

    startVisualEffects() {
        // Démarrer l'effet de pluie
        this.modules.effects.startRain();
        
        // Démarrer les particules
        this.modules.effects.startParticles();
        
        // Démarrer les animations de scroll
        this.modules.effects.startScrollAnimations();
    }

    setupGlobalEvents() {
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.handleError(event.error);
        });

        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesse rejetée:', event.reason);
            this.handleError(event.reason);
        });

        // Gestion du redimensionnement
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Gestion de la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Gestion du scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 100);
        });
    }

    handleInitializationError(error) {
        // Afficher un message d'erreur à l'utilisateur
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-overlay';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h2>Erreur d'initialisation</h2>
                <p>Le site n'a pas pu se charger correctement.</p>
                <button onclick="location.reload()">Recharger la page</button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }

    handleError(error) {
        // Logger l'erreur
        console.error('Erreur gérée:', error);
        
        // Notifier l'utilisateur si nécessaire
        if (this.modules.ui) {
            this.modules.ui.showNotification('Une erreur est survenue', 'error');
        }
    }

    handleResize() {
        // Notifier tous les modules du redimensionnement
        Object.values(this.modules).forEach(module => {
            if (module.handleResize) {
                module.handleResize();
            }
        });
    }

    handlePageHidden() {
        // Pause des animations et audio quand la page n'est pas visible
        if (this.modules.audio) {
            this.modules.audio.pauseAll();
        }
        if (this.modules.effects) {
            this.modules.effects.pauseAnimations();
        }
    }

    handlePageVisible() {
        // Reprendre les animations et audio quand la page redevient visible
        if (this.modules.audio) {
            this.modules.audio.resumeAll();
        }
        if (this.modules.effects) {
            this.modules.effects.resumeAnimations();
        }
    }

    handleScroll() {
        // Optimisation des performances de scroll
        if (this.modules.effects) {
            this.modules.effects.handleScroll();
        }
    }

    // Méthodes utilitaires
    getModule(name) {
        return this.modules[name];
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    // Méthodes de debug
    debug() {
        console.group('🔍 Debug - Site ZOLA');
        console.log('État d\'initialisation:', this.isInitialized);
        console.log('Modules:', Object.keys(this.modules));
        console.log('Configuration:', this.config);
        console.groupEnd();
    }

    // Méthodes de performance
    getPerformanceMetrics() {
        const metrics = {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        return metrics;
    }
}

// Créer l'instance principale
const zolaSite = new ZolaSite();

// Initialiser le site quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    zolaSite.init();
});

// Exposer l'instance pour le debug
window.zolaSite = zolaSite;

// Exporter la classe pour utilisation dans d'autres modules
export { ZolaSite };

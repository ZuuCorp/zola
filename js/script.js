// Variables globales
let currentSection = 'intro';
let audioEnabled = true;
let themeMode = 'dark';
let missionPassedPlayed = new Set();
let currentAudio = null;
let rainDrops = [];

// Éléments DOM
const missionPassedAudio = document.getElementById('missionPassed');
const gtaThemeAudio = document.getElementById('gtatheme');
const toggleAudioBtn = document.getElementById('toggleAudio');
const toggleThemeBtn = document.getElementById('toggleTheme');
const missionOverlay = document.getElementById('missionPassedOverlay');
const timelineSections = document.querySelectorAll('.timeline-section');
const navButtons = document.querySelectorAll('.nav-btn');
const playButtons = document.querySelectorAll('.play-btn');
const rainContainer = document.querySelector('.rain-container');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeRain();
    initializeTimeline();
    initializeAudioControls();
    initializeMusicPlayer();
    initializeThemeToggle();
    initializeScrollAnimations();
    
    // Démarrer le thème GTA après le premier clic
    document.addEventListener('click', startGTATheme, { once: true });

    // Dynamic iTunes previews -> fill #dynamicTrackList
    const list = document.querySelector('#dynamicTrackList');
    if (list) {
        const renderTracks = (tracks) => {
            const fragment = document.createDocumentFragment();
            tracks.slice(0, 20).forEach(track => {
                const item = document.createElement('div');
                item.className = 'track';
                item.dataset.audio = track.previewUrl;
                item.innerHTML = `
                    <div class="track-info">
                        <span class="track-title">${track.title}</span>
                        <span class="track-album">${track.album}</span>
                    </div>
                    <button class="play-btn" aria-label="Lire ${track.title}"><i class="fas fa-play"></i></button>
                `;
                fragment.appendChild(item);
            });
            list.innerHTML = '';
            list.appendChild(fragment);
        };

        window.addEventListener('catalog:loaded', () => {
            if (window.zolaSite?.webCatalog) {
                const tracks = window.zolaSite.webCatalog.getTracks();
                renderTracks(tracks);
                renderGtaGridFromAlbums(window.zolaSite.webCatalog.getAlbums(), tracks);
            }
        });

        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.play-btn');
            if (!btn) return;
            const track = btn.closest('.track');
            const src = track?.dataset?.audio;
            if (src && window.zolaSite?.getModule('audio')) {
                window.zolaSite.getModule('audio').playAudio(src);
            }
        });
    }
});

function renderGtaGrid(tracks){
    const container = document.getElementById('gtaGrid');
    if (!container) return;

    const staticPhotos = [
        'https://i.scdn.co/image/ab6761610000e5ebba4d5d1f0d9c6e2177b4e9e2',
        'https://i.scdn.co/image/ab6761610000f178ba4d5d1f0d9c6e2177b4e9e2',
        'https://i.scdn.co/image/ab67616d0000b273b2d2d2a9d2f19d5c17b23a00'
    ];

    const items = [];
    tracks.slice(0, 9).forEach(t => {
        items.push({ img: t.cover, label: t.album || t.title });
    });
    staticPhotos.forEach((url, i) => items.push({ img: url, label: 'ZOLA' }));

    const fragment = document.createDocumentFragment();
    items.slice(0, 12).forEach(item => {
        const card = document.createElement('div');
        card.className = 'gta-card';
        card.innerHTML = `
            <img src="${item.img}" alt="${item.label}">
            <div class="gta-badge">${item.label}</div>
        `;
        fragment.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
}

function renderGtaGridFromAlbums(albums, tracks){
    const container = document.getElementById('gtaGrid');
    if (!container) return;
    const items = [];
    (albums || []).slice(0, 9).forEach(a => items.push({ img: a.cover, label: a.title, album: a }));
    if (items.length < 12) {
        (tracks || []).slice(0, 12 - items.length).forEach(t => items.push({ img: t.cover, label: t.title, track: t }));
    }
    const fragment = document.createDocumentFragment();
    items.slice(0, 12).forEach(item => {
        const card = document.createElement('div');
        card.className = 'gta-card';
        card.innerHTML = `
            <img src="${item.img}" alt="${item.label}">
            <div class="gta-badge">${item.label}</div>
        `;
        card.addEventListener('click', () => {
            if (item.album) openAlbumModal(item.album, tracks);
        });
        fragment.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
}

function openAlbumModal(album, tracks){
    const modal = document.getElementById('albumModal');
    const cover = document.getElementById('modalCover');
    const title = document.getElementById('modalTitle');
    const sub = document.getElementById('modalSub');
    const list = document.getElementById('modalTracklist');
    const link = document.getElementById('modalOpenApple');
    cover.src = album.cover;
    title.textContent = album.title;
    const year = (album.releaseDate || '').slice(0,4);
    sub.textContent = `${album.artist} · ${year || ''}`;
    link.href = album.url || '#';
    const related = (tracks || []).filter(t => t.album === album.title);
    const fragment = document.createDocumentFragment();
    related.slice(0, 20).forEach(t => {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<div>${t.title}</div><button class="play">Lecture</button>`;
        row.querySelector('.play').addEventListener('click', () => {
            if (window.zolaSite?.getModule('audio')) {
                window.zolaSite.getModule('audio').playAudio(t.previewUrl);
            }
        });
        fragment.appendChild(row);
    });
    list.innerHTML = '';
    list.appendChild(fragment);
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden','true');
        }
    }, { once: true });
}

// Initialisation de l'effet de pluie
function initializeRain() {
    for (let i = 0; i < 100; i++) {
        createRainDrop();
    }
}

function createRainDrop() {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDuration = (Math.random() * 2 + 1) + 's';
    drop.style.animationDelay = Math.random() * 2 + 's';
    
    rainContainer.appendChild(drop);
    rainDrops.push(drop);
    
    // Recréer la goutte après l'animation
    setTimeout(() => {
        if (drop.parentNode) {
            drop.remove();
            createRainDrop();
        }
    }, 3000);
}

// Initialisation de la timeline
function initializeTimeline() {
    // Observer pour détecter les sections visibles
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                activateSection(sectionId);
                
                // Jouer le son "Mission Passed" si c'est la première fois
                if (!missionPassedPlayed.has(sectionId)) {
                    playMissionPassed();
                    missionPassedPlayed.add(sectionId);
                    showMissionOverlay();
                }
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '-100px 0px -100px 0px'
    });

    timelineSections.forEach(section => {
        observer.observe(section);
    });

    // Navigation par clic
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            navigateToSection(targetSection);
        });
    });
}

// Activation d'une section
function activateSection(sectionId) {
    currentSection = sectionId;
    
    // Mettre à jour la navigation
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });

    // Activer la section
    timelineSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
}

// Navigation vers une section
function navigateToSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Initialisation des contrôles audio
function initializeAudioControls() {
    toggleAudioBtn.addEventListener('click', toggleAudio);
    
    // Mettre à jour l'icône selon l'état
    updateAudioIcon();
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    
    if (!audioEnabled) {
        // Arrêter tous les sons
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        gtaThemeAudio.pause();
        missionPassedAudio.pause();
    }
    
    updateAudioIcon();
}

function updateAudioIcon() {
    const icon = toggleAudioBtn.querySelector('i');
    if (audioEnabled) {
        icon.className = 'fas fa-volume-up';
    } else {
        icon.className = 'fas fa-volume-mute';
    }
}

// Initialisation du lecteur de musique
function initializeMusicPlayer() {
    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const track = btn.closest('.track');
            const audioSrc = track.dataset.audio;
            
            if (currentAudio && currentAudio.src.includes(audioSrc)) {
                // Même piste - play/pause
                if (currentAudio.paused) {
                    playTrack(audioSrc, btn);
                } else {
                    pauseTrack(btn);
                }
            } else {
                // Nouvelle piste
                if (currentAudio) {
                    pauseAllTracks();
                }
                playTrack(audioSrc, btn);
            }
        });
    });
}

function playTrack(audioSrc, btn) {
    if (!audioEnabled) return;
    
    currentAudio = new Audio(audioSrc);
    currentAudio.play();
    
    // Mettre à jour l'interface
    btn.innerHTML = '<i class="fas fa-pause"></i>';
    btn.classList.add('playing');
    
    // Gérer la fin de la piste
    currentAudio.addEventListener('ended', () => {
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.classList.remove('playing');
        currentAudio = null;
    });
}

function pauseTrack(btn) {
    if (currentAudio) {
        currentAudio.pause();
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.classList.remove('playing');
    }
}

function pauseAllTracks() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    playButtons.forEach(btn => {
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.classList.remove('playing');
    });
}

// Initialisation du toggle de thème
function initializeThemeToggle() {
    toggleThemeBtn.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    themeMode = themeMode === 'dark' ? 'light' : 'dark';
    
    if (themeMode === 'light') {
        document.body.classList.add('light-theme');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Initialisation des animations au scroll
function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px 0px'
    });

    // Observer les éléments avec des animations
    document.querySelectorAll('.fact-card, .track').forEach(el => {
        observer.observe(el);
    });
}

// Jouer le son "Mission Passed"
function playMissionPassed() {
    if (!audioEnabled) return;
    
    missionPassedAudio.currentTime = 0;
    missionPassedAudio.play().catch(e => {
        console.log('Audio autoplay blocked:', e);
    });
}

// Afficher l'overlay "Mission Passed"
function showMissionOverlay() {
    missionOverlay.style.display = 'flex';
    
    setTimeout(() => {
        missionOverlay.style.display = 'none';
    }, 2000);
}

// Démarrer le thème GTA
function startGTATheme() {
    if (!audioEnabled) return;
    
    // Utiliser un son de fond urbain/ambient
    gtaThemeAudio.volume = 0.3;
    gtaThemeAudio.play().catch(e => {
        console.log('GTA theme autoplay blocked:', e);
    });
}

// Effets de parallaxe au scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.timeline-section');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Animations au survol des éléments
document.addEventListener('DOMContentLoaded', () => {
    // Effet de glitch sur le logo
    const logo = document.querySelector('.logo');
    logo.addEventListener('mouseenter', () => {
        logo.style.textShadow = '0 0 30px var(--primary-color), 0 0 40px var(--primary-color), 0 0 50px var(--primary-color)';
        logo.style.transform = 'scale(1.05)';
    });
    
    logo.addEventListener('mouseleave', () => {
        logo.style.textShadow = '';
        logo.style.transform = '';
    });

    // Effets sur les cartes de fun facts
    const factCards = document.querySelectorAll('.fact-card');
    factCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--accent-color)';
            card.style.boxShadow = '0 0 30px var(--accent-color)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '';
            card.style.boxShadow = '';
        });
    });
});

// Gestion des erreurs audio
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'AUDIO') {
        console.log('Audio error:', e);
        // Remplacer par un son de fallback ou désactiver l'audio
        audioEnabled = false;
        updateAudioIcon();
    }
});

// Optimisation des performances
let ticking = false;

function updateOnScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Mettre à jour les animations de scroll ici
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', updateOnScroll);

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    // Recréer l'effet de pluie si nécessaire
    if (rainDrops.length < 50) {
        for (let i = 0; i < 25; i++) {
            createRainDrop();
        }
    }
});

// Animation de chargement initial
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Effet de particules pour l'ambiance
function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '2px';
    particle.style.height = '2px';
    particle.style.background = 'var(--primary-color)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '1';
    
    // Position aléatoire
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    
    document.body.appendChild(particle);
    
    // Animation de fade
    let opacity = 1;
    const fadeInterval = setInterval(() => {
        opacity -= 0.02;
        particle.style.opacity = opacity;
        
        if (opacity <= 0) {
            clearInterval(fadeInterval);
            particle.remove();
        }
    }, 50);
}

// Créer des particules périodiquement
setInterval(createParticle, 2000);

// Effet de distorsion sur le texte au survol
document.addEventListener('DOMContentLoaded', () => {
    const textElements = document.querySelectorAll('h2, h3, .track-title');
    
    textElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            element.style.filter = 'hue-rotate(90deg)';
            element.style.transform = 'skew(-2deg)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.filter = '';
            element.style.transform = '';
        });
    });
});

// Système de notifications pour les événements
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: var(--dark-bg);
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: bold;
        box-shadow: var(--neon-glow);
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animation de sortie
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Exemple d'utilisation des notifications
// showNotification('Nouvelle section débloquée !', 'success');

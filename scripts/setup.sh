#!/bin/bash

# Script de configuration pour le site ZOLA
# Installe toutes les dépendances et configure le projet

set -e

echo "🚀 Configuration du site ZOLA..."

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    print_status "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé. Veuillez l'installer avec Node.js"
        exit 1
    fi
    
    # Vérifier la version de Node.js
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ est requis. Version actuelle: $(node -v)"
        exit 1
    fi
    
    print_success "Prérequis vérifiés: Node.js $(node -v), npm $(npm -v)"
}

# Installer les dépendances
install_dependencies() {
    print_status "Installation des dépendances..."
    
    # Installer les dépendances principales
    npm install
    
    # Installer Puppeteer globalement pour le scraping
    if ! command -v puppeteer &> /dev/null; then
        print_status "Installation de Puppeteer..."
        npm install -g puppeteer
    fi
    
    print_success "Dépendances installées"
}

# Créer la structure des dossiers
create_directories() {
    print_status "Création de la structure des dossiers..."
    
    # Dossiers principaux
    mkdir -p assets/{audio/{songs,effects,interviews,albums/{origines,evolution,nouveau-monde}},images,fonts}
    mkdir -p css js/modules components public scripts
    mkdir -p .github/workflows
    
    # Dossiers de développement
    mkdir -p dist coverage
    
    print_success "Structure des dossiers créée"
}

# Configurer Git
setup_git() {
    print_status "Configuration de Git..."
    
    if [ ! -d .git ]; then
        git init
        print_status "Dépôt Git initialisé"
    fi
    
    # Ajouter les fichiers au staging
    git add .
    
    # Premier commit
    if git diff --cached --quiet; then
        print_status "Aucun changement à committer"
    else
        git commit -m "Initial commit: Configuration du site ZOLA"
        print_success "Premier commit effectué"
    fi
    
    print_success "Git configuré"
}

# Configurer les hooks Git
setup_git_hooks() {
    print_status "Configuration des hooks Git..."
    
    # Installer Husky
    npx husky install
    
    # Créer le hook pre-commit
    npx husky add .husky/pre-commit "npm run lint:fix && npm run format"
    
    print_success "Hooks Git configurés"
}

# Configurer l'environnement de développement
setup_dev_environment() {
    print_status "Configuration de l'environnement de développement..."
    
    # Créer le fichier .env
    if [ ! -f .env ]; then
        cat > .env << EOF
# Configuration de l'environnement de développement
NODE_ENV=development
VITE_APP_TITLE=ZOLA Site Officiel
VITE_APP_DESCRIPTION=Site vitrine interactif de l'artiste ZOLA
VITE_APP_VERSION=1.0.0

# Configuration audio
VITE_AUDIO_ENABLED=true
VITE_AUDIO_VOLUME=0.7

# Configuration des API
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Configuration du scraping
VITE_SCRAPING_ENABLED=true
VITE_SCRAPING_DELAY=3000
VITE_SCRAPING_MAX_RESULTS=20
EOF
        print_success "Fichier .env créé"
    fi
    
    # Créer le fichier .env.example
    if [ ! -f .env.example ]; then
        cp .env .env.example
        # Remplacer les valeurs sensibles par des placeholders
        sed -i '' 's/=.*/=your_value_here/g' .env.example
        print_success "Fichier .env.example créé"
    fi
}

# Configurer le scraping
setup_scraping() {
    print_status "Configuration du scraping..."
    
    # Rendre le script de scraping exécutable
    chmod +x scripts/scrape-zola-audio.js
    
    # Créer un script de lancement
    cat > scripts/run-scraper.sh << 'EOF'
#!/bin/bash
echo "🎵 Lancement du scraper audio ZOLA..."
node scripts/scrape-zola-audio.js
EOF
    
    chmod +x scripts/run-scraper.sh
    
    print_success "Scraping configuré"
}

# Configurer les tests
setup_testing() {
    print_status "Configuration des tests..."
    
    # Créer le dossier de tests
    mkdir -p js/__tests__
    
    # Créer un fichier de test de base
    cat > js/__tests__/audio-manager.test.js << 'EOF'
import { AudioManager } from '../modules/audio-manager.js';

describe('AudioManager', () => {
  let audioManager;
  
  beforeEach(() => {
    audioManager = new AudioManager({});
  });
  
  afterEach(() => {
    if (audioManager) {
      audioManager.destroy();
    }
  });
  
  test('should initialize correctly', () => {
    expect(audioManager).toBeDefined();
    expect(audioManager.getVolume()).toBe(0.7);
  });
  
  test('should handle volume changes', () => {
    audioManager.setVolume(0.5);
    expect(audioManager.getVolume()).toBe(0.5);
  });
});
EOF
    
    print_success "Tests configurés"
}

# Configurer le build
setup_build() {
    print_status "Configuration du build..."
    
    # Créer un script de build personnalisé
    cat > scripts/build.sh << 'EOF'
#!/bin/bash
echo "🔨 Construction du projet ZOLA..."

# Nettoyer le dossier de build
rm -rf dist

# Construire le projet
npm run build

# Copier les assets
cp -r assets dist/
cp -r public dist/

# Optimiser les images
if command -v imagemin &> /dev/null; then
    echo "🖼️ Optimisation des images..."
    npx imagemin assets/images/* --out-dir=dist/assets/images
fi

# Vérifier la taille du build
echo "📊 Taille du build:"
du -sh dist/*

echo "✅ Build terminé"
EOF
    
    chmod +x scripts/build.sh
    
    print_success "Build configuré"
}

# Configurer le déploiement
setup_deployment() {
    print_status "Configuration du déploiement..."
    
    # Créer un script de déploiement
    cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Déploiement du site ZOLA..."

# Construire le projet
./scripts/build.sh

# Déployer sur GitHub Pages
npm run deploy

echo "✅ Déploiement terminé"
echo "🌐 Site accessible sur: https://username.github.io/zola-site"
EOF
    
    chmod +x scripts/deploy.sh
    
    print_success "Déploiement configuré"
}

# Vérifier la configuration
verify_setup() {
    print_status "Vérification de la configuration..."
    
    # Vérifier que tous les fichiers sont présents
    required_files=(
        "package.json"
        "vite.config.js"
        "postcss.config.js"
        ".eslintrc.js"
        ".prettierrc"
        "components/index.html"
        "css/main.css"
        "js/main.js"
        "scripts/scrape-zola-audio.js"
        "public/manifest.json"
        "public/sw.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file manquant"
        fi
    done
    
    # Vérifier la structure des dossiers
    required_dirs=(
        "assets/audio"
        "css"
        "js/modules"
        "components"
        "public"
        "scripts"
        ".github/workflows"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "✓ $dir/"
        else
            print_error "✗ $dir/ manquant"
        fi
    done
}

# Afficher les informations finales
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Configuration terminée avec succès !${NC}"
    echo ""
    echo "📁 Structure du projet créée"
    echo "📦 Dépendances installées"
    echo "🔧 Outils de développement configurés"
    echo "🎵 Système de scraping configuré"
    echo "🧪 Tests configurés"
    echo "🚀 Déploiement configuré"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "  1. Lancer le scraper: ./scripts/run-scraper.sh"
    echo "  2. Démarrer le développement: npm run dev"
    echo "  3. Lancer les tests: npm test"
    echo "  4. Construire le projet: npm run build"
    echo "  5. Déployer: ./scripts/deploy.sh"
    echo ""
    echo "📚 Documentation: README.md"
    echo "🐛 Issues: GitHub Issues"
    echo "💬 Support: GitHub Discussions"
}

# Fonction principale
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  CONFIGURATION DU SITE ZOLA${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    
    check_prerequisites
    create_directories
    install_dependencies
    setup_git
    setup_git_hooks
    setup_dev_environment
    setup_scraping
    setup_testing
    setup_build
    setup_deployment
    verify_setup
    show_final_info
}

# Exécuter le script principal
main "$@"

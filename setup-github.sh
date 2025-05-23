#!/bin/bash

# 🐱 CryptoGato - Script de Configuración para GitHub
# Este script te ayuda a preparar el proyecto para subirlo a GitHub

echo "🐱 ==============================================="
echo "   CryptoGato - Configuración para GitHub"
echo "==============================================="

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instálalo primero."
    exit 1
fi

echo "✅ Git encontrado: $(git --version)"

# Crear .env de ejemplo si no existe
if [ ! -f .env.example ]; then
    echo "📝 Creando .env.example..."
    cat > .env.example << 'EOF'
# Configuración de Red BSC
PRIVATE_KEY=tu_clave_privada_aqui_sin_0x
BSCSCAN_API_KEY=tu_api_key_de_bscscan

# URLs de RPC (opcional)
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/

# Configuración de DApp
REACT_APP_WALLETCONNECT_PROJECT_ID=tu_walletconnect_project_id
REACT_APP_CHAIN_ID=97
EOF
fi

# Inicializar repositorio Git si no existe
if [ ! -d .git ]; then
    echo "🔧 Inicializando repositorio Git..."
    git init
    git add .
    git commit -m "🎉 Initial commit: CryptoGato DeFi Ecosystem"
    echo "✅ Repositorio Git inicializado"
else
    echo "✅ Repositorio Git ya existe"
fi

# Verificar archivos importantes
echo "🔍 Verificando archivos importantes..."

required_files=("README.md" "package.json" "hardhat.config.js" "LICENSE" ".gitignore")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ Todos los archivos necesarios están presentes"
else
    echo "⚠️  Archivos faltantes: ${missing_files[*]}"
fi

# Verificar estructura de directorios
echo "🗂️  Verificando estructura de directorios..."

required_dirs=("contracts" "scripts" "test" "src" "docs")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (faltante)"
    fi
done

# Limpiar archivos innecesarios para GitHub
echo "🧹 Limpiando archivos innecesarios..."

# Eliminar directorios que no deben ir a GitHub
dirs_to_clean=("node_modules" "cache" "artifacts" ".env")
for dir in "${dirs_to_clean[@]}"; do
    if [ -e "$dir" ]; then
        echo "🗑️  Eliminando $dir"
        rm -rf "$dir"
    fi
done

# Verificar que no hay claves privadas expuestas
echo "🔐 Verificando seguridad..."

if grep -r "PRIVATE_KEY.*[0-9a-fA-F]\{64\}" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null; then
    echo "⚠️  ADVERTENCIA: Posible clave privada encontrada en el código"
    echo "   Asegúrate de usar variables de entorno (.env)"
else
    echo "✅ No se encontraron claves privadas expuestas"
fi

# Crear comandos de Git sugeridos
echo ""
echo "🚀 ==============================================="
echo "   SIGUIENTE: Subir a GitHub"
echo "==============================================="
echo ""
echo "1️⃣  Crea un nuevo repositorio en GitHub:"
echo "   https://github.com/new"
echo ""
echo "2️⃣  Ejecuta estos comandos en tu terminal:"
echo ""
echo "   # Añadir remote origin (reemplaza con tu URL)"
echo "   git remote add origin https://github.com/tu-usuario/cryptogato-token.git"
echo ""
echo "   # Verificar estado"
echo "   git status"
echo ""
echo "   # Añadir todos los archivos"
echo "   git add ."
echo ""
echo "   # Hacer commit si hay cambios"
echo "   git commit -m \"📝 Update project for GitHub\""
echo ""
echo "   # Subir a GitHub"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Configurar secrets en GitHub:"
echo "   Settings → Secrets and variables → Actions"
echo "   - PRIVATE_KEY"
echo "   - BSCSCAN_API_KEY"
echo ""
echo "4️⃣  Después del primer push, configura:"
echo "   - Descripción del repositorio"
echo "   - Topics: blockchain, defi, bsc, smart-contracts"
echo "   - GitHub Pages (si quieres demo online)"
echo ""
echo "✨ ¡Tu proyecto estará listo para colaboradores!"
echo ""
echo "📚 Recursos útiles:"
echo "   - README.md: Documentación principal"
echo "   - docs/WHITEPAPER.md: Documentación técnica"
echo "   - CONTRIBUTING.md: Guía para contribuidores"
echo ""
echo "🐱 ¡CryptoGato listo para conquistar GitHub!"
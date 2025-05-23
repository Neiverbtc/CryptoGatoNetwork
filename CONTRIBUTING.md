# 🤝 Guía de Contribución - CryptoGato

¡Gracias por tu interés en contribuir al proyecto CryptoGato! Esta guía te ayudará a empezar.

## 📋 Índice

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Pull Requests](#pull-requests)

## 🤝 Código de Conducta

Este proyecto adhiere a un código de conducta profesional. Al participar, te comprometes a mantener un ambiente respetuoso y colaborativo.

## 🚀 Cómo Contribuir

### Tipos de Contribuciones

- 🐛 **Reportar bugs**
- 💡 **Sugerir nuevas características**
- 📖 **Mejorar documentación**
- 🔧 **Escribir código**
- 🧪 **Mejorar tests**
- 🔍 **Auditorías de seguridad**

### Reportar Issues

Al reportar un bug, incluye:

```markdown
**Descripción del Bug**
Descripción clara del problema.

**Pasos para Reproducir**
1. Ve a '...'
2. Haz clic en '....'
3. Ejecuta '....'
4. Ve el error

**Comportamiento Esperado**
Qué esperabas que pasara.

**Screenshots**
Si aplica, agrega capturas de pantalla.

**Entorno**
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.16.0]
- Hardhat: [e.g. 2.19.0]
```

## ⚙️ Configuración del Entorno

### Prerrequisitos

```bash
# Node.js v18 o superior
node --version

# Git
git --version

# Recomendado: VS Code con extensiones
code --version
```

### Configuración Inicial

```bash
# Fork y clonar
git clone https://github.com/tu-usuario/cryptogato-token.git
cd cryptogato-token

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves
```

### Extensiones Recomendadas (VS Code)

```json
{
  "recommendations": [
    "juanblanco.solidity",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## 🔄 Proceso de Desarrollo

### 1. Crear una Rama

```bash
# Crear rama para nueva característica
git checkout -b feature/descripcion-corta

# Crear rama para bug fix
git checkout -b fix/descripcion-del-bug

# Crear rama para documentación
git checkout -b docs/mejora-documentacion
```

### 2. Desarrollo

```bash
# Compilar contratos
npm run compile

# Ejecutar tests durante desarrollo
npm run test:watch

# Verificar linting
npm run lint

# Formatear código
npm run format
```

### 3. Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests de gas
npm run test:gas

# Tests específicos
npx hardhat test test/CryptoGato.test.js
```

## 📝 Estándares de Código

### Solidity

```solidity
// ✅ Correcto
contract CryptoGato is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;
    
    mapping(address => bool) public isMinter;
    
    event MinterAdded(address indexed minter);
    
    modifier onlyMinter() {
        require(isMinter[msg.sender], "Not a minter");
        _;
    }
}
```

### JavaScript/React

```javascript
// ✅ Correcto
const PresaleSection = ({ walletAddress, isConnected }) => {
  const [loading, setLoading] = useState(false);
  
  const handlePurchase = async (amount) => {
    try {
      setLoading(true);
      // lógica de compra
    } catch (error) {
      console.error('Error en compra:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="presale-container">
      {/* JSX */}
    </div>
  );
};
```

### Convenciones de Nombres

- **Contratos:** PascalCase (`CryptoGato`)
- **Funciones:** camelCase (`addMinter`)
- **Variables:** camelCase (`maxSupply`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_SUPPLY`)
- **Archivos:** kebab-case (`crypto-gato.test.js`)

## 🧪 Testing

### Estructura de Tests

```javascript
describe("CryptoGato", function () {
  let cryptoGato;
  let owner, addr1, addr2;
  
  beforeEach(async function () {
    // Setup
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // Test
    });
  });
  
  describe("Minting", function () {
    it("Should mint tokens correctly", async function () {
      // Test
    });
  });
});
```

### Cobertura Mínima

- **Contratos principales:** >95%
- **Funciones críticas:** 100%
- **Edge cases:** Cubrir escenarios límite

## 🔀 Pull Requests

### Antes de Enviar

```bash
# Verificar que todo esté bien
npm run lint
npm test
npm run test:coverage
```

### Formato del PR

```markdown
## 📝 Descripción

Breve descripción de los cambios.

## 🔄 Tipo de Cambio

- [ ] Bug fix (cambio que soluciona un issue)
- [ ] Nueva característica (cambio que añade funcionalidad)
- [ ] Breaking change (cambio que hace que funcionalidad existente no funcione)
- [ ] Documentación

## 🧪 Testing

- [ ] Tests añadidos/actualizados
- [ ] Todos los tests pasan
- [ ] Cobertura mantenida/mejorada

## 📋 Checklist

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] No hay console.logs de debug
```

### Proceso de Review

1. **Automatico:** Tests y linting
2. **Manual:** Review de código por mantenedores
3. **Testing:** Pruebas en entorno de desarrollo
4. **Merge:** Integración a main branch

## 🏷️ Versionado

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR:** Cambios incompatibles en API
- **MINOR:** Nueva funcionalidad compatible
- **PATCH:** Bug fixes compatibles

## 📞 Comunicación

### Canales

- 🐛 **Issues:** Para bugs y features
- 💬 **Discussions:** Para preguntas generales
- 📧 **Email:** Para temas sensibles
- 🗨️ **Discord:** Para chat en tiempo real

### Etiquetas de Issues

- `bug` - Algo no funciona
- `enhancement` - Nueva característica
- `documentation` - Mejoras en docs
- `good first issue` - Bueno para newcomers
- `help wanted` - Se necesita ayuda extra
- `security` - Relacionado con seguridad

## 🎯 Áreas de Contribución

### 🔥 High Priority

- Tests de integración multi-DEX
- Optimización de gas
- Documentación de APIs
- Auditorías de seguridad

### 🔬 Research

- Nuevos DEXs para integrar
- Algoritmos de optimización
- Mecanismos de governance
- Cross-chain compatibility

### 🎨 Frontend

- Mejoras de UX/UI
- Responsive design
- Accessibility
- Performance optimization

## 🎖️ Reconocimientos

Los contribuidores aparecerán en:

- README.md
- Release notes
- Hall of Fame en website
- Tokens de agradecimiento (si aplica)

## ❓ ¿Preguntas?

No dudes en:

- Abrir un issue de discusión
- Contactar a los mantenedores
- Unirte a nuestro Discord
- Revisar la documentación existente

---

¡Gracias por contribuir a CryptoGato! 🐱✨
# Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Corrección Automática!

---

## 📋 Tabla de Contenidos

- [Entorno de Desarrollo](#entorno-de-desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Debugging](#debugging)
- [Crear Pull Requests](#crear-pull-requests)

---

## 🛠️ Entorno de Desarrollo

### Requisitos

- Docker Desktop instalado
- Node.js 20+ (para desarrollo sin Docker)
- Git
- Editor de código (VS Code recomendado)

### Setup Inicial

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion

# Setup con Docker
make setup
make start

# Ver logs
make logs-f
```

### Desarrollo Local (Sin Docker)

Si prefieres desarrollar sin Docker:

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

#### Frontend
```bash
cd frontend-correccion-automatica-n8n
npm install
cp .env.example .env
# Editar .env
npm run dev
```

#### N8N
```bash
# Usar imagen Docker de N8N
docker run -d -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```

---

## 📁 Estructura del Proyecto

```
proyecto-correccion/
├── backend/                    # API Express + MongoDB
│   ├── src/
│   │   ├── app.js             # Entrada de la app
│   │   ├── models/            # Modelos de MongoDB
│   │   ├── routes/            # Rutas de la API
│   │   ├── controllers/       # Controladores
│   │   └── middleware/        # Middlewares
│   ├── Dockerfile
│   └── package.json
│
├── frontend-correccion-automatica-n8n/  # Frontend React
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── n8n/                       # Configuración de N8N
│   ├── workflows/             # Workflows JSON
│   ├── data/                  # Datos persistentes
│   ├── Dockerfile.preconfigured
│   └── README-PRECONFIGURACION.md
│
├── scripts/                   # Scripts de utilidad
│   ├── setup.sh
│   ├── check-env.sh
│   └── troubleshoot.sh
│
├── docker-compose.yml         # Orquestación
├── Makefile                   # Comandos simples
├── .env.example               # Variables de entorno
└── README.md                  # Documentación principal
```

---

## 🔄 Flujo de Trabajo

### 1. Crear una Rama

```bash
git checkout -b feature/nombre-feature
# o
git checkout -b fix/nombre-fix
```

### 2. Hacer Cambios

Desarrolla tu feature o fix:

```bash
# Si usas Docker
make restart-backend  # Después de cambios en backend
make restart-frontend # Después de cambios en frontend

# Ver logs
make logs-backend
make logs-frontend
```

### 3. Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend-correccion-automatica-n8n
npm test
```

### 4. Commit

```bash
git add .
git commit -m "feat: descripción del cambio"
# o
git commit -m "fix: descripción del fix"
```

**Formato de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (sin afectar código)
- `refactor:` Refactorización
- `test:` Agregar o modificar tests
- `chore:` Cambios en build, configuración, etc.

### 5. Push y Pull Request

```bash
git push origin feature/nombre-feature
```

Luego crea un Pull Request en GitHub.

---

## 📝 Estándares de Código

### Backend (JavaScript/Node.js)

```javascript
// Usar ESM (ES Modules)
import express from 'express';

// Nombres descriptivos
const getUserById = async (id) => {
  // ...
};

// Async/await sobre callbacks
try {
  const user = await User.findById(id);
} catch (error) {
  console.error('Error:', error);
}

// Validación de inputs
if (!id) {
  return res.status(400).json({ error: 'ID requerido' });
}
```

### Frontend (TypeScript/React)

```typescript
// Usar TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

// Componentes funcionales con hooks
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  return <div>{user?.name}</div>;
};

// Nombres descriptivos
const handleSubmit = () => { /* ... */ };
```

### Workflows N8N

- Nombres descriptivos de workflows
- Comentarios en nodos complejos
- Manejo de errores en nodos HTTP
- Validación de datos antes de procesar

---

## 🧪 Testing

### Backend

```bash
cd backend

# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Frontend

```bash
cd frontend-correccion-automatica-n8n

# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

### Testing Manual

```bash
# Iniciar stack completo
make start

# Probar endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/users

# Probar frontend
# Abrir http://localhost:3000 en navegador

# Probar N8N
curl -X POST http://localhost:5678/webhook/test
```

---

## 🐛 Debugging

### Debugging Backend con Docker

```bash
# Ver logs en tiempo real
make logs-backend

# Acceder a shell del container
make shell-backend

# Dentro del container:
node --version
npm list
env | grep MONGODB
```

### Debugging Frontend

```bash
# Ver logs
make logs-frontend

# Build local para ver errores
cd frontend-correccion-automatica-n8n
npm run build
```

### Debugging con VS Code

**`.vscode/launch.json`** (Backend):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Docker: Attach to Backend",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    }
  ]
}
```

Luego en `docker-compose.yml`:
```yaml
backend:
  command: node --inspect=0.0.0.0:9229 src/app.js
  ports:
    - "9229:9229"  # Puerto de debugging
```

### Debugging N8N Workflows

1. Acceder a N8N: http://localhost:5678
2. Abrir workflow
3. Ejecutar manualmente (botón "Execute Workflow")
4. Ver output de cada nodo
5. Revisar logs: `make logs-n8n`

---

## 🔨 Desarrollo de Features

### Agregar Nueva Ruta al Backend

1. Crear controlador en `backend/src/controllers/`
2. Crear ruta en `backend/src/routes/`
3. Registrar ruta en `backend/src/app.js`
4. Agregar validación de inputs
5. Documentar endpoint

**Ejemplo:**
```javascript
// controllers/exampleController.js
export const getExample = async (req, res) => {
  try {
    const data = await ExampleModel.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// routes/exampleRoutes.js
import express from 'express';
import { getExample } from '../controllers/exampleController.js';

const router = express.Router();
router.get('/examples', getExample);

export default router;

// app.js
import exampleRoutes from './routes/exampleRoutes.js';
app.use('/api', exampleRoutes);
```

### Agregar Nueva Página al Frontend

1. Crear componente en `frontend/src/pages/`
2. Agregar ruta en `frontend/src/App.tsx`
3. Crear servicio API si es necesario
4. Agregar navegación

**Ejemplo:**
```typescript
// pages/ExamplePage.tsx
import React from 'react';

const ExamplePage: React.FC = () => {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  );
};

export default ExamplePage;

// App.tsx
import ExamplePage from './pages/ExamplePage';

<Route path="/example" element={<ExamplePage />} />
```

### Agregar Nuevo Workflow N8N

1. Crear workflow en N8N UI (http://localhost:5678)
2. Exportar como JSON
3. Guardar en `n8n/workflows/`
4. Documentar en README del directorio n8n

---

## 📦 Build y Deploy

### Build Local

```bash
# Build backend
cd backend
npm run build  # Si tiene build script

# Build frontend
cd frontend-correccion-automatica-n8n
npm run build

# Build con Docker
make build
```

### Build para Producción

```bash
# Reconstruir sin caché
make rebuild

# Verificar imágenes
docker images | grep correcion
```

### Preconfigurar N8N

Ver `n8n/README-PRECONFIGURACION.md` para crear imagen preconfigurada.

---

## 📤 Crear Pull Requests

### Checklist antes de crear PR

- [ ] Código sigue los estándares del proyecto
- [ ] Tests pasan (`npm test`)
- [ ] Sin errores de linting
- [ ] Documentación actualizada si es necesario
- [ ] Commits con mensajes descriptivos
- [ ] Branch actualizada con `main`:
  ```bash
  git checkout main
  git pull
  git checkout feature/tu-branch
  git merge main
  ```

### Template de Pull Request

```markdown
## Descripción
Breve descripción del cambio

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se probó?
Describe los tests que ejecutaste

## Checklist
- [ ] Mi código sigue los estándares
- [ ] Agregué tests
- [ ] Actualicé documentación
- [ ] Tests pasan
```

---

## 🤝 Convenciones

### Nombres de Archivos

- **Backend:** `camelCase.js` (ej: `userController.js`)
- **Frontend:** `PascalCase.tsx` para componentes (ej: `UserProfile.tsx`)
- **Configs:** `kebab-case` (ej: `docker-compose.yml`)

### Nombres de Variables

- **JavaScript:** `camelCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Componentes React:** `PascalCase`

### Nombres de Rutas API

- **REST:** `/api/recurso` (plural)
- **Ejemplos:** `/api/users`, `/api/submissions`

---

## 🆘 Obtener Ayuda

### Recursos

- **Documentación:** Ver archivos README.md en cada directorio
- **Issues:** Revisar issues existentes en GitHub
- **Troubleshooting:** `make troubleshoot`

### Reportar Bugs

Crea un issue con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Logs relevantes
- Screenshots si aplica

---

## 📚 Recursos Adicionales

- **Docker:** https://docs.docker.com/
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **N8N:** https://docs.n8n.io/
- **MongoDB:** https://www.mongodb.com/docs/

---

¡Gracias por contribuir! 🎉

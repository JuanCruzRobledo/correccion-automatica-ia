# ⚡ Quick Start - Inicio Rápido

Ejecuta el sistema en **3 comandos y 10 minutos**.

---

## 📦 Requisitos

- ✅ [Docker Desktop](https://docs.docker.com/get-docker/) instalado y corriendo
- ✅ [Git](https://git-scm.com/downloads) instalado

---

## 🚀 Instalación (3 Pasos)

### 1️⃣ Clonar

```bash
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion
```

### 2️⃣ Setup

```bash
make setup
```

Edita `.env` y actualiza:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/correcion-automatica
```

### 3️⃣ Iniciar

```bash
make start
```

---

## ✅ Verificar

Accede a:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000/health
- **N8N:** http://localhost:5678 (admin/admin123)

---

## 📋 Comandos Esenciales

### Windows (scripts .bat)
```batch
start.bat        # Iniciar
stop.bat         # Detener
```

### Linux/Mac (scripts .sh o make)
```bash
# Con scripts
./start.sh       # Iniciar
./stop.sh        # Detener

# Con make
make start       # Iniciar
make stop        # Detener
make logs-f      # Ver logs
make status      # Ver estado
make restart     # Reiniciar
make help        # Ver todos los comandos
```

---

## 🐛 Problemas?

```bash
make troubleshoot   # Diagnóstico automático
make check-env      # Verificar configuración
```

**Ver guía completa:** [README-DOCKER.md](README-DOCKER.md)

---

## 📚 Documentación

- **Guía completa Docker:** [README-DOCKER.md](README-DOCKER.md)
- **Documentación principal:** [README.md](README.md)
- **Troubleshooting de red:** [NETWORKING.md](NETWORKING.md)
- **Configurar N8N:** [n8n/README-PRECONFIGURACION.md](n8n/README-PRECONFIGURACION.md)

/**
 * Rutas de Configuraciones del Sistema
 * Solo accesible por super-admin
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSystemConfig,
  getAllSystemConfigs,
  updateSystemConfig
} from '../controllers/systemConfigController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/system-config - Listar todas las configuraciones
router.get('/', getAllSystemConfigs);

// GET /api/system-config/:key - Obtener una configuración específica
router.get('/:key', getSystemConfig);

// PUT /api/system-config/:key - Actualizar una configuración
router.put('/:key', updateSystemConfig);

export default router;

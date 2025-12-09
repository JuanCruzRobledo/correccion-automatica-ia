/**
 * Controlador de Configuraciones del Sistema
 */
import SystemConfig from '../models/SystemConfig.js';

/**
 * Obtener una configuración del sistema por clave
 * GET /api/system-config/:key
 * @access Private (solo super-admin)
 */
export const getSystemConfig = async (req, res) => {
  try {
    const { key } = req.params;

    // Solo super-admin puede acceder
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo super-admin puede acceder a configuraciones del sistema.',
      });
    }

    const config = await SystemConfig.findOne({ key });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuración '${key}' no encontrada`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
  } catch (error) {
    console.error('Error al obtener configuración del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración del sistema',
      error: error.message,
    });
  }
};

/**
 * Listar todas las configuraciones del sistema
 * GET /api/system-config
 * @access Private (solo super-admin)
 */
export const getAllSystemConfigs = async (req, res) => {
  try {
    // Solo super-admin puede acceder
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo super-admin puede acceder a configuraciones del sistema.',
      });
    }

    const configs = await SystemConfig.find();

    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs.map(c => ({
        key: c.key,
        value: c.value,
        description: c.description,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error al obtener configuraciones del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuraciones del sistema',
      error: error.message,
    });
  }
};

/**
 * Actualizar una configuración del sistema
 * PUT /api/system-config/:key
 * @access Private (solo super-admin)
 */
export const updateSystemConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    // Solo super-admin puede acceder
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo super-admin puede modificar configuraciones del sistema.',
      });
    }

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El campo value es requerido',
      });
    }

    const config = await SystemConfig.setValue(key, value, description);

    res.status(200).json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
  } catch (error) {
    console.error('Error al actualizar configuración del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración del sistema',
      error: error.message,
    });
  }
};

export default {
  getSystemConfig,
  getAllSystemConfigs,
  updateSystemConfig,
};

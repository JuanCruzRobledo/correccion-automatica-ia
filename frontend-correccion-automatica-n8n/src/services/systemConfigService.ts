/**
 * Servicio para gestionar configuraciones del sistema
 * Solo accesible por super-admin
 */
import api from './api';

interface SystemConfig {
  key: string;
  value: any;
  description?: string;
}

/**
 * Obtener una configuración específica por clave
 */
const getSystemConfig = async (key: string): Promise<SystemConfig> => {
  const response = await api.get(`/system-config/${key}`);
  return response.data.data;
};

/**
 * Obtener la URL de la carpeta raíz de Google Drive
 */
const getRootFolderUrl = async (): Promise<string | null> => {
  try {
    const config = await getSystemConfig('root_folder_url');
    return config.value;
  } catch (error) {
    console.error('Error al obtener root_folder_url:', error);
    return null;
  }
};

/**
 * Listar todas las configuraciones del sistema
 */
const getAllSystemConfigs = async (): Promise<SystemConfig[]> => {
  const response = await api.get('/system-config');
  return response.data.data;
};

/**
 * Actualizar una configuración del sistema
 */
const updateSystemConfig = async (
  key: string,
  value: any,
  description?: string
): Promise<SystemConfig> => {
  const response = await api.put(`/system-config/${key}`, { value, description });
  return response.data.data;
};

export default {
  getSystemConfig,
  getRootFolderUrl,
  getAllSystemConfigs,
  updateSystemConfig,
};

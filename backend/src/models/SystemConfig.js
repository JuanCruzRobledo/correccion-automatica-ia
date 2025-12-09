/**
 * Modelo de Configuración del Sistema
 * Almacena configuraciones globales como la carpeta raíz de Google Drive
 */
import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'La clave de configuración es requerida'],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'El valor de configuración es requerido'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para búsqueda rápida por key
systemConfigSchema.index({ key: 1 });

/**
 * Método estático para obtener una configuración por clave
 * @param {String} key - Clave de configuración
 * @returns {Promise<any>} Valor de la configuración
 */
systemConfigSchema.statics.getValue = async function (key) {
  const config = await this.findOne({ key });
  return config ? config.value : null;
};

/**
 * Método estático para establecer una configuración
 * @param {String} key - Clave de configuración
 * @param {any} value - Valor de la configuración
 * @param {String} description - Descripción opcional
 * @returns {Promise<Document>}
 */
systemConfigSchema.statics.setValue = async function (key, value, description = '') {
  const config = await this.findOneAndUpdate(
    { key },
    { value, description },
    { upsert: true, new: true, runValidators: true }
  );
  return config;
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;

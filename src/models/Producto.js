const mongoose = require('mongoose');

const NIVELES = ['preescolar', 'primaria', 'general'];

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    descripcion: { type: String, trim: true, maxlength: 500, default: '' },
    precio: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    nivel: { type: String, enum: NIVELES, default: 'general' },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { timestamps: true }
);


productoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Producto', productoSchema);
module.exports.NIVELES = NIVELES;

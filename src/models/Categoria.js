const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 50 },
    descripcion: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

categoriaSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias');

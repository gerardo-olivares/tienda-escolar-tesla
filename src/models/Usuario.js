const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'cliente'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },   // nunca se devuelve por defecto
    rol: { type: String, enum: ROLES, default: 'cliente' },
  },
  { timestamps: true }
);

/* Cifra la contraseña antes de guardarla (solo si cambió) */
usuarioSchema.pre('save', async function cifrar() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = function comparar(plano) {
  return bcrypt.compare(plano, this.password);
};

usuarioSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
module.exports.ROLES = ROLES;

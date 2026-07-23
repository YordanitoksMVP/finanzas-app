// ============================================================
// MODELO DE USUARIO
// ============================================================
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ============================================================
// ESQUEMA DE USUARIO
// ============================================================
const UsuarioSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    fechaRegistro: { 
        type: Date, 
        default: Date.now 
    }
});

// ============================================================
// MIDDLEWARE: ENCRIPTAR CONTRASEÑA ANTES DE GUARDAR
// ============================================================
UsuarioSchema.pre('save', async function(next) {
    // Si la contraseña no fue modificada, no hacer nada
    if (!this.isModified('password')) return next();
    
    // Encriptar la contraseña con bcrypt (10 rondas de sal)
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ============================================================
// MÉTODO: COMPARAR CONTRASEÑA (para el login)
// ============================================================
UsuarioSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// ============================================================
// EXPORTAR EL MODELO
// ============================================================
module.exports = mongoose.model('Usuario', UsuarioSchema);
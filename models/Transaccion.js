// ============================================================
// MODELO DE TRANSACCIÓN (Ingresos y Egresos)
// ============================================================
const mongoose = require('mongoose');

// ============================================================
// ESQUEMA DE TRANSACCIÓN
// ============================================================
const TransaccionSchema = new mongoose.Schema({
    // Referencia al usuario que creó la transacción
    usuarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    // Tipo: 'ingreso' o 'egreso'
    tipo: { 
        type: String, 
        enum: ['ingreso', 'egreso'], 
        required: true 
    },
    // Concepto o descripción de la transacción
    concepto: { 
        type: String, 
        required: true 
    },
    // Monto de la transacción
    monto: { 
        type: Number, 
        required: true 
    },
    // Categoría (ej. Alimentación, Transporte, etc.)
    categoria: { 
        type: String, 
        required: true 
    },
    // Fecha de la transacción (se asigna automáticamente)
    fecha: { 
        type: Date, 
        default: Date.now 
    }
});

// ============================================================
// EXPORTAR EL MODELO
// ============================================================
module.exports = mongoose.model('Transaccion', TransaccionSchema);
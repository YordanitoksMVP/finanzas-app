// ============================================================
// 1. IMPORTACIÓN DE DEPENDENCIAS
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// ============================================================
// 2. IMPORTACIÓN DE MODELOS
// ============================================================
const Usuario = require('./models/Usuario');
const Transaccion = require('./models/Transaccion');

// ============================================================
// 3. CONFIGURACIÓN INICIAL
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta';

// ============================================================
// 4. MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'rocky_finanzas')));

// ============================================================
// 5. CONEXIÓN A MONGODB
// ============================================================
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/finanzas';

mongoose.connect(MONGO_URL)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => {
        console.error('❌ Error MongoDB:', err.message);
        setTimeout(() => mongoose.connect(MONGO_URL), 5000);
    });

// ============================================================
// 6. MIDDLEWARE DE AUTENTICACIÓN (PROTEGE RUTAS PRIVADAS)
// ============================================================
const autenticar = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuarioId = decoded.usuarioId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// ============================================================
// 7. RUTAS DE AUTENTICACIÓN (PÚBLICAS)
// ============================================================

// REGISTRO DE USUARIO
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        const usuario = new Usuario({ nombre, email, password });
        await usuario.save();
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// LOGIN DE USUARIO
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const passwordValido = await usuario.compararPassword(password);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign(
            { usuarioId: usuario._id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ============================================================
// 8. RUTAS DE TRANSACCIONES (PROTEGIDAS)
// ============================================================

// CREAR TRANSACCIÓN
app.post('/api/transacciones', autenticar, async (req, res) => {
    try {
        const { tipo, concepto, monto, categoria } = req.body;
        if (!tipo || !concepto || !monto || !categoria) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        const transaccion = new Transaccion({
            usuarioId: req.usuarioId,
            tipo,
            concepto,
            monto,
            categoria
        });
        await transaccion.save();
        res.status(201).json(transaccion);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar la transacción' });
    }
});

// OBTENER TRANSACCIONES
app.get('/api/transacciones', autenticar, async (req, res) => {
    try {
        const transacciones = await Transaccion.find({ usuarioId: req.usuarioId })
            .sort({ fecha: -1 });
        res.json(transacciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
});

// ELIMINAR TRANSACCIÓN
app.delete('/api/transacciones/:id', autenticar, async (req, res) => {
    try {
        const transaccion = await Transaccion.findOneAndDelete({
            _id: req.params.id,
            usuarioId: req.usuarioId
        });
        if (!transaccion) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }
        res.json({ mensaje: 'Transacción eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// RESUMEN DE FINANZAS
app.get('/api/resumen', autenticar, async (req, res) => {
    try {
        const transacciones = await Transaccion.find({ usuarioId: req.usuarioId });
        const totalIngresos = transacciones
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + t.monto, 0);
        const totalEgresos = transacciones
            .filter(t => t.tipo === 'egreso')
            .reduce((sum, t) => sum + t.monto, 0);
        res.json({
            totalIngresos,
            totalEgresos,
            saldo: totalIngresos - totalEgresos
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
});

// ============================================================
// 9. PÁGINA PRINCIPAL
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'rocky_finanzas', 'login.html'));
});

// ============================================================
// 10. INICIAR SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
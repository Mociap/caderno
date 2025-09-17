const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const Database = require('./database/database');
const sectionsRouter = require('./routes/sections');
const notebooksRouter = require('./routes/notebooks');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa o banco de dados
const db = new Database();

// Função para inicializar o servidor
async function startServer() {
    try {
        // Inicializa o banco de dados
        await db.init();
        console.log('✅ Banco de dados inicializado');
        
        // Inicia o servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Middleware de segurança
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Configuração de CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8000', 
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000',
        'https://mociap.github.io',
        'https://mociap.github.io/caderno',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para disponibilizar o banco de dados nas rotas
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Servir arquivos estáticos (frontend)
app.use(express.static(__dirname));

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/notebooks', notebooksRouter);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db.isConnected() ? 'Connected' : 'Disconnected'
    });
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando servidor...');
    db.close();
    process.exit(0);
});

// Inicializa o servidor
startServer();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validações básicas
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email e password são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres' });
        }

        // Verifica se usuário já existe
        const existingUserByEmail = await req.db.getUserByEmail(email);
        const existingUserByUsername = await req.db.getUserByUsername(username);
        if (existingUserByEmail || existingUserByUsername) {
            return res.status(409).json({ error: 'Usuário já existe' });
        }

        // Hash da senha
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Cria o usuário
        const result = await req.db.createUser(username, email, passwordHash);
        const userId = result.id;

        // Gera token JWT
        const token = jwt.sign(
            { userId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: { id: userId, username, email }
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/auth/login
 * Faz login do usuário
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validações básicas
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password são obrigatórios' });
        }

        // Busca o usuário
        const user = await req.db.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ 
                error: 'Usuário não encontrado',
                message: 'Este email não está registrado. Você precisa se cadastrar primeiro.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verifica a senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Senha incorreta',
                message: 'A senha informada está incorreta. Verifique e tente novamente.',
                code: 'INVALID_PASSWORD'
            });
        }

        // Gera token JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/auth/me
 * Retorna informações do usuário autenticado
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await req.db.getUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/auth/refresh
 * Renova o token JWT
 */
router.post('/refresh', authenticateToken, (req, res) => {
    try {
        // Gera novo token
        const token = jwt.sign(
            { userId: req.user.userId, username: req.user.username, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({ token });

    } catch (error) {
        console.error('Erro ao renovar token:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
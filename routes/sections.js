const express = require('express');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;
const router = express.Router();

// Aplica autenticação a todas as rotas
router.use(authenticateToken);

/**
 * GET /api/sections
 * Busca todas as seções do usuário
 */
router.get('/', async (req, res) => {
    try {
        const sections = await req.db.getSectionsByUser(req.user.userId);
        res.json(sections || []);
    } catch (error) {
        console.error('Erro ao buscar seções:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/sections/:id
 * Busca uma seção específica
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const section = await req.db.getItemById(id, req.user.userId);
        
        if (!section || section.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        res.json(section);
    } catch (error) {
        console.error('Erro ao buscar seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/sections
 * Cria uma nova seção
 */
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome da seção é obrigatório' });
        }

        const section = await req.db.createSection(name.trim(), req.user.userId);
        res.status(201).json(section);

    } catch (error) {
        console.error('Erro ao criar seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * PUT /api/sections/:id
 * Atualiza uma seção
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome da seção é obrigatório' });
        }

        // Verifica se a seção existe e pertence ao usuário
        const existingSection = await req.db.getItemById(id, req.user.userId);
        if (!existingSection || existingSection.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        const result = await req.db.updateSection(id, name.trim(), req.user.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        res.json({ message: 'Seção atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * DELETE /api/sections/:id
 * Deleta uma seção e todos os cadernos relacionados
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se a seção existe e pertence ao usuário
        const existingSection = await req.db.getItemById(id, req.user.userId);
        if (!existingSection || existingSection.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        // Conta quantos cadernos serão deletados
        const notebookCount = await req.db.countNotebooksInSection(id, req.user.userId);

        const result = await req.db.deleteSection(id, req.user.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        res.json({ 
            message: 'Seção deletada com sucesso',
            deletedNotebooks: notebookCount
        });

    } catch (error) {
        console.error('Erro ao deletar seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/sections/:id/notebooks
 * Busca todos os cadernos de uma seção
 */
router.get('/:id/notebooks', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se a seção existe e pertence ao usuário
        const existingSection = await req.db.getItemById(id, req.user.userId);
        if (!existingSection || existingSection.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        const notebooks = await req.db.getNotebooksBySection(id, req.user.userId);
        res.json(notebooks);

    } catch (error) {
        console.error('Erro ao buscar cadernos da seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/sections/:id/stats
 * Busca estatísticas de uma seção
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se a seção existe e pertence ao usuário
        const existingSection = await req.db.getItemById(id, req.user.userId);
        if (!existingSection || existingSection.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        const notebookCount = await req.db.countNotebooksInSection(id, req.user.userId);
        
        res.json({
            sectionId: id,
            sectionName: existingSection.name,
            totalNotebooks: notebookCount,
            createdAt: existingSection.created_at,
            updatedAt: existingSection.updated_at
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas da seção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
const express = require('express');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;
const router = express.Router();

// Aplica autenticação a todas as rotas
router.use(authenticateToken);

/**
 * GET /api/notebooks
 * Busca todos os cadernos do usuário
 */
router.get('/', async (req, res) => {
    try {
        const { section_id } = req.query;
        
        let notebooks;
        if (section_id) {
            notebooks = await req.db.getNotebooksBySection(section_id, req.user.userId);
        } else {
            notebooks = await req.db.getNotebooksByUser(req.user.userId);
        }
        
        // Garantir que sempre retorna um array
        const notebooksArray = Array.isArray(notebooks) ? notebooks : [];
        res.json(notebooksArray);
    } catch (error) {
        console.error('Erro ao buscar cadernos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/notebooks/:id
 * Busca um caderno específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const notebook = await req.db.getItemById(id, req.user.userId);
        
        if (!notebook || notebook.type !== 'notebook') {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        res.json(notebook);
    } catch (error) {
        console.error('Erro ao buscar caderno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/notebooks
 * Cria um novo caderno
 */
router.post('/', async (req, res) => {
    try {
        const { name, section_id, content = '' } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome do caderno é obrigatório' });
        }

        if (!section_id) {
            return res.status(400).json({ error: 'ID da seção é obrigatório' });
        }

        // Verifica se a seção existe e pertence ao usuário
        const section = await req.db.getItemById(section_id, req.user.userId);
        if (!section || section.type !== 'section') {
            return res.status(404).json({ error: 'Seção não encontrada' });
        }

        const notebook = await req.db.createNotebook(name.trim(), section_id, content, req.user.userId);
        console.log('🔍 Rota POST - notebook criado:', notebook);
        res.status(201).json(notebook);

    } catch (error) {
        console.error('Erro ao criar caderno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * PUT /api/notebooks/:id
 * Atualiza um caderno
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, content, section_id } = req.body;

        // Verifica se o caderno existe e pertence ao usuário
        const existingNotebook = await req.db.getItemById(id, req.user.userId);
        if (!existingNotebook || existingNotebook.type !== 'notebook') {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        // Validações
        if (name !== undefined && (!name || name.trim().length === 0)) {
            return res.status(400).json({ error: 'Nome do caderno não pode estar vazio' });
        }

        // Se section_id foi fornecido, verifica se a seção existe
        if (section_id && section_id !== existingNotebook.parent_id) {
            const section = await req.db.getItemById(section_id, req.user.userId);
            if (!section || section.type !== 'section') {
                return res.status(404).json({ error: 'Seção não encontrada' });
            }
        }

        const result = req.db.updateNotebook(
            id, 
            name ? name.trim() : existingNotebook.name,
            content !== undefined ? content : existingNotebook.content,
            section_id || existingNotebook.parent_id,
            req.user.userId
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        res.json({ message: 'Caderno atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar caderno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * PATCH /api/notebooks/:id/content
 * Atualiza apenas o conteúdo de um caderno (para salvamento automático)
 */
router.patch('/:id/content', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (content === undefined) {
            return res.status(400).json({ error: 'Conteúdo é obrigatório' });
        }

        // Verifica se o caderno existe e pertence ao usuário
        const existingNotebook = await req.db.getItemById(id, req.user.userId);
        if (!existingNotebook || existingNotebook.type !== 'notebook') {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        const result = req.db.updateNotebookContent(id, content, req.user.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        res.json({ message: 'Conteúdo salvo com sucesso' });

    } catch (error) {
        console.error('Erro ao salvar conteúdo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * DELETE /api/notebooks/:id
 * Deleta um caderno
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se o caderno existe e pertence ao usuário
        const existingNotebook = await req.db.getItemById(id, req.user.userId);
        if (!existingNotebook || existingNotebook.type !== 'notebook') {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        const result = req.db.deleteNotebook(id, req.user.userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        res.json({ message: 'Caderno deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar caderno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/notebooks/:id/duplicate
 * Duplica um caderno
 */
router.post('/:id/duplicate', (req, res) => {
    try {
        const { id } = req.params;
        const { name, section_id } = req.body;

        // Verifica se o caderno existe e pertence ao usuário
        const existingNotebook = req.db.getItemById(id, req.user.userId);
        if (!existingNotebook || existingNotebook.type !== 'notebook') {
            return res.status(404).json({ error: 'Caderno não encontrado' });
        }

        // Define o nome da cópia
        const copyName = name || `${existingNotebook.name} - Cópia`;

        // Define a seção (usa a mesma se não especificada)
        const targetSectionId = section_id || existingNotebook.parent_id;

        // Verifica se a seção de destino existe
        const targetSection = req.db.getItemById(targetSectionId, req.user.userId);
        if (!targetSection || targetSection.type !== 'section') {
            return res.status(404).json({ error: 'Seção de destino não encontrada' });
        }

        const duplicatedNotebook = req.db.createNotebook(
            copyName,
            targetSectionId,
            existingNotebook.content,
            req.user.userId
        );

        res.status(201).json({
            message: 'Caderno duplicado com sucesso',
            notebook: duplicatedNotebook
        });

    } catch (error) {
        console.error('Erro ao duplicar caderno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/notebooks/search
 * Busca cadernos por nome ou conteúdo
 */
router.get('/search', (req, res) => {
    try {
        const { q, section_id } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Termo de busca é obrigatório' });
        }

        const notebooks = req.db.searchNotebooks(q.trim(), req.user.userId, section_id);
        res.json(notebooks);

    } catch (error) {
        console.error('Erro na busca de cadernos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
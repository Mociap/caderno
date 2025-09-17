const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DB_PATH || './database/booknotion.db';
    }

    /**
     * Inicializa o banco de dados SQLite
     */
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Cria o diretório do banco se não existir
                const dbDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                    console.log(`📁 Diretório criado: ${dbDir}`);
                }

                // Conecta ao banco de dados
                this.db = new sqlite3.Database(this.dbPath, async (err) => {
                    if (err) {
                        console.error('❌ Erro ao conectar ao banco:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log(`💾 Conectado ao SQLite: ${this.dbPath}`);

                    // Configura o banco para melhor performance
                    this.db.run('PRAGMA journal_mode = WAL');
                    this.db.run('PRAGMA synchronous = NORMAL');
                    this.db.run('PRAGMA cache_size = 1000000');
                    this.db.run('PRAGMA temp_store = memory');

                    // Cria as tabelas
                    try {
                        await this.createTables();
                        console.log('✅ Banco de dados inicializado com sucesso');
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                console.error('❌ Erro ao inicializar banco de dados:', error);
                reject(error);
            }
        });
    }

    /**
     * Cria as tabelas do banco de dados
     */
    async createTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createItemsTable = `
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('section', 'notebook')),
                content TEXT DEFAULT '',
                parent_id INTEGER,
                user_id INTEGER NOT NULL,
                level INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id)',
            'CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let completed = 0;
                const total = 2 + createIndexes.length;

                const checkComplete = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                this.db.run(createUsersTable, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela users:', err);
                        reject(err);
                        return;
                    }
                    checkComplete();
                });

                this.db.run(createItemsTable, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela items:', err);
                        reject(err);
                        return;
                    }
                    checkComplete();
                });

                // Cria os índices
                createIndexes.forEach(indexSql => {
                    this.db.run(indexSql, (err) => {
                        if (err) {
                            console.error('Erro ao criar índice:', err);
                        }
                        checkComplete();
                    });
                });
            });
        });
    }

    /**
     * Verifica se o banco está conectado
     */
    isConnected() {
        return this.db !== null;
    }

    /**
     * Executa uma query e retorna múltiplos resultados
     */
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Executa uma query e retorna um único resultado
     */
    queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Executa uma query de modificação (INSERT, UPDATE, DELETE)
     */
    exec(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        });
    }

    // ==================== MÉTODOS DE USUÁRIOS ====================

    /**
     * Cria um novo usuário
     */
    async createUser(username, email, passwordHash) {
        const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
        const result = await this.exec(sql, [username, email, passwordHash]);
        return { id: result.lastID, username, email };
    }

    /**
     * Busca usuário por email
     */
    async getUserByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        return await this.queryOne(sql, [email]);
    }

    /**
     * Busca usuário por username
     */
    async getUserByUsername(username) {
        const sql = `SELECT * FROM users WHERE username = ?`;
        return await this.queryOne(sql, [username]);
    }

    /**
     * Busca usuário por ID
     */
    async getUserById(id) {
        const sql = `SELECT * FROM users WHERE id = ?`;
        return await this.queryOne(sql, [id]);
    }

    // ==================== MÉTODOS DE SEÇÕES ====================

    /**
     * Cria uma nova seção
     */
    async createSection(name, userId) {
        const sql = `INSERT INTO items (name, type, user_id) VALUES (?, 'section', ?)`;
        const result = await this.exec(sql, [name, userId]);
        return { id: result.lastID, name, type: 'section', user_id: userId };
    }

    /**
     * Busca todas as seções de um usuário
     */
    async getSectionsByUser(userId) {
        const sql = `
            SELECT * FROM items 
            WHERE user_id = ? AND type = 'section' 
            ORDER BY created_at DESC
        `;
        return await this.query(sql, [userId]);
    }

    /**
     * Atualiza uma seção
     */
    async updateSection(id, name, userId) {
        const sql = `
            UPDATE items 
            SET name = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ? AND type = 'section'
        `;
        return await this.exec(sql, [name, id, userId]);
    }

    /**
     * Deleta uma seção e todos os cadernos relacionados
     */
    async deleteSection(id, userId) {
        // Primeiro deleta todos os cadernos da seção
        const deleteNotebooks = `
            DELETE FROM items 
            WHERE parent_id = ? AND user_id = ? AND type = 'notebook'
        `;
        await this.exec(deleteNotebooks, [id, userId]);

        // Depois deleta a seção
        const deleteSection = `
            DELETE FROM items 
            WHERE id = ? AND user_id = ? AND type = 'section'
        `;
        return await this.exec(deleteSection, [id, userId]);
    }

    /**
     * Conta quantos cadernos existem em uma seção
     */
    async countNotebooksInSection(sectionId, userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM items 
            WHERE parent_id = ? AND user_id = ? AND type = 'notebook'
        `;
        const result = await this.queryOne(sql, [sectionId, userId]);
        return result.count;
    }

    // ==================== MÉTODOS DE CADERNOS ====================

    /**
     * Cria um novo caderno
     */
    async createNotebook(name, sectionId, content = '', userId) {
        const sql = `
            INSERT INTO items (name, type, content, parent_id, user_id) 
            VALUES (?, 'notebook', ?, ?, ?)
        `;
        const result = await this.exec(sql, [name, content, sectionId, userId]);
        return { 
            id: result.lastID, 
            name, 
            type: 'notebook', 
            content, 
            parent_id: sectionId, 
            user_id: userId 
        };
    }

    /**
     * Busca todos os cadernos de um usuário
     */
    async getNotebooksByUser(userId) {
        const sql = `
            SELECT * FROM items 
            WHERE user_id = ? AND type = 'notebook' 
            ORDER BY updated_at DESC
        `;
        return await this.query(sql, [userId]);
    }

    /**
     * Busca cadernos de uma seção específica
     */
    async getNotebooksBySection(sectionId, userId) {
        const sql = `
            SELECT * FROM items 
            WHERE parent_id = ? AND user_id = ? AND type = 'notebook' 
            ORDER BY updated_at DESC
        `;
        return await this.query(sql, [sectionId, userId]);
    }

    /**
     * Atualiza um caderno
     */
    async updateNotebook(id, name, content, sectionId, userId) {
        const sql = `
            UPDATE items 
            SET name = ?, content = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ? AND type = 'notebook'
        `;
        return await this.exec(sql, [name, content, sectionId, id, userId]);
    }

    /**
     * Atualiza apenas o conteúdo de um caderno
     */
    async updateNotebookContent(id, content, userId) {
        const sql = `
            UPDATE items 
            SET content = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ? AND type = 'notebook'
        `;
        return await this.exec(sql, [content, id, userId]);
    }

    /**
     * Deleta um caderno
     */
    async deleteNotebook(id, userId) {
        const sql = `
            DELETE FROM items 
            WHERE id = ? AND user_id = ? AND type = 'notebook'
        `;
        return await this.exec(sql, [id, userId]);
    }

    /**
     * Busca cadernos por nome ou conteúdo
     */
    async searchNotebooks(query, userId, sectionId = null) {
        let sql = `
            SELECT * FROM items 
            WHERE user_id = ? AND type = 'notebook' 
            AND (name LIKE ? OR content LIKE ?)
        `;
        let params = [userId, `%${query}%`, `%${query}%`];

        if (sectionId) {
            sql += ' AND parent_id = ?';
            params.push(sectionId);
        }

        sql += ' ORDER BY updated_at DESC';

        return await this.query(sql, params);
    }

    // ==================== MÉTODOS GERAIS ====================

    /**
     * Busca um item por ID
     */
    async getItemById(id, userId) {
        const sql = `SELECT * FROM items WHERE id = ? AND user_id = ?`;
        return await this.queryOne(sql, [id, userId]);
    }

    /**
     * Busca estatísticas do usuário
     */
    async getStats(userId = null) {
        let sql = `
            SELECT 
                COUNT(CASE WHEN type = 'section' THEN 1 END) as sections,
                COUNT(CASE WHEN type = 'notebook' THEN 1 END) as notebooks
            FROM items
        `;
        let params = [];

        if (userId) {
            sql += ' WHERE user_id = ?';
            params.push(userId);
        }

        return await this.queryOne(sql, params);
    }

    /**
     * Obtém o tamanho do arquivo de banco de dados
     */
    getDatabaseSize() {
        try {
            const stats = fs.statSync(this.dbPath);
            return {
                bytes: stats.size,
                mb: (stats.size / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            return { bytes: 0, mb: '0.00' };
        }
    }

    /**
     * Fecha a conexão com o banco
     */
    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco:', err);
                    } else {
                        console.log('🔒 Conexão com banco fechada');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager;
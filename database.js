/**
 * DatabaseManager - Gerenciador de banco de dados SQLite para Book Notion
 * Utiliza SQL.js para funcionar no navegador com persistência via IndexedDB
 */
class DatabaseManager {
    constructor() {
        this.db = null;
        this._isInitialized = false;
        this.dbName = 'BookNotionDB';
        this.dbVersion = 1;
        this.storeName = 'database';
    }

    /**
     * Inicializa o banco de dados SQLite
     */
    async init() {
        try {
            console.log('🚀 Iniciando DatabaseManager...');
            
            // Inicializa SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
            });
            console.log('✅ SQL.js inicializado');

            // Tenta carregar banco existente do IndexedDB
            console.log('🔍 Tentando carregar banco existente...');
            let savedDb = await this.loadFromIndexedDB();
            
            // Se não encontrou no IndexedDB, tenta migrar do localStorage
            if (!savedDb) {
                console.log('❌ Banco não encontrado no IndexedDB, tentando localStorage...');
                savedDb = this.migrateFromLocalStorage();
            }
            
            if (savedDb) {
                this.db = new SQL.Database(savedDb);
                console.log('📁 Banco SQLite carregado (persistido via IndexedDB)');
                
                // Verifica se há dados no banco carregado
                try {
                    const sections = this.query('SELECT COUNT(*) as count FROM sections');
                    const notebooks = this.query('SELECT COUNT(*) as count FROM notebooks');
                    console.log('📊 Dados encontrados - Seções:', sections[0].count, 'Cadernos:', notebooks[0].count);
                } catch (e) {
                    console.log('⚠️ Erro ao verificar dados existentes (tabelas podem não existir ainda)');
                }
             } else {
                 // Cria novo banco
                 this.db = new SQL.Database();
                 console.log('🆕 Novo banco SQLite criado');
             }

            // Cria as tabelas se não existirem
            this.createTables();
            this._isInitialized = true;
            
            console.log('✅ DatabaseManager inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar banco de dados:', error);
            return false;
        }
    }

    /**
     * Migra dados do localStorage para IndexedDB
     */
    migrateFromLocalStorage() {
        try {
            const savedDb = localStorage.getItem('booknotion_db');
            if (savedDb) {
                console.log('🔄 Migrando dados do localStorage para IndexedDB...');
                // Converte base64 de volta para Uint8Array
                const dbData = new Uint8Array(atob(savedDb).split('').map(c => c.charCodeAt(0)));
                
                // Remove do localStorage após migração bem-sucedida
                localStorage.removeItem('booknotion_db');
                console.log('✅ Migração concluída - dados removidos do localStorage');
                
                return dbData;
            }
            return null;
        } catch (error) {
            console.error('❌ Erro na migração do localStorage:', error);
            return null;
        }
    }

    /**
     * Carrega o banco de dados do IndexedDB
     */
    async loadFromIndexedDB() {
        console.log('🔍 Tentando carregar banco do IndexedDB...');
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Erro ao abrir IndexedDB para carregamento:', request.error);
                resolve(null);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔧 IndexedDB sendo criado/atualizado...');
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                    console.log('📦 Object store criado:', this.storeName);
                }
            };
            
            request.onsuccess = (event) => {
                console.log('✅ IndexedDB aberto com sucesso');
                const db = event.target.result;
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const getRequest = store.get('sqliteDb');
                
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    db.close();
                    if (result) {
                        console.log('📁 Banco SQLite encontrado no IndexedDB, tamanho:', result.byteLength, 'bytes');
                        resolve(result ? new Uint8Array(result) : null);
                    } else {
                        console.log('❌ Nenhum banco SQLite encontrado no IndexedDB');
                        resolve(null);
                    }
                };
                
                getRequest.onerror = () => {
                    console.error('❌ Erro ao buscar dados no IndexedDB:', getRequest.error);
                    db.close();
                    resolve(null);
                };
            };
        });
    }

    /**
     * Cria as tabelas do banco de dados
     */
    createTables() {
        const createSectionsTable = `
            CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createNotebooksTable = `
            CREATE TABLE IF NOT EXISTS notebooks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                content TEXT DEFAULT '',
                section_id TEXT,
                parent_id TEXT,
                level INTEGER DEFAULT 0,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES notebooks(id) ON DELETE CASCADE
            )
        `;

        // Executa as queries de criação
        this.db.exec(createSectionsTable);
        this.db.exec(createNotebooksTable);

        console.log('📋 Tabelas criadas/verificadas com sucesso');
    }

    /**
     * Salva o banco de dados no IndexedDB
     */
    async saveToIndexedDB() {
        if (!this.db) return;
        
        try {
            const data = this.db.export();
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('❌ Erro ao abrir IndexedDB para salvamento');
                    reject(request.error);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction([this.storeName], 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    const putRequest = store.put(data, 'sqliteDb');
                    
                    putRequest.onsuccess = () => {
                        db.close();
                        console.log('💾 Banco SQLite salvo (persistido via IndexedDB)');
                        resolve();
                    };
                    
                    putRequest.onerror = () => {
                        db.close();
                        console.error('❌ Erro ao salvar no IndexedDB');
                        reject(putRequest.error);
                    };
                };
            });
        } catch (error) {
            console.error('❌ Erro ao salvar banco:', error);
            throw error;
        }
    }

    /**
     * Salva o banco de dados no localStorage (método legado - mantido para compatibilidade)
     */
    saveToStorage() {
        if (!this.db) return;
        
        try {
            // Exporta o banco como Uint8Array
            const data = this.db.export();
            // Converte para base64 para armazenar no localStorage
            const base64 = btoa(String.fromCharCode(...data));
            localStorage.setItem('booknotion_db', base64);
            console.log('💾 Banco de dados salvo no localStorage (legado)');
        } catch (error) {
            console.error('❌ Erro ao salvar banco:', error);
        }
    }

    /**
     * Executa uma query e retorna os resultados
     */
    query(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Banco de dados não inicializado');
        }

        try {
            const stmt = this.db.prepare(sql);
            const results = [];
            
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            
            stmt.free();
            return results;
        } catch (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        }
    }

    /**
     * Executa uma query de modificação (INSERT, UPDATE, DELETE)
     */
    async exec(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Banco de dados não inicializado');
        }

        try {
            if (params.length > 0) {
                const stmt = this.db.prepare(sql);
                stmt.run(params);
                stmt.free();
            } else {
                this.db.exec(sql);
            }
            
            // Salva automaticamente após modificações no IndexedDB
            await this.saveToIndexedDB();
            return true;
        } catch (error) {
            console.error('❌ Erro na execução:', error);
            throw error;
        }
    }

    // ==================== MÉTODOS PARA SEÇÕES ====================

    /**
     * Cria uma nova seção
     */
    async createSection(name) {
        const id = 'section_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const sql = `INSERT INTO sections (id, name) VALUES (?, ?)`;
        await this.exec(sql, [id, name]);
        return { id, name, created_at: new Date().toISOString() };
    }

    /**
     * Busca todas as seções
     */
    getSections() {
        const sql = `SELECT * FROM sections ORDER BY created_at ASC`;
        return this.query(sql);
    }

    /**
     * Atualiza uma seção
     */
    updateSection(id, name) {
        const sql = `UPDATE sections SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        this.exec(sql, [name, id]);
    }

    /**
     * Deleta uma seção e todos os cadernos relacionados
     */
    deleteSection(id) {
        const sql = `DELETE FROM sections WHERE id = ?`;
        this.exec(sql, [id]);
    }

    // ==================== MÉTODOS PARA CADERNOS ====================

    /**
     * Cria um novo caderno
     */
    async createNotebook(name, sectionId = null, parentId = null, level = 0) {
        const id = 'notebook_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const sql = `INSERT INTO notebooks (id, name, section_id, parent_id, level) VALUES (?, ?, ?, ?, ?)`;
        await this.exec(sql, [id, name, sectionId, parentId, level]);
        return { id, name, section_id: sectionId, parent_id: parentId, level, content: '' };
    }

    /**
     * Busca todos os cadernos
     */
    getNotebooks() {
        const sql = `SELECT * FROM notebooks ORDER BY section_id, level, created_at ASC`;
        return this.query(sql);
    }

    /**
     * Busca cadernos por seção
     */
    getNotebooksBySection(sectionId) {
        const sql = `SELECT * FROM notebooks WHERE section_id = ? ORDER BY level, created_at ASC`;
        return this.query(sql, [sectionId]);
    }

    /**
     * Busca cadernos filhos de um caderno pai
     */
    getChildNotebooks(parentId) {
        const sql = `SELECT * FROM notebooks WHERE parent_id = ? ORDER BY created_at ASC`;
        return this.query(sql, [parentId]);
    }

    /**
     * Atualiza um caderno
     */
    updateNotebook(id, updates) {
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        if (fields.length === 0) return;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        const sql = `UPDATE notebooks SET ${fields.join(', ')} WHERE id = ?`;
        this.exec(sql, values);
    }

    /**
     * Deleta um caderno e todos os seus filhos
     */
    deleteNotebook(id) {
        const sql = `DELETE FROM notebooks WHERE id = ?`;
        this.exec(sql, [id]);
    }

    /**
     * Move um caderno para uma nova seção/pai
     */
    moveNotebook(notebookId, newSectionId, newParentId = null, newLevel = 0) {
        const sql = `UPDATE notebooks SET section_id = ?, parent_id = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        this.exec(sql, [newSectionId, newParentId, newLevel, notebookId]);
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    /**
     * Conta cadernos em uma seção
     */
    countNotebooksInSection(sectionId) {
        const sql = `SELECT COUNT(*) as count FROM notebooks WHERE section_id = ?`;
        const result = this.query(sql, [sectionId]);
        return result[0]?.count || 0;
    }

    /**
     * Busca um item por ID (seção ou caderno)
     */
    getItemById(id) {
        if (id.startsWith('section_')) {
            const sql = `SELECT *, 'section' as type FROM sections WHERE id = ?`;
            const result = this.query(sql, [id]);
            return result[0] || null;
        } else {
            const sql = `SELECT *, 'notebook' as type FROM notebooks WHERE id = ?`;
            const result = this.query(sql, [id]);
            return result[0] || null;
        }
    }

    /**
     * Limpa todos os dados (para reset)
     */
    clearAllData() {
        this.exec('DELETE FROM notebooks');
        this.exec('DELETE FROM sections');
        console.log('🗑️ Todos os dados foram removidos');
    }

    /**
     * Método para obter estatísticas do banco
     */
    getStats() {
        try {
            const sections = this.getSections();
            const notebooks = this.getNotebooks();
            const dbSize = this.db ? this.db.export().byteLength : 0;
            
            return {
                totalSections: sections.length,
                totalNotebooks: notebooks.length,
                databaseSize: dbSize
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                totalSections: 0,
                totalNotebooks: 0,
                databaseSize: 0
            };
        }
    }

    /**
     * Método para debug - mostra todos os dados
     */
    debugShowAllData() {
        try {
            const sections = this.getSections();
            const notebooks = this.getNotebooks();
            
            console.log('📊 === DADOS DO BANCO ===');
            console.log('Seções:', sections);
            console.log('Cadernos:', notebooks);
            console.log('========================');
            
            return {
                sections: sections,
                notebooks: notebooks
            };
        } catch (error) {
            console.error('❌ Erro ao mostrar dados:', error);
            return {
                sections: [],
                notebooks: []
            };
        }
    }

    /**
     * Getter para verificar se está inicializado
     */
    get isInitialized() {
        return this._isInitialized;
    }

    /**
     * Verifica se há dados salvos no IndexedDB
     */
    async checkIndexedDBData() {
        console.log('🔍 Verificando dados no IndexedDB...');
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Erro ao abrir IndexedDB para verificação:', request.error);
                resolve(null);
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const getRequest = store.get('sqliteDb');
                
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    db.close();
                    if (result) {
                        console.log('✅ Dados encontrados no IndexedDB, tamanho:', result.byteLength, 'bytes');
                        console.log('📊 Dados:', result);
                        resolve(result);
                    } else {
                        console.log('❌ Nenhum dado encontrado no IndexedDB');
                        resolve(null);
                    }
                };
                
                getRequest.onerror = () => {
                    console.error('❌ Erro ao buscar dados no IndexedDB:', getRequest.error);
                    db.close();
                    resolve(null);
                };
            };
        });
    }
}

// Instância global do gerenciador de banco
window.dbManager = new DatabaseManager();
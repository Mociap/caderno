// Classe para gerenciar chamadas da API
class ApiManager {
    constructor() {
        // Detectar automaticamente o ambiente
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isGitHubPages) {
            // Para GitHub Pages, usar uma API externa ou mock
            this.baseUrl = 'https://api.exemplo.com/api'; // Substitua pela sua API real
            this.isOnlineMode = false; // Usar modo offline por enquanto
        } else if (isLocalhost) {
            // Para desenvolvimento local
            this.baseUrl = 'http://localhost:3000/api';
            this.isOnlineMode = true;
        } else {
            // Para outros ambientes
            this.baseUrl = 'http://localhost:3000/api';
            this.isOnlineMode = true;
        }
        
        this.token = localStorage.getItem('authToken');
    }

    // Método para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adiciona token de autenticação se disponível
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Preservar informações detalhadas do erro
                const error = new Error(data.error || data.message || 'Erro na requisição');
                error.code = data.code;
                error.message = data.message || data.error;
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            // Se for erro de rede (fetch falhou)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError = new Error('Erro de conexão. Verifique se o servidor está funcionando.');
                networkError.code = 'NETWORK_ERROR';
                throw networkError;
            }
            
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async register(username, email, password) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages
            const user = {
                id: Date.now(),
                username,
                email,
                created_at: new Date().toISOString()
            };
            
            const token = 'offline_token_' + Date.now();
            this.token = token;
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            return { user, token };
        }
        
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
        }
        
        return data;
    }

    async login(email, password) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const token = 'offline_token_' + Date.now();
                this.token = token;
                localStorage.setItem('authToken', token);
                return { user, token };
            } else {
                throw new Error('Usuário não encontrado. Registre-se primeiro.');
            }
        }
        
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
        }
        
        return data;
    }

    async logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    async getCurrentUser() {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages
            const storedUser = localStorage.getItem('currentUser');
            return storedUser ? JSON.parse(storedUser) : null;
        }
        
        return await this.request('/auth/me');
    }

    // Métodos de seções
    async getSections() {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                return window.dbManager.getSections();
            } else {
                // Inicializar DatabaseManager se necessário
                if (window.dbManager) {
                    await window.dbManager.init();
                    return window.dbManager.getSections();
                }
                return [];
            }
        }
        
        return await this.request('/sections');
    }

    async createSection(data) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                const name = typeof data === 'string' ? data : data.name;
                return await window.dbManager.createSection(name);
            } else {
                throw new Error('Database não inicializado');
            }
        }
        
        return await this.request('/sections', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateSection(id, name) {
        return await this.request(`/sections/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name })
        });
    }

    async deleteSection(id) {
        return await this.request(`/sections/${id}`, {
            method: 'DELETE'
        });
    }

    async getSectionNotebooks(sectionId) {
        return await this.request(`/sections/${sectionId}/notebooks`);
    }

    // Métodos de notebooks
    async getNotebooks(sectionId = null) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                if (sectionId) {
                    return window.dbManager.getNotebooksBySection(sectionId);
                } else {
                    return window.dbManager.getNotebooks();
                }
            } else {
                return [];
            }
        }
        
        const endpoint = sectionId ? `/notebooks?sectionId=${sectionId}` : '/notebooks';
        return await this.request(endpoint);
    }

    async createNotebook(data) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                const title = data.title || data.name;
                const sectionId = data.section_id || data.sectionId;
                const content = data.content || '';
                return await window.dbManager.createNotebook(title, sectionId, null, 0);
            } else {
                throw new Error('Database não inicializado');
            }
        }
        
        return await this.request('/notebooks', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getNotebook(id) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                return window.dbManager.getItemById(id);
            } else {
                return null;
            }
        }
        
        return await this.request(`/notebooks/${id}`);
    }

    async updateNotebook(id, data) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                return window.dbManager.updateNotebook(id, data);
            } else {
                throw new Error('Database não inicializado');
            }
        }
        
        return await this.request(`/notebooks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async updateNotebookContent(id, content) {
        return await this.request(`/notebooks/${id}/content`, {
            method: 'PATCH',
            body: JSON.stringify({ content })
        });
    }

    async deleteNotebook(id) {
        if (!this.isOnlineMode) {
            // Modo offline para GitHub Pages - usar DatabaseManager
            if (window.dbManager && window.dbManager.isInitialized) {
                return window.dbManager.deleteNotebook(id);
            } else {
                throw new Error('Database não inicializado');
            }
        }
        
        return await this.request(`/notebooks/${id}`, {
            method: 'DELETE'
        });
    }

    async duplicateNotebook(id) {
        return await this.request(`/notebooks/${id}/duplicate`, {
            method: 'POST'
        });
    }

    async searchNotebooks(query, sectionId = null) {
        const params = new URLSearchParams({ query });
        if (sectionId) {
            params.append('section_id', sectionId);
        }
        return await this.request(`/notebooks/search?${params}`);
    }

    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.token;
    }
}

// Instância global da API
window.apiManager = new ApiManager();
// Classe para gerenciar chamadas da API
class ApiManager {
    constructor() {
        // Detecta automaticamente o ambiente
        const isProduction = window.location.hostname === 'mociap.github.io' && 
                             window.location.pathname.startsWith('/caderno/');
        //
        // Configuração da URL da API
        if (isProduction) {
            // Em produção, usa URL configurada ou fallback para Render
            this.baseUrl = localStorage.getItem('apiUrl') || 'https://book-notion-api-t1ep.onrender.com/api';
            
            // Lista de fallbacks em ordem de prioridade (sem localhost)
            this.fallbackUrls = [
                'https://book-notion-api-t1ep.onrender.com/api',
                'https://book-notion-production.up.railway.app/api'
            ];
            
            console.info('🚀 Usando servidor de produção:', this.baseUrl);
        } else {
            // Em desenvolvimento, usa localhost
            this.baseUrl = 'http://localhost:3000/api';
        }
        
        this.token = localStorage.getItem('authToken');
    }

    // Método para configurar URL da API (útil para produção)
    setApiUrl(url) {
        this.baseUrl = url.endsWith('/api') ? url : `${url}/api`;
        localStorage.setItem('apiUrl', this.baseUrl);
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
            // Se for erro de rede (fetch falhou) e temos fallbacks disponíveis
            if (error.name === 'TypeError' && error.message.includes('fetch') && this.fallbackUrls) {
                console.warn(`❌ Falha ao conectar com: ${this.baseUrl}`);
                
                // Tenta próximo fallback
                const currentIndex = this.fallbackUrls.indexOf(this.baseUrl);
                if (currentIndex < this.fallbackUrls.length - 1) {
                    this.baseUrl = this.fallbackUrls[currentIndex + 1];
                    console.info(`🔄 Tentando servidor alternativo: ${this.baseUrl}`);
                    
                    // Tenta novamente com o novo URL
                    return this.request(endpoint, options);
                }
            }
            
            // Se for erro de rede (fetch falhou) e não há mais fallbacks
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const isProduction = window.location.hostname === 'mociap.github.io';
                let networkError;
                
                if (isProduction) {
                    networkError = new Error(`❌ Servidores de produção indisponíveis.\n\n🚀 O servidor está sendo configurado...\nTente novamente em alguns minutos.\n\n💡 Servidor tentado: ${this.baseUrl}`);
                } else {
                    networkError = new Error('Erro de conexão. Verifique se o servidor está funcionando.');
                }
                
                networkError.code = 'NETWORK_ERROR';
                throw networkError;
            }
            
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async register(username, email, password) {
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
        return await this.request('/auth/me');
    }

    // Métodos de seções
    async getSections() {
        return await this.request('/sections');
    }

    async createSection(data) {
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
        const endpoint = sectionId ? `/notebooks?sectionId=${sectionId}` : '/notebooks';
        return await this.request(endpoint);
    }

    async createNotebook(data) {
        return await this.request('/notebooks', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getNotebook(id) {
        return await this.request(`/notebooks/${id}`);
    }

    async updateNotebook(id, data) {
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
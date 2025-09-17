// Sistema de Autenticação
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        // Verificar se já está logado
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                this.currentUser = await api.getCurrentUser();
                this.hide();
            } catch (error) {
                console.error('Token inválido:', error);
                localStorage.removeItem('authToken');
                this.show();
            }
        } else {
            this.show();
        }
        
        this.isInitialized = true;
    }

    show() {
        this.showLoginForm();
    }

    hide() {
        const authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
    }

    showLoginForm() {
        document.body.innerHTML = `
            <div class="auth-container">
                <div class="auth-form">
                    <h1>📚 Book Notion</h1>
                    <p>Faça login para acessar seus cadernos</p>
                    
                    <div id="authTabs" class="auth-tabs">
                        <button class="tab-btn active" onclick="authSystem.showTab('login')">Login</button>
                        <button class="tab-btn" onclick="authSystem.showTab('register')">Registrar</button>
                    </div>

                    <form id="loginForm" class="auth-form-content">
                        <div class="form-group">
                            <label for="loginEmail">Email:</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Senha:</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="auth-btn">Entrar</button>
                    </form>

                    <form id="registerForm" class="auth-form-content" style="display: none;">
                        <div class="form-group">
                            <label for="registerUsername">Nome de usuário:</label>
                            <input type="text" id="registerUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">Email:</label>
                            <input type="email" id="registerEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Senha:</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirmar senha:</label>
                            <input type="password" id="confirmPassword" required>
                        </div>
                        <button type="submit" class="auth-btn">Registrar</button>
                    </form>

                    <div id="authMessage" class="auth-message"></div>
                </div>
            </div>

            <style>
                .auth-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .auth-form {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .auth-form h1 {
                    text-align: center;
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .auth-form p {
                    text-align: center;
                    color: #666;
                    margin-bottom: 2rem;
                }

                .auth-tabs {
                    display: flex;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #eee;
                }

                .tab-btn {
                    flex: 1;
                    padding: 0.75rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 1rem;
                    color: #666;
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s ease;
                }

                .tab-btn.active {
                    color: #667eea;
                    border-bottom-color: #667eea;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-weight: 500;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .auth-btn {
                    width: 100%;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .auth-btn:hover {
                    transform: translateY(-2px);
                }

                .auth-message {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    border-radius: 5px;
                    text-align: center;
                    display: none;
                }

                .auth-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .auth-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            </style>
        `;

        this.setupAuthEvents();
    }

    showTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabs = document.querySelectorAll('.tab-btn');

        tabs.forEach(t => t.classList.remove('active'));
        
        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            tabs[0].classList.add('active');
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            tabs[1].classList.add('active');
        }

        this.clearMessage();
    }

    setupAuthEvents() {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showMessage('Fazendo login...', 'info');
            const result = await api.login(email, password);
            this.currentUser = result.user;
            this.showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => this.showMainApp(), 1000);
        } catch (error) {
            console.error('Erro no login:', error);
            
            // Tratar diferentes tipos de erro
            let errorMessage = 'Erro ao fazer login';
            
            if (error.code === 'USER_NOT_FOUND') {
                errorMessage = 'Este email não está registrado. Clique em "Registrar" para criar uma conta.';
            } else if (error.code === 'INVALID_PASSWORD') {
                errorMessage = 'Senha incorreta. Verifique e tente novamente.';
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.error) {
                errorMessage = error.error;
            }
            
            this.showMessage(errorMessage, 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showMessage('As senhas não coincidem', 'error');
            return;
        }

        try {
            this.showMessage('Criando conta...', 'info');
            const result = await window.apiManager.register(username, email, password);
            this.currentUser = result.user;
            this.showMessage('Conta criada com sucesso!', 'success');
            setTimeout(() => this.showMainApp(), 1000);
        } catch (error) {
            this.showMessage(error.message || 'Erro ao criar conta', 'error');
        }
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('authMessage');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
    }

    clearMessage() {
        const messageEl = document.getElementById('authMessage');
        messageEl.style.display = 'none';
    }

    async logout() {
        await window.apiManager.logout();
        this.currentUser = null;
        this.showLoginForm();
    }

    showMainApp() {
        // Recarregar a página para mostrar a aplicação principal
        window.location.reload();
    }
}

// Instância global do sistema de autenticação
window.authSystem = new AuthSystem();
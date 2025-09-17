// Sistema de Cadernos com Backend API
class NotebookSystem {
    constructor() {
        this.currentNotebook = null;
        this.currentSection = null;
        this.editor = null;
        this.authSystem = null;
        this.isAuthenticated = false;
    }

    async init() {
        console.log('Inicializando sistema...');
        
        // Usar o sistema de autenticação global
        this.authSystem = window.authSystem;
        
        // Verificar se usuário está autenticado
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const user = await apiManager.getCurrentUser();
                if (user) {
                    this.isAuthenticated = true;
                    this.showMainApp();
                    this.setupEditor();
                    await this.loadNotebooks();
                    this.showUserInfo(user);
                } else {
                    this.showAuthScreen();
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        if (this.authSystem && this.authSystem.show) {
            this.authSystem.show();
        }
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }

    showMainApp() {
        if (this.authSystem && this.authSystem.hide) {
            this.authSystem.hide();
        }
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    showUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        if (userInfo && userName) {
            userName.textContent = user.email;
            userInfo.style.display = 'flex';
        }
    }

    setupEditor() {
        this.editor = document.getElementById('editor');
        if (this.editor) {
            this.editor.addEventListener('input', () => {
                this.saveCurrentContent();
            });
        }
    }

    async loadNotebooks() {
        try {
            const sections = await apiManager.getSections();
            // Garante que sections seja sempre um array
            const sectionsArray = Array.isArray(sections) ? sections : [];
            this.renderNotebooksList(sectionsArray);
        } catch (error) {
            console.error('Erro ao carregar cadernos:', error);
            this.showError('Erro ao carregar cadernos');
        }
    }

    renderNotebooksList(sections) {
        const container = document.getElementById('notebooksList');
        if (!container) return;

        container.innerHTML = '';

        sections.forEach(section => {
            const sectionElement = this.createSectionElement(section);
            container.appendChild(sectionElement);
        });
    }

    createSectionElement(section) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-item';
        sectionDiv.innerHTML = `
            <div class="section-content">
                <button class="expand-btn" onclick="toggleSection('${section.id}')" title="Expandir/Recolher">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <i class="section-icon fas fa-folder"></i>
                <span class="section-name">${section.name}</span>
                <span class="notebook-count">0</span>
                <div class="section-actions">
                    <button class="action-btn add" onclick="createNewNotebook('${section.id}')" title="Adicionar Caderno">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSection('${section.id}')" title="Excluir Seção">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="notebook-children collapsed" id="notebooks-${section.id}">
                <!-- Notebooks serão carregados aqui -->
            </div>
        `;

        // Carregar notebooks da seção
        this.loadNotebooksForSection(section.id);

        return sectionDiv;
    }

    async loadNotebooksForSection(sectionId) {
        try {
            const response = await apiManager.getNotebooks(sectionId);
            // Garantir que notebooks seja sempre um array
            const notebooks = Array.isArray(response) ? response : [];
            
            const container = document.getElementById(`notebooks-${sectionId}`);
            if (!container) return;

            container.innerHTML = '';
            notebooks.forEach(notebook => {
                const notebookElement = this.createNotebookElement(notebook);
                container.appendChild(notebookElement);
            });

            // Atualizar contador de cadernos na seção
            const countElement = container.parentElement.querySelector('.notebook-count');
            if (countElement) {
                countElement.textContent = notebooks.length;
            }
        } catch (error) {
            console.error('Erro ao carregar notebooks da seção:', error);
        }
    }

    createNotebookElement(notebook) {
        const notebookDiv = document.createElement('div');
        notebookDiv.className = 'notebook-item level-1';
        notebookDiv.innerHTML = `
            <div class="notebook-content" onclick="selectNotebook('${notebook.id}')">
                <div class="expand-placeholder"></div>
                <i class="notebook-icon fas fa-book"></i>
                <span class="notebook-name">${notebook.title}</span>
                <div class="notebook-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); editNotebook('${notebook.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteNotebook('${notebook.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        return notebookDiv;
    }

    async selectNotebook(notebookId) {
        try {
            const notebook = await apiManager.getNotebook(notebookId);
            if (notebook) {
                this.currentNotebook = notebook;
                this.displayNotebook(notebook);
                this.updateActiveNotebook(notebookId);
            }
        } catch (error) {
            console.error('Erro ao selecionar notebook:', error);
            this.showError('Erro ao carregar notebook');
        }
    }

    displayNotebook(notebook) {
        if (this.editor) {
            this.editor.innerHTML = notebook.content || '';
            this.editor.focus();
        }

        // Atualizar título na interface
        const titleElement = document.querySelector('.main-content h1');
        if (titleElement) {
            titleElement.textContent = notebook.title;
        }
    }

    updateActiveNotebook(notebookId) {
        // Remover classe active de todos os notebooks
        document.querySelectorAll('.notebook-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adicionar classe active ao notebook selecionado
        const selectedNotebook = document.querySelector(`[onclick="selectNotebook('${notebookId}')"]`);
        if (selectedNotebook) {
            selectedNotebook.closest('.notebook-item').classList.add('active');
        }
    }

    async saveCurrentContent() {
        if (!this.currentNotebook || !this.editor) return;

        const content = this.editor.innerHTML;
        
        try {
            await apiManager.updateNotebook(this.currentNotebook.id, {
                content: content
            });
            console.log('Conteúdo salvo automaticamente');
        } catch (error) {
            console.error('Erro ao salvar conteúdo:', error);
        }
    }

    showError(message) {
        // Implementar sistema de notificações
        console.error(message);
        alert(message); // Temporário
    }

    showSuccess(message) {
        console.log(message);
        // Implementar sistema de notificações
    }
}

// Funções globais para os eventos onclick
async function createNewSection() {
    const name = prompt('Nome da nova seção:');
    if (name && name.trim()) {
        try {
            await apiManager.createSection({ name: name.trim() });
            await notebookSystem.loadNotebooks();
            notebookSystem.showSuccess('Seção criada com sucesso!');
        } catch (error) {
            console.error('Erro ao criar seção:', error);
            notebookSystem.showError('Erro ao criar seção');
        }
    }
}

async function createNewNotebook(sectionId = null) {
    const title = prompt('Título do novo caderno:');
    console.log('Título capturado:', title);
    console.log('Título após trim:', title ? title.trim() : 'null');
    if (title && title.trim()) {
        try {
            // Se não foi passado sectionId, verificar se há seções disponíveis
            if (!sectionId) {
                const sections = await apiManager.getSections();
                if (sections.length === 0) {
                    notebookSystem.showError('Crie uma seção primeiro');
                    return;
                }

                // Se há apenas uma seção, usar ela. Senão, perguntar qual usar
                if (sections.length === 1) {
                    sectionId = sections[0].id;
                } else {
                    const sectionName = prompt(`Escolha uma seção:\n${sections.map(s => s.name).join('\n')}`);
                    const selectedSection = sections.find(s => s.name === sectionName);
                    if (!selectedSection) {
                        notebookSystem.showError('Seção não encontrada');
                        return;
                    }
                    sectionId = selectedSection.id;
                }
            }

            const notebookData = {
                name: title.trim(),
                section_id: sectionId,
                content: ''
            };
            console.log('Dados enviados para API:', notebookData);
            await apiManager.createNotebook(notebookData);
            
            await notebookSystem.loadNotebooks();
            notebookSystem.showSuccess('Caderno criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar caderno:', error);
            notebookSystem.showError('Erro ao criar caderno');
        }
    }
}

async function deleteSection(sectionId) {
    if (confirm('Tem certeza que deseja excluir esta seção? Todos os cadernos serão removidos.')) {
        try {
            await apiManager.deleteSection(sectionId);
            await notebookSystem.loadNotebooks();
            notebookSystem.showSuccess('Seção excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir seção:', error);
            notebookSystem.showError('Erro ao excluir seção');
        }
    }
}

async function toggleSection(sectionId) {
    const container = document.getElementById(`notebooks-${sectionId}`);
    const expandBtn = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
    const icon = expandBtn?.querySelector('i');
    
    if (container && expandBtn && icon) {
        const isCollapsed = container.classList.contains('collapsed');
        
        if (isCollapsed) {
            container.classList.remove('collapsed');
            expandBtn.classList.add('expanded');
            icon.className = 'fas fa-chevron-down';
        } else {
            container.classList.add('collapsed');
            expandBtn.classList.remove('expanded');
            icon.className = 'fas fa-chevron-right';
        }
    }
}

async function selectNotebook(notebookId) {
    await notebookSystem.selectNotebook(notebookId);
}

async function editNotebook(notebookId) {
    const newTitle = prompt('Novo título do caderno:');
    if (newTitle && newTitle.trim()) {
        try {
            await apiManager.updateNotebook(notebookId, { title: newTitle.trim() });
            await notebookSystem.loadNotebooks();
            notebookSystem.showSuccess('Caderno atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao editar caderno:', error);
            notebookSystem.showError('Erro ao editar caderno');
        }
    }
}

async function deleteNotebook(notebookId) {
    if (confirm('Tem certeza que deseja excluir este caderno?')) {
        try {
            await apiManager.deleteNotebook(notebookId);
            await notebookSystem.loadNotebooks();
            
            // Limpar editor se o caderno excluído estava selecionado
            if (notebookSystem.currentNotebook && notebookSystem.currentNotebook.id === notebookId) {
                notebookSystem.currentNotebook = null;
                if (notebookSystem.editor) {
                    notebookSystem.editor.innerHTML = '';
                }
            }
            
            notebookSystem.showSuccess('Caderno excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir caderno:', error);
            notebookSystem.showError('Erro ao excluir caderno');
        }
    }
}

async function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('authToken');
        location.reload();
    }
}

// Funções de formatação de texto
function formatText(command) {
    document.execCommand(command, false, null);
    if (notebookSystem.editor) {
        notebookSystem.editor.focus();
    }
}

function insertList(type) {
    const command = type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(command, false, null);
    if (notebookSystem.editor) {
        notebookSystem.editor.focus();
    }
}

function insertLink() {
    const url = prompt('Digite a URL:');
    if (url) {
        document.execCommand('createLink', false, url);
        if (notebookSystem.editor) {
            notebookSystem.editor.focus();
        }
    }
}

function changeFontSize() {
    const size = prompt('Tamanho da fonte (1-7):');
    if (size && size >= 1 && size <= 7) {
        document.execCommand('fontSize', false, size);
        if (notebookSystem.editor) {
            notebookSystem.editor.focus();
        }
    }
}

function changeTextColor() {
    const color = prompt('Cor do texto (ex: #ff0000):');
    if (color) {
        document.execCommand('foreColor', false, color);
        if (notebookSystem.editor) {
            notebookSystem.editor.focus();
        }
    }
}

function debugIndexedDB() {
    console.log('Debug não disponível no modo API');
}

// Função para atualizar título do notebook
async function updateNotebookTitle() {
    if (!notebookSystem || !notebookSystem.currentNotebook) return;
    
    const titleInput = document.getElementById('notebookTitle');
    if (!titleInput) return;
    
    const newTitle = titleInput.value.trim();
    if (!newTitle) return;
    
    try {
        await apiManager.updateNotebook(notebookSystem.currentNotebook.id, {
            name: newTitle
        });
        
        // Atualizar o título na interface
        notebookSystem.currentNotebook.name = newTitle;
        await notebookSystem.loadNotebooks(); // Recarregar lista
        notebookSystem.showSuccess('Título atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar título:', error);
        notebookSystem.showError('Erro ao atualizar título');
    }
}

// Função para salvamento manual
async function manualSave() {
    if (!notebookSystem) return;
    
    try {
        await notebookSystem.saveCurrentContent();
        notebookSystem.showSuccess('Conteúdo salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        notebookSystem.showError('Erro ao salvar conteúdo');
    }
}

// Inicializar sistema quando a página carregar
let notebookSystem;
document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar que o authSystem esteja disponível
    while (!window.authSystem) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Inicializar o sistema de autenticação primeiro
    await window.authSystem.init();
    
    // Depois inicializar o sistema de cadernos
    notebookSystem = new NotebookSystem();
    await notebookSystem.init();
});
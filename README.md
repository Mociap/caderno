# 📚 Book Notion - Sistema de Gerenciamento de Cadernos

Sistema completo para organização de cadernos e seções com backend Node.js e SQLite.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** - Sistema seguro de login/registro
- ✅ **Gerenciamento de Seções** - Organize seus cadernos por categorias
- ✅ **Cadernos Hierárquicos** - Crie e edite cadernos com conteúdo rico
- ✅ **Editor Rico** - Interface moderna para escrita
- ✅ **Busca Avançada** - Encontre cadernos por nome ou conteúdo
- ✅ **API REST Completa** - Endpoints para todas as operações
- ✅ **Banco SQLite** - Armazenamento persistente e confiável
- ✅ **Interface Responsiva** - Funciona em desktop e mobile

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn

## 🛠️ Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/book-notion.git
cd book-notion
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o ambiente:**
```bash
# Copie o arquivo .env.example para .env
cp .env.example .env

# Edite o .env com suas configurações
# IMPORTANTE: Mude o JWT_SECRET para um valor seguro!
```

4. **Inicie o servidor:**
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

5. **Acesse a aplicação:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 🌐 Hospedagem

### GitHub Pages (Frontend apenas)
Para hospedar apenas o frontend no GitHub Pages:

1. Crie um repositório no GitHub
2. Faça push dos arquivos
3. Vá em Settings > Pages
4. Configure a fonte como "Deploy from a branch"
5. Selecione a branch main

### Heroku (Aplicação completa)
```bash
# 1. Instale o Heroku CLI
# 2. Faça login
heroku login

# 3. Crie a aplicação
heroku create seu-app-name

# 4. Configure as variáveis de ambiente
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu_jwt_secret_super_seguro
heroku config:set PORT=3000

# 5. Faça deploy
git push heroku main
```

### Railway
1. Conecte seu repositório GitHub ao Railway
2. Configure as variáveis de ambiente:
   - `NODE_ENV=production`
   - `JWT_SECRET=seu_jwt_secret_super_seguro`
3. Deploy automático!

### Render
1. Conecte seu repositório GitHub ao Render
2. Configure como Web Service
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure as variáveis de ambiente

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Porta do servidor
PORT=3000

# Ambiente (development/production)
NODE_ENV=production

# Caminho do banco de dados
DB_PATH=./database/booknotion.db

# Chave secreta JWT (MUDE ESTE VALOR!)
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRES_IN=7d

# URL do frontend (para CORS)
FRONTEND_URL=https://seu-dominio.com
```

## 🔒 Segurança

**IMPORTANTE**: Antes de hospedar em produção:

1. **Mude o JWT_SECRET** para um valor único e seguro
2. **Configure HTTPS** no seu provedor de hospedagem
3. **Configure CORS** adequadamente para seu domínio
4. **Mantenha o .env** fora do controle de versão

## 📁 Estrutura do Projeto

```
Book Notion/
├── database/
│   ├── database.js          # Gerenciador do SQLite
│   └── booknotion.db        # Arquivo do banco (criado automaticamente)
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── sections.js          # Rotas de seções
│   └── notebooks.js         # Rotas de cadernos
├── frontend/                # Arquivos do frontend
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   └── database.js          # (legado - SQL.js)
├── server.js                # Servidor Express principal
├── package.json
├── .env                     # Configurações de ambiente
└── README.md

```

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/refresh` - Renovar token

### Seções
- `GET /api/sections` - Listar seções
- `POST /api/sections` - Criar seção
- `PUT /api/sections/:id` - Atualizar seção
- `DELETE /api/sections/:id` - Deletar seção
- `GET /api/sections/:id/notebooks` - Cadernos da seção

### Cadernos
- `GET /api/notebooks` - Listar cadernos
- `POST /api/notebooks` - Criar caderno
- `PUT /api/notebooks/:id` - Atualizar caderno
- `PATCH /api/notebooks/:id/content` - Salvar conteúdo
- `DELETE /api/notebooks/:id` - Deletar caderno
- `POST /api/notebooks/:id/duplicate` - Duplicar caderno
- `GET /api/notebooks/search?q=termo` - Buscar cadernos

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```javascript
Authorization: Bearer <seu-token-jwt>
```

## 💾 Banco de Dados

O sistema usa SQLite com o arquivo `database/booknotion.db`. O banco é criado automaticamente na primeira execução.

### Backup
Para fazer backup, simplesmente copie o arquivo `database/booknotion.db`.

### Migração de Dados
Se você tem dados do sistema anterior (IndexedDB), use as funções de export/import no frontend antigo.

## 🚀 Deploy

### Opção 1: Servidor VPS/Cloud
1. Faça upload dos arquivos
2. Configure as variáveis de ambiente
3. Execute `npm install --production`
4. Use PM2 ou similar: `pm2 start server.js`

### Opção 2: Heroku
1. Configure o `Procfile`: `web: node server.js`
2. Configure as variáveis de ambiente no dashboard
3. Deploy via Git

### Opção 3: Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🔧 Configuração

Principais variáveis do `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=production

# Banco de dados
DB_PATH=./database/booknotion.db

# JWT
JWT_SECRET=sua-chave-secreta-muito-forte
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Erro de permissão no banco
```bash
chmod 755 database/
chmod 644 database/booknotion.db
```

### Porta já em uso
Altere a `PORT` no `.env` ou mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Problemas de CORS
Verifique a `FRONTEND_URL` no `.env` e as configurações de CORS no `server.js`.

## 📝 Licença

Este projeto é de uso livre para fins educacionais e pessoais.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ usando Node.js, Express e SQLite**
# 🚀 Deploy no Render - Solução Alternativa

## ⚠️ Problema Identificado
O Railway não está funcionando corretamente (retorna 404). Vamos usar o **Render** como alternativa gratuita.

## 📋 Passo a Passo - Deploy no Render

### 1. Preparar o Repositório
Certifique-se que seu código está no GitHub: `https://github.com/Mociap/caderno.git`

### 2. Acessar o Render
1. Acesse: https://render.com
2. Faça login com sua conta GitHub
3. Clique em "New +" → "Web Service"

### 3. Conectar Repositório
1. Conecte seu repositório: `Mociap/caderno`
2. Configure as seguintes opções:
   - **Name**: `book-notion-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 4. Configurar Variáveis de Ambiente
Na seção "Environment Variables", adicione:

```
NODE_ENV=production
JWT_SECRET=seu_jwt_secret_super_seguro_123
FRONTEND_URL=https://mociap.github.io
PORT=10000
```

### 5. Deploy
1. Clique em "Create Web Service"
2. Aguarde o deploy (pode levar 5-10 minutos)
3. Sua URL será algo como: `https://book-notion-api.onrender.com`

## 🔧 Configurar no Frontend

Após o deploy, configure a URL no seu frontend:

1. Acesse: `https://mociap.github.io/caderno/`
2. Abra o console (F12)
3. Execute:
```javascript
apiManager.setApiUrl('https://book-notion-api.onrender.com/api');
```

## 🧪 Testar a API

Teste se a API está funcionando:
```
https://sua-url-do-render.onrender.com/api/health
```

## 📝 Notas Importantes

- **Render Free**: Pode "dormir" após 15 min de inatividade
- **Cold Start**: Primeira requisição pode demorar ~30 segundos
- **Alternativa**: Se preferir, pode usar ngrok para teste rápido

## 🆘 Solução Temporária - ngrok

Se quiser testar rapidamente:

1. Instale ngrok: https://ngrok.com/download
2. Execute no terminal:
```bash
ngrok http 3000
```
3. Use a URL fornecida (ex: `https://abc123.ngrok.io/api`)

## 🔄 Fallback Automático

O código foi atualizado para tentar múltiplas URLs automaticamente:
1. URL configurada manualmente
2. Servidor Render
3. Servidor local (desenvolvimento)
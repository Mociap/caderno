# 🚀 Deploy Automático no Render

## ⚡ Passos Rápidos (5 minutos):

### 1. **Acesse o Render**
   - Vá para: https://render.com
   - Faça login com sua conta GitHub

### 2. **Criar Novo Serviço**
   - Clique em **"New +"** → **"Web Service"**
   - Conecte o repositório: **`Mociap/caderno`**
   - Nome do serviço: **`book-notion-api`**
   - Branch: **`main`**

### 3. **Configuração Automática**
   ✅ O arquivo `render.yaml` já está configurado!
   
   **Variáveis que serão configuradas automaticamente:**
   - `NODE_ENV=production`
   - `JWT_SECRET=seu-jwt-secret-super-seguro-aqui`
   - `FRONTEND_URL=https://mociap.github.io`
   - `PORT=10000`

### 4. **Deploy**
   - Clique em **"Create Web Service"**
   - Aguarde 5-10 minutos para o deploy

## 🎯 **URL Final:**
Após o deploy: `https://book-notion-api.onrender.com`

## ✅ **Resultado Esperado:**
- ✅ GitHub Pages: `https://mociap.github.io/caderno/`
- ✅ API funcionando automaticamente
- ✅ Sem configuração manual necessária

## 🔧 **Se der erro:**
1. Verifique se as variáveis de ambiente estão corretas
2. Aguarde alguns minutos (primeiro deploy pode demorar)
3. Verifique os logs no painel do Render

**Tempo total: 5-10 minutos** ⏱️
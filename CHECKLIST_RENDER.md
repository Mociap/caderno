# 📋 CHECKLIST - Verificação Render

## 🔍 **Verificações no Painel Render**

### ✅ **Status do Serviço**
- [ ] Status: **"Live"** (verde)
- [ ] URL: `https://book-notion-api.onrender.com`
- [ ] Build: **Successful**
- [ ] Deploy: **Successful**

### 📊 **Logs do Deploy**
- [ ] Build logs sem erros
- [ ] `npm install` executado com sucesso
- [ ] `npm start` iniciado corretamente
- [ ] Mensagem: "🚀 Servidor rodando na porta 10000"

### ⚙️ **Variáveis de Ambiente**
- [ ] `NODE_ENV = production`
- [ ] `JWT_SECRET = seu-jwt-secret-super-seguro-aqui`
- [ ] `FRONTEND_URL = https://mociap.github.io`
- [ ] `PORT = 10000`

## 🌐 **Testes de Conectividade**

### 🔗 **URLs para Testar**

#### **1. API Base**
```
https://book-notion-api.onrender.com/api
```
**Esperado**: Resposta JSON (não 404)

#### **2. Health Check**
```
https://book-notion-api.onrender.com/api/health
```
**Esperado**: `{"status": "ok"}`

#### **3. Auth Endpoint**
```
https://book-notion-api.onrender.com/api/auth/register
```
**Esperado**: Erro de método (não CORS)

## 🚨 **Problemas Comuns e Soluções**

### ❌ **"Build Failed"**
**Solução**: 
- Verificar `package.json`
- Verificar dependências
- Checar logs de build

### ❌ **"Deploy Failed"**
**Solução**:
- Verificar `npm start`
- Verificar porta (deve ser `process.env.PORT`)
- Checar logs de deploy

### ❌ **"Service Unavailable"**
**Solução**:
- Aguardar alguns minutos
- Verificar se o serviço está "Live"
- Reiniciar deploy se necessário

### ❌ **CORS Error**
**Solução**:
- Verificar `FRONTEND_URL` nas variáveis
- Confirmar que é `https://mociap.github.io`
- Verificar configuração CORS no código

## ✅ **Teste Final**

### **GitHub Pages**
1. Acessar: `https://mociap.github.io/caderno/`
2. Abrir DevTools (F12)
3. Tentar registrar usuário
4. Verificar se não há erros de CORS

### **Resultado Esperado**
- ✅ Página carrega sem erros
- ✅ Console mostra: "🚀 Usando servidor de produção"
- ✅ Registro/login funciona
- ✅ Sem erros de CORS

## 🎯 **URLs Finais**
- **Frontend**: `https://mociap.github.io/caderno/`
- **API**: `https://book-notion-api.onrender.com/api`
- **Status**: Ambos funcionando ✅
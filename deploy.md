# 🚀 Guia de Deploy - Book Notion

## Preparação para Hospedagem

### 1. Arquivos Importantes
- ✅ `.gitignore` - Criado (protege arquivos sensíveis)
- ✅ `.env.example` - Criado (template de configuração)
- ✅ `package.json` - Configurado com scripts
- ✅ `README.md` - Atualizado com instruções

### 2. Checklist Pré-Deploy

#### Segurança
- [ ] Alterar `JWT_SECRET` no `.env` para um valor único
- [ ] Verificar se `.env` está no `.gitignore`
- [ ] Configurar `FRONTEND_URL` para seu domínio

#### Configuração
- [ ] Testar aplicação localmente
- [ ] Verificar se todas as dependências estão no `package.json`
- [ ] Confirmar que o banco de dados é criado automaticamente

## Opções de Hospedagem

### 🟢 Recomendado: Railway (Gratuito + Fácil)

1. **Acesse**: https://railway.app
2. **Conecte GitHub**: Autorize acesso ao repositório
3. **Deploy**: Selecione o repositório Book Notion
4. **Configure Variáveis**:
   ```
   NODE_ENV=production
   JWT_SECRET=seu_jwt_secret_super_seguro_aqui
   PORT=3000
   FRONTEND_URL=https://seu-app.up.railway.app
   ```
5. **Deploy Automático**: Railway detecta Node.js automaticamente

### 🟡 Heroku (Gratuito limitado)

```bash
# 1. Instalar Heroku CLI
# 2. Login
heroku login

# 3. Criar app
heroku create book-notion-app

# 4. Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu_jwt_secret_super_seguro
heroku config:set FRONTEND_URL=https://book-notion-app.herokuapp.com

# 5. Deploy
git push heroku main
```

### 🟡 Render (Gratuito com limitações)

1. **Acesse**: https://render.com
2. **Conecte GitHub**: Autorize repositório
3. **Configurações**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Variáveis de Ambiente**: Adicione as mesmas do Railway

### 🔵 Vercel (Frontend + Serverless)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variáveis no dashboard
```

## Configuração de Domínio Personalizado

### Railway
1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure DNS CNAME para `railway.app`

### Heroku
1. Vá em Settings > Domains
2. Adicione domínio personalizado
3. Configure DNS conforme instruções

## Monitoramento

### Logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Render
# Acesse dashboard > Logs
```

### Health Check
Teste se a API está funcionando:
```
GET https://seu-app.com/api/health
```

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente

### Erro: "Database locked"
- Reinicie a aplicação
- Verifique se não há múltiplas instâncias rodando

### Erro de CORS
- Configure `FRONTEND_URL` corretamente
- Verifique se o domínio está correto

### Erro 500
- Verifique logs da aplicação
- Confirme se `JWT_SECRET` está configurado
- Teste localmente primeiro

## Backup do Banco

O SQLite é um arquivo único. Para backup:

1. **Download do arquivo**: `database/booknotion.db`
2. **Backup automático**: Configure script para upload em cloud storage
3. **Migração**: Para produção, considere PostgreSQL

## Próximos Passos

1. **SSL/HTTPS**: Configurado automaticamente pelos provedores
2. **CDN**: Para arquivos estáticos (se necessário)
3. **Monitoramento**: Uptime Robot, Pingdom
4. **Analytics**: Google Analytics (se desejado)

---

**Dica**: Comece com Railway - é o mais simples e tem boa tier gratuita!
# 🚀 Configuração para Produção - Book Notion

## Problema Atual
Sua aplicação no GitHub Pages (`https://mociap.github.io`) está tentando se conectar ao `localhost:3000`, causando erro de CORS.

## ✅ Soluções Implementadas

### 1. CORS Configurado
O servidor já está configurado para aceitar requisições do GitHub Pages:
```javascript
origin: [
    'https://mociap.github.io',
    'https://mociap.github.io/caderno',
    // outras origens...
]
```

### 2. Detecção Automática de Ambiente
A API agora detecta automaticamente se está rodando em produção e usa a URL correta:
- **Desenvolvimento**: `http://localhost:3000/api`
- **Produção**: URL configurada ou padrão Railway

## 🎯 Próximos Passos

### Opção 1: Railway (Recomendado - Gratuito)

1. **Acesse**: https://railway.app
2. **Conecte GitHub**: Autorize acesso ao seu repositório
3. **Deploy**: Selecione o repositório Book Notion
4. **Configure Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   JWT_SECRET=seu_jwt_secret_super_seguro_aqui_123456789
   PORT=3000
   FRONTEND_URL=https://mociap.github.io
   ```
5. **Anote a URL**: Railway vai gerar algo como `https://book-notion-production.up.railway.app`

### Opção 2: Render (Alternativa Gratuita)

1. **Acesse**: https://render.com
2. **Conecte GitHub**: Autorize repositório
3. **Configurações**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Adicione as mesmas variáveis de ambiente**

### Opção 3: Heroku (Limitado)

```bash
heroku create book-notion-app
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu_jwt_secret_super_seguro
heroku config:set FRONTEND_URL=https://mociap.github.io
git push heroku main
```

## 🔧 Configuração da URL no Frontend

### Automática (Recomendado)
Se você usar Railway com o nome padrão, a aplicação vai funcionar automaticamente.

### Manual (Se necessário)
Se a URL do seu servidor for diferente, você pode configurar no console do navegador:

```javascript
// No console do navegador (F12)
apiManager.setApiUrl('https://sua-url-do-servidor.com');
```

## 🧪 Teste

1. **Deploy o servidor** em uma das plataformas acima
2. **Acesse sua aplicação** no GitHub Pages
3. **Teste o cadastro/login** - deve funcionar sem erros de CORS

## 🆘 Troubleshooting

### Se ainda der erro de CORS:
1. Verifique se a URL do servidor está correta
2. Confirme que `FRONTEND_URL` está configurado como `https://mociap.github.io`
3. Teste a API diretamente: `https://sua-url/api/health`

### Se der erro 500:
1. Verifique os logs do servidor
2. Confirme que `JWT_SECRET` está configurado
3. Teste localmente primeiro

## 📝 Notas Importantes

- ✅ CORS já configurado
- ✅ Detecção automática de ambiente implementada
- ✅ Método para configurar URL manualmente disponível
- ✅ Package.json pronto para produção
- ✅ Variáveis de ambiente documentadas

**Próximo passo**: Escolha uma plataforma e faça o deploy do servidor!
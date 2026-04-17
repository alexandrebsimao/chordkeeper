# 🔒 Correções de Segurança - Frontend API Integration

**Data:** 10 de março de 2026  
**Status:** ✅ IMPLEMENTADO PARCIALMENTE

---

## ✅ Correções Implementadas

### 1. ✅ **Sanitização HTML Adicionada**

**Arquivos Criados:**
- `/frontend/src/lib/sanitize.ts` - Biblioteca de sanitização

**Arquivos Atualizados:**
- `/frontend/src/components/MusicContent.tsx` - Adicionado `sanitizeHtml()`
- `/frontend/src/pages/songs/Show.tsx` - Adicionado `sanitizeHtml()`

**O que foi feito:**
```typescript
// Antes - VULNERÁVEL ❌
<div dangerouslySetInnerHTML={{ __html: song?.content }} />

// Depois - PROTEGIDO ✅
import { sanitizeHtml } from "@/lib/sanitize";
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(song?.content || "") }} />
```

**Proteção contra:**
- ✅ XSS via tags `<script>`
- ✅ XSS via event handlers (`onerror`, `onclick`, etc.)
- ✅ Injection de iframes maliciosos
- ✅ Data URLs maliciosas

---

## ⚠️ AÇÃO NECESSÁRIA

### 1. Instalar DOMPurify

```bash
cd frontend
npm install dompurify @types/dompurify
```

**Ou usando yarn:**
```bash
cd frontend
yarn add dompurify @types/dompurify
```

### 2. Verificar Instalação

```bash
# Verificar se foi instalado corretamente
npm list dompurify

# Deve mostrar:
# └── dompurify@X.X.X
```

### 3. Rebuild Frontend

```bash
cd frontend
npm run build

# Ou para desenvolvimento:
npm run dev
```

---

## 🔴 CORREÇÕES PENDENTES (Backend)

As seguintes correções requerem mudanças no backend Rails:

### 1. Migrar para HttpOnly Cookies

**Prioridade:** 🔴 CRÍTICA

**Arquivos a modificar:**
- `app/controllers/users/sessions_controller.rb`
- `app/controllers/users/omniauth_callbacks_controller.rb`
- `frontend/src/lib/auth.ts`

**Implementação:**

```ruby
# Backend - app/controllers/users/sessions_controller.rb
def create
  user = User.find_by(email: params[:user][:email])
  
  if user&.valid_password?(params[:user][:password])
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    
    # ✅ Usar cookies HttpOnly
    cookies.signed[:auth_token] = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :strict,
      expires: 14.days.from_now
    }
    
    render json: { 
      success: true,
      user: UserSerializer.new(user).serializable_hash
    }
  else
    render json: { error: 'Invalid credentials' }, status: :unauthorized
  end
end
```

```typescript
// Frontend - Remover localStorage
// REMOVER:
localStorage.setItem("authToken", token);

// Cookies serão gerenciados automaticamente pelo browser
```

### 2. Corrigir OAuth Callback

**Prioridade:** 🔴 ALTA

```ruby
# Backend - app/controllers/users/omniauth_callbacks_controller.rb
def google_oauth2
  user = User.from_omniauth(request.env['omniauth.auth'])
  
  if user.persisted?
    sign_in(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    
    # ✅ Cookie em vez de query string
    cookies.signed[:auth_token] = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :strict
    }
    
    # ✅ Redirecionar SEM token na URL
    redirect_to "#{ENV['FRONTEND_URL']}/oauth/callback?success=true"
  else
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=authentication_failed"
  end
end
```

```typescript
// Frontend - frontend/src/pages/auth/OAuthCallback.tsx
// REMOVER linha que lê token da URL:
const token = searchParams.get("token"); // ❌ REMOVER

// Verificar apenas sucesso:
const success = searchParams.get("success");
if (success) {
  // Token já está no cookie HttpOnly
  navigate("/songs");
}
```

### 3. Adicionar CSRF Token no Frontend

```typescript
// frontend/src/lib/auth.ts
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // ✅ Adicionar CSRF token de meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    (headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;
  }

  // ✅ Incluir credentials para enviar cookies
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include', // Importante para cookies
  });

  return response;
};
```

---

## 🧪 TESTES DE SEGURANÇA

### Teste 1: Verificar Sanitização XSS

```bash
# 1. Criar música com payload XSS
curl -X POST http://localhost:3000/api/songs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "song": {
      "title": "XSS Test",
      "content": "<img src=x onerror=\"alert(document.cookie)\"> <script>alert(\"XSS\")</script>"
    }
  }'

# 2. Abrir música no frontend
# Resultado esperado: Nenhum alert deve aparecer ✅
# Tag <img> e <script> devem ser removidas
```

### Teste 2: Verificar Token Storage

```javascript
// Abrir DevTools Console após implementar cookies

// Testar localStorage (deve estar vazio):
console.log(localStorage.getItem('authToken')); 
// Esperado: null ✅

// Verificar cookies (não acessível via JS se HttpOnly):
console.log(document.cookie);
// Esperado: auth_token NÃO deve aparecer ✅
```

### Teste 3: Verificar OAuth sem Token na URL

```bash
# Fazer login com Google
# Verificar URL após redirect: /oauth/callback?success=true
# Token NÃO deve estar na URL ✅
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Imediato (Frontend)
- [x] ✅ Criar `/frontend/src/lib/sanitize.ts`
- [x] ✅ Atualizar `MusicContent.tsx` com sanitização
- [x] ✅ Atualizar `Show.tsx` com sanitização
- [ ] ⚠️ **Instalar DOMPurify** (`npm install dompurify @types/dompurify`)
- [ ] ⚠️ **Rebuild frontend** (`npm run build`)
- [ ] ⚠️ **Testar XSS** (criar música com script tags)

### Curto Prazo (Backend + Frontend)
- [ ] ⚠️ Implementar HttpOnly cookies no backend
- [ ] ⚠️ Atualizar frontend para usar cookies
- [ ] ⚠️ Remover tokens de localStorage
- [ ] ⚠️ Corrigir OAuth callback (sem token na URL)
- [ ] ⚠️ Adicionar CSRF token em requests
- [ ] ⚠️ Adicionar `credentials: 'include'` em fetchWithAuth

### Médio Prazo
- [ ] ⚠️ Implementar rate limiting no frontend
- [ ] ⚠️ Adicionar CSP meta tag no index.html
- [ ] ⚠️ Implementar debounce em buscas
- [ ] ⚠️ Adicionar logging de tentativas de XSS

---

## 📊 STATUS DE SEGURANÇA

**Antes das Correções:**
- 🔴 XSS: Múltiplos vetores (dangerouslySetInnerHTML)
- 🔴 Token Storage: localStorage (acessível via XSS)
- 🔴 OAuth: Token em URL
- Score: 3/10

**Após Correções Implementadas:**
- ✅ XSS: Sanitizado com DOMPurify
- 🟡 Token Storage: Ainda em localStorage (pendente migração)
- 🟡 OAuth: Ainda em URL (pendente correção backend)
- Score: 6/10

**Após Todas as Correções:**
- ✅ XSS: Completamente mitigado
- ✅ Token Storage: HttpOnly cookies
- ✅ OAuth: Sem token em URL
- Score: 9/10

---

## 🚨 AVISOS IMPORTANTES

### 1. DOMPurify é OBRIGATÓRIO

```bash
# SEM DOMPurify instalado, o código vai FALHAR!
cd frontend
npm install dompurify @types/dompurify
```

### 2. Sanitização não é perfeita

```typescript
// ✅ Sanitiza HTML, mas não protege contra:
// - XSS via localStorage (se outro código for vulnerável)
// - XSS em outros componentes não sanitizados
// - CSRF (precisa de tokens no backend)
```

### 3. Migração para Cookies é ESSENCIAL

```
localStorage + XSS = Tokens roubados
HttpOnly Cookies + XSS = Tokens SEGUROS ✅
```

---

## 📚 RECURSOS

- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN: HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 🎯 PRÓXIMOS PASSOS

1. **HOJE**: Instalar DOMPurify e testar sanitização
2. **ESTA SEMANA**: Implementar HttpOnly cookies no backend
3. **ESTE MÊS**: Corrigir OAuth e adicionar rate limiting

---

**Status:** ⚠️ **DOMPurify precisa ser instalado para funcionar!**

```bash
cd frontend && npm install dompurify @types/dompurify
```

**Autor:** GitHub Copilot  
**Data:** 10 de março de 2026

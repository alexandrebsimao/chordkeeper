# Próximos Passos - Sistema de Administração

## ✅ Concluído

### Backend
- [x] 4 migrations criadas (plans, user_subscriptions, add_role_to_users, feature_flags)
- [x] 4 models completos (Plan, UserSubscription, FeatureFlag, User)
- [x] 5 controllers admin (BaseController, DashboardController, PlansController, UsersController, FeatureFlagsController)
- [x] Concern PlanLimitable integrado em SongsController e SetlistsController
- [x] Feature flags para public_sharing e pdf_export nos setlists
- [x] API /api/users/me atualizada com informações de plano
- [x] Seeds com dados iniciais (4 planos, 8 features, 1 admin)

### Frontend
- [x] 4 páginas admin (Dashboard, Plans, Users, Features)
- [x] AppSidebar com menu admin (role-based visibility)
- [x] Componente PlanLimitBadge para mostrar limites
- [x] Componente PlanUsageCard para dashboard de uso
- [x] Hook useUserPlan para buscar dados do plano
- [x] Rotas admin configuradas em App.tsx

## 🚀 Executar Agora

### 1. Rodar Migrations
```bash
docker-compose exec web rails db:migrate
```

### 2. Popular Banco de Dados
```bash
docker-compose exec web rails db:seed
```

Isso criará:
- 4 planos: Free (R$ 0), Starter (R$ 4.99), Pro (R$ 9.99), Team (R$ 29.99)
- 8 feature flags: public_sharing, auto_scroll, transpose, pdf_export, collaboration, templates, api_access, analytics
- 1 usuário admin: admin@chordkeeper.com / admin123

### 3. Testar Login Admin
```bash
# Acesse: http://localhost:3000
# Login: admin@chordkeeper.com
# Senha: admin123
```

### 4. Verificar Painel Admin
Navegue para:
- `/admin/dashboard` - Estatísticas gerais
- `/admin/plans` - Gerenciar planos
- `/admin/users` - Gerenciar usuários e assinaturas
- `/admin/features` - Gerenciar feature flags

## 📝 Melhorias Futuras

### 1. Integrar Componentes de Limite no UI do Usuário

**Páginas para Atualizar:**
- `frontend/src/pages/songs/Index.tsx` - Mostrar PlanUsageCard
- `frontend/src/pages/setlists/Index.tsx` - Mostrar PlanUsageCard
- `frontend/src/pages/songs/Create.tsx` - Verificar limite antes de criar
- `frontend/src/pages/setlists/SetlistManager.tsx` - Condicionar botões por feature flags

**Exemplo de Integração:**
```tsx
import { useUserPlan } from '@/hooks/useUserPlan';
import { PlanUsageCard } from '@/components/PlanLimitBadge';

function SongsIndex() {
  const { data: userPlan } = useUserPlan();
  
  return (
    <div>
      {/* Sidebar com uso do plano */}
      <aside>
        {userPlan && (
          <PlanUsageCard
            songsCount={userPlan.songs_count}
            songsLimit={userPlan.songs_limit}
            setlistsCount={userPlan.setlists_count}
            setlistsLimit={userPlan.setlists_limit}
            planName={userPlan.plan_name}
            onUpgrade={() => navigate('/plans')}
          />
        )}
      </aside>
      
      {/* Lista de músicas */}
      <main>...</main>
    </div>
  );
}
```

### 2. Criar Página de Planos Públicos

**Arquivo:** `frontend/src/pages/Plans.tsx`

**Funcionalidades:**
- Mostrar todos os planos disponíveis
- Comparação de features
- Botão "Escolher Plano" ou "Upgrade"
- Destacar plano atual do usuário
- CTA para assinatura

### 3. Tratamento de Erros de Limite

**No Frontend:**
```tsx
try {
  await createSong(data);
} catch (error) {
  if (error.status === 403) {
    // Mostrar modal de upgrade
    setShowUpgradeModal(true);
  }
}
```

**Criar Componente:**
`frontend/src/components/UpgradeModal.tsx`
- Modal com mensagem de limite atingido
- Botão para ver planos
- Informação sobre benefícios do upgrade

### 4. Notificações de Limite

**Backend:** Criar job para avisar quando usuário atingir 80% do limite
```ruby
# app/jobs/check_plan_limits_job.rb
class CheckPlanLimitsJob < ApplicationJob
  def perform
    User.find_each do |user|
      if user.songs_count >= user.songs_limit * 0.8
        # Enviar email ou notificação
        UserMailer.approaching_limit(user, 'songs').deliver_later
      end
    end
  end
end
```

**Agendar:** Em `config/recurring.yml`
```yaml
check_plan_limits:
  cron: "0 9 * * *"  # Todo dia às 9h
  class: "CheckPlanLimitsJob"
```

### 5. Integração com Gateway de Pagamento

**Opções:**
- Stripe (internacional)
- PagSeguro (Brasil)
- Mercado Pago (América Latina)

**Implementação:**
```ruby
# app/services/subscription_service.rb
class SubscriptionService
  def create_subscription(user, plan, payment_method)
    # Criar assinatura no gateway
    external_subscription = PaymentProvider.create_subscription(
      customer_id: user.external_customer_id,
      plan_id: plan.external_plan_id,
      payment_method: payment_method
    )
    
    # Criar UserSubscription local
    user.user_subscriptions.create!(
      plan: plan,
      status: 'active',
      started_at: Time.current,
      expires_at: 1.send(plan.interval).from_now,
      payment_provider: 'stripe',
      external_subscription_id: external_subscription.id
    )
  end
end
```

**Webhooks:**
```ruby
# app/controllers/webhooks/stripe_controller.rb
class Webhooks::StripeController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  def create
    case params[:type]
    when 'invoice.payment_succeeded'
      # Renovar assinatura
    when 'invoice.payment_failed'
      # Marcar como expirada
    when 'customer.subscription.deleted'
      # Cancelar assinatura
    end
    
    head :ok
  end
end
```

### 6. Dashboard de Analytics (Feature Pro+)

**Página:** `frontend/src/pages/Analytics.tsx`

**Métricas:**
- Músicas mais tocadas
- Setlists mais usadas
- Tempo total de uso
- Atividade ao longo do tempo
- Comparação mês a mês

### 7. Sistema de Templates (Feature Pro+)

**Funcionalidades:**
- Criar templates de setlists
- Compartilhar templates públicos
- Biblioteca de templates comunitários
- Aplicar template a nova setlist

### 8. API Access (Feature Team)

**Documentação:** Swagger/OpenAPI
```ruby
# app/controllers/api/v1/base_controller.rb
class Api::V1::BaseController < ApplicationController
  before_action :authenticate_api_user!
  before_action :check_api_access!
  
  private
  
  def check_api_access!
    unless current_user.has_feature?('api_access')
      render json: { error: 'API access not available in your plan' }, status: :forbidden
    end
  end
end
```

**Endpoints:**
- `GET /api/v1/songs` - Listar músicas
- `POST /api/v1/songs` - Criar música
- `GET /api/v1/setlists` - Listar setlists
- `POST /api/v1/setlists` - Criar setlist

### 9. Colaboração em Tempo Real (Feature Pro+)

**Tecnologia:** Action Cable (WebSockets)

**Funcionalidades:**
- Múltiplos usuários editando setlist simultaneamente
- Ver quem está online
- Chat integrado
- Notificações de mudanças

### 10. Export PDF Customizado (Feature Pro+)

**Melhorias:**
- Escolher fonte e tamanho
- Adicionar logo/marca d'água
- Selecionar quais músicas incluir
- Ordem customizada
- Cabeçalho e rodapé personalizados

## 🔍 Validações Recomendadas

### Testes Backend
```bash
# Testar limites
curl -X POST http://localhost:3000/api/songs \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Test Song"}'

# Deve retornar 403 se limite atingido
```

### Testes Frontend
1. Login como usuário Free
2. Criar 20 músicas
3. Tentar criar a 21ª → Deve mostrar erro
4. Fazer upgrade para Starter
5. Tentar criar música → Deve funcionar

### Testes Admin
1. Login como admin
2. Ver dashboard com estatísticas
3. Criar novo plano
4. Atribuir plano a usuário
5. Criar feature flag
6. Testar toggle de feature

## 📊 Monitoramento

### Métricas Importantes
- Taxa de conversão Free → Starter
- Taxa de conversão Starter → Pro
- Churn rate (cancelamentos)
- Usuários próximos do limite
- Features mais usadas
- Receita mensal recorrente (MRR)

### Ferramentas
- Google Analytics para tracking
- Hotjar para heatmaps
- Sentry para erros
- New Relic para performance

## 🎯 Roadmap

### Fase 1 - MVP (Atual) ✅
- [x] Sistema de planos básico
- [x] Limites por recurso
- [x] Feature flags
- [x] Painel admin

### Fase 2 - Monetização
- [ ] Página pública de planos
- [ ] Integração com gateway de pagamento
- [ ] Webhooks para renovação automática
- [ ] Modal de upgrade

### Fase 3 - Engajamento
- [ ] Notificações de limite
- [ ] Analytics básico
- [ ] Templates de setlists
- [ ] Compartilhamento público

### Fase 4 - Escala
- [ ] API pública
- [ ] Colaboração em tempo real
- [ ] Marketplace de templates
- [ ] Aplicativo mobile

## 📚 Recursos Úteis

- [Rails Guides - Action Cable](https://guides.rubyonrails.org/action_cable_overview.html)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)

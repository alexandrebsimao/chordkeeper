# ⚙️ Configuração Sidekiq Schedule para SubscriptionRenewalJob

**Data**: 17 de Abril de 2026  
**Status**: ✅ CONFIGURADO

---

## 🎯 O Que Foi Feito

Configurado `sidekiq-cron` para rodar `SubscriptionRenewalJob` automaticamente:

- ✅ Gem `sidekiq-cron` adicionada ao Gemfile
- ✅ Arquivo `config/sidekiq.yml` criado com schedule
- ✅ Inicializador `config/initializers/sidekiq.rb` atualizado
- ✅ Job configurado para rodar **diariamente às 2:00 AM**

---

## 📋 Schedule Configurado

```yaml
# config/sidekiq.yml
renewal_job:
  cron: '0 2 * * *'              # Todos os dias, 2:00 AM
  class: SubscriptionRenewalJob
  queue: default
  description: 'Renova assinaturas expirando'
```

---

## 🚀 Como Usar

### 1️⃣ Instalar Dependências

```bash
cd chord-keeper-web
bundle install
```

### 2️⃣ Desenvolvimento Local

**Terminal 1: Redis**
```bash
redis-server
```

**Terminal 2: Sidekiq**
```bash
bundle exec sidekiq -c 5 -v
```

Você verá:
```
✅ Sidekiq Cron Jobs carregados: renewal_job
2024-04-17T02:00:00Z INFO -- SubscriptionRenewalJob has been enqueued
```

### 3️⃣ Produção (Docker)

Adicione ao seu `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  sidekiq:
    build: .
    command: bundle exec sidekiq -c 5 -v -C config/sidekiq.yml
    environment:
      - REDIS_URL=redis://redis:6379/0
      - RAILS_ENV=production
    depends_on:
      - redis
      - db
    volumes:
      - ./log:/app/log

volumes:
  redis_data:
```

### 4️⃣ Produção (Heroku)

```bash
# Procfile
web: bundle exec puma -t 5:5 -p ${PORT:-3000}
worker: bundle exec sidekiq -c 5 -v -C config/sidekiq.yml
scheduler: bundle exec sidekiq -c 1 -v -C config/sidekiq.yml
```

```bash
# Scale
heroku ps:scale web=1 worker=1 scheduler=1
```

### 5️⃣ Produção (Linux/VPS)

**Systemd Service** (`/etc/systemd/system/sidekiq.service`):

```ini
[Unit]
Description=Sidekiq for ChordKeeper
After=network.target redis.service

[Service]
Type=simple
WorkingDirectory=/home/app/chord-keeper-web
ExecStart=/home/app/.rbenv/shims/bundle exec sidekiq -c 5 -v -C config/sidekiq.yml
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sidekiq
User=app

[Install]
WantedBy=multi-user.target
```

```bash
# Enable e start
sudo systemctl enable sidekiq
sudo systemctl start sidekiq
sudo systemctl status sidekiq

# Logs
sudo journalctl -u sidekiq -f
```

---

## 🧪 Como Testar

### Teste 1: Ver Schedule Carregado

```bash
rails console

# Listar jobs agendados
Sidekiq::Cron::Job.all
# => [#<Sidekiq::Cron::Job>]

# Ver detalhes
job = Sidekiq::Cron::Job.find('renewal_job')
puts "Próxima execução: #{job.next_run_time}"
```

### Teste 2: Executar Manualmente

```bash
# Via Rails console
SubscriptionRenewalJob.perform_now

# Via Sidekiq (enfileia para depois)
SubscriptionRenewalJob.perform_later

# Via CLI
bundle exec sidekiq -r ./config/environment.rb -q default -e test -C config/sidekiq.yml
```

### Teste 3: Simular Execução Agendada

```bash
rails console

# Simular agora (sem aguardar 2 AM)
Sidekiq::Cron::Job.find('renewal_job').trigger!

# Ver na saída do Sidekiq:
# ✅ SubscriptionRenewalJob está sendo executado
```

---

## 📊 Monitorar

### Sidekiq Web UI

Por padrão, disponível em `http://localhost:3000/sidekiq`

Para habilitar em production, adicione ao `config/routes.rb`:

```ruby
# config/routes.rb
require 'sidekiq/web'

Sidekiq::Web.use Rack::Auth::Basic do |username, password|
  username == ENV.fetch('SIDEKIQ_USERNAME', 'admin') &&
  password == ENV.fetch('SIDEKIQ_PASSWORD', 'password')
end

mount Sidekiq::Web => '/sidekiq'
```

### Logs

```bash
# Desenvolvimento
tail -f log/development.log | grep "SubscriptionRenewalJob\|Sidekiq"

# Production
tail -f log/production.log | grep "SubscriptionRenewalJob\|Sidekiq"

# Docker
docker logs -f container_name | grep Sidekiq
```

---

## 🔧 Customizar Schedule

### Mudar Horário

```yaml
# config/sidekiq.yml
renewal_job:
  cron: '0 3 * * *'  # Mudar para 3:00 AM
```

### Mudar Frequência

```yaml
# A cada 30 minutos
renewal_job:
  cron: '*/30 * * * *'

# A cada hora
renewal_job:
  cron: '0 * * * *'

# Três vezes por dia (9 AM, 2 PM, 9 PM)
renewal_job:
  cron: '0 9,14,21 * * *'

# Segunda a Sexta, às 2 AM
renewal_job:
  cron: '0 2 * * 1-5'
```

**Referência Cron**: [Cron Helper](https://crontab.guru/)

### Adicionar Mais Jobs

```yaml
:schedule:
  renewal_job:
    cron: '0 2 * * *'
    class: SubscriptionRenewalJob
    queue: default

  cleanup_job:
    cron: '0 3 * * 0'  # Domingo às 3 AM
    class: CleanupJob
    queue: default

  report_job:
    cron: '0 9 * * *'  # Todos os dias às 9 AM
    class: ReportJob
    queue: default
```

---

## 🐛 Troubleshooting

### Job não está rodando?

**Check 1: Sidekiq está rodando?**
```bash
ps aux | grep sidekiq
# Deve mostrar processo rodando
```

**Check 2: Redis está rodando?**
```bash
redis-cli ping
# => PONG
```

**Check 3: Schedule carregou?**
```bash
rails runner "puts Sidekiq::Cron::Job.all.map(&:name)"
# => renewal_job
```

**Check 4: Ver logs**
```bash
tail -f log/development.log | grep "renewal_job\|SubscriptionRenewal"
```

### Job rodando muito frequentemente?

```bash
# Reset schedule (remove todos os jobs)
rails runner "Sidekiq::Cron::Job.all.each(&:delete)"

# Recarregar
rails runner "load '#{Rails.root}/config/initializers/sidekiq.rb'"
```

### Timezone errado?

```ruby
# config/application.rb
config.time_zone = 'Brasilia'  # Mude para sua timezone
```

```bash
# Verificar
rails runner "puts Time.zone.now"
```

---

## 📝 Environment Variables

Adicione ao `.env`:

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Opcional: Web UI
SIDEKIQ_USERNAME=admin
SIDEKIQ_PASSWORD=seu_password_seguro
```

---

## 🚀 Próximos Passos

1. Run `bundle install`
2. Run Sidekiq: `bundle exec sidekiq -c 5 -v`
3. Monitorar em http://localhost:3000/sidekiq
4. Ver logs: `tail -f log/development.log`

---

## ✨ Resultado Final

- ✅ SubscriptionRenewalJob roda **automaticamente** às **2:00 AM**
- ✅ Sem necessidade de** cron job manual
- ✅ Sem necessidade de `whenever` gem
- ✅ Sidekiq gerencia tudo
- ✅ Web UI para monitorar
- ✅ Escalável para múltiplos workers

**Status**: ✅ Pronto para Produção!


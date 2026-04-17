# 🚀 Quick Start - Sidekiq Schedule para SubscriptionRenewalJob

**Status**: ✅ PRONTO PARA USAR

---

## 📦 O Que Foi Adicionado

1. ✅ Gem `sidekiq-cron` no Gemfile
2. ✅ Arquivo `config/sidekiq.yml` com schedule
3. ✅ Inicializador `config/initializers/sidekiq.rb` atualizado
4. ✅ Procfile com processos
5. ✅ Docker Compose com Sidekiq

---

## 🎯 Schedule Configurado

```
SubscriptionRenewalJob roda:
├─ Horário: 2:00 AM UTC
├─ Frequência: Diariamente
└─ Fila: default
```

---

## 🚀 Como Usar

### Desenvolvimento Local (3 passos)

**Passo 1: Instalar gemas**
```bash
bundle install
```

**Passo 2: Iniciar Redis (Terminal 1)**
```bash
redis-server
```

**Passo 3: Iniciar Sidekiq (Terminal 2)**
```bash
bundle exec sidekiq -c 5 -v
```

Você verá:
```
✅ Sidekiq Cron Jobs carregados: renewal_job
2026-04-17T02:00:00Z INFO -- SubscriptionRenewalJob has been scheduled
```

### Produção Docker (1 comando)

```bash
# Usar docker-compose com Sidekiq
docker-compose -f docker-compose.sidekiq.yml up

# Escalar workers
docker-compose -f docker-compose.sidekiq.yml up -d --scale sidekiq=2
```

### Produção Heroku

```bash
# Procfile já está configurado
git push heroku main

# Escalar
heroku ps:scale web=1 worker=1 scheduler=1
```

---

## 📊 Monitorar

### Ver Próxima Execução

```bash
rails runner "
job = Sidekiq::Cron::Job.find('renewal_job')
puts \"Próxima execução: #{job.next_run_time}\"
"
```

### Web UI (Desenvolvimento)

```
http://localhost:3000/sidekiq
```

### Logs

```bash
tail -f log/development.log | grep "renewal_job\|SubscriptionRenewal"
```

---

## ✨ Resultado

```
✅ Job roda automaticamente às 2:00 AM
✅ Renovacao automática de assinaturas
✅ Retry automático por 10 dias
✅ Downgrade para free após falha
✅ Sem cron manual necesário
✅ Escalável
```

---

## 📚 Documentação Completa

Ver: [SIDEKIQ_SCHEDULE_CONFIG.md](SIDEKIQ_SCHEDULE_CONFIG.md)

---

## 🔧 Customizar Horário

**Em `config/sidekiq.yml`:**

```yaml
renewal_job:
  cron: '0 3 * * *'  # Mudar para 3:00 AM
```

Referência: https://crontab.guru/

---

**Status**: ✅ Pronto!  
**Próximo**: `bundle install` → Redis → Sidekiq


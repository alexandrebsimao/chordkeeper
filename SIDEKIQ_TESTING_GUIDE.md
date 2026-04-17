# 🧪 Testando Sidekiq Schedule em Desenvolvimento

**Quick Test**: 5 minutos

---

## Setup Inicial

### Terminal 1: Redis
```bash
redis-server
# Output: Ready to accept connections
```

### Terminal 2: Rails + Sidekiq
```bash
cd chord-keeper-web
bundle install  # primeira vez
bundle exec sidekiq -c 5 -v

# Output:
# ✅ Sidekiq Cron Jobs carregados: renewal_job
# 2026-04-17T14:30:00Z INFO -- Scheduler: Job loaded
```

### Terminal 3: Rails Console
```bash
rails console
```

---

## Test 1: Ver Schedule Carregado (30 seg)

```ruby
# Em rails console

# Listar todos os jobs
Sidekiq::Cron::Job.all.map { |j| [j.name, j.cron] }
# => [["renewal_job", "0 2 * * *"]]

# Ver próxima execução
job = Sidekiq::Cron::Job.find('renewal_job')
puts job.next_run_time
# => 2026-04-18 02:00:00 UTC

# Ver se está ativo
puts job.valid?
# => true
```

---

## Test 2: Enfileirar Manualmente (1 min)

```ruby
# Em rails console

# Via Sidekiq (enfileira para depois)
SubscriptionRenewalJob.perform_later

# Ver fila
require 'sidekiq/api'
queue = Sidekiq::Queue.new
queue.size
# => 1

# Ver job na fila
queue.each { |job| puts job }
```

---

## Test 3: Executar Agora (2 min)

```ruby
# Em rails console

# Executa imediatamente (no processo atual)
SubscriptionRenewalJob.perform_now

# Você verá no Terminal 2 (Sidekiq):
# 2026-04-17T14:35:00Z INFO -- SubscriptionRenewalJob JID-abc123
# 2026-04-17T14:35:01Z INFO -- SubscriptionRenewalJob: Encontradas 3 assinaturas para renovar
# 2026-04-17T14:35:02Z INFO -- SubscriptionRenewalJob: Concluído
```

---

## Test 4: Forçar Execução do Scheduler (2 min)

```ruby
# Em rails console

# Simula execução agora
Sidekiq::Cron::Job.find('renewal_job').trigger!

# Você verá no Terminal 2:
# 2026-04-17T14:35:30Z INFO -- SubscriptionRenewalJob has been scheduled
```

---

## Test 5: Monitorar Fila em Tempo Real (1 min)

```bash
# Em novo Terminal

# Watch na fila
watch -n 0.1 'redis-cli LLEN "queue:default"'

# Ou via Rails
rails runner "loop { puts Sidekiq::Queue.new.size; sleep 1 }"
```

---

## Test 6: Ver Detalhes do Job na Fila

```ruby
# Em rails console

require 'sidekiq/api'

# Ver primeiro job da fila
queue = Sidekiq::Queue.new
job = queue.first

puts job.item  # Dados completos
# => {"class"=>"SubscriptionRenewalJob", "args"=>[], "retry"=>5, "queue"=>"default", ...}
```

---

## Test 7: Limpar Fila

```ruby
# Em rails console

require 'sidekiq/api'

# Limpar
Sidekiq::Queue.new.clear
# => 0 (items removidos)

# Ver
Sidekiq::Queue.new.size
# => 0
```

---

## Test 8: Acompanhar Logs em Tempo Real

```bash
# Terminal novo

# Apenas Sidekiq logs
tail -f log/development.log | grep "Sidekiq\|SubscriptionRenewal"

# Ou com menos verbosidade
tail -f log/development.log | grep -i renewal
```

---

## Test 9: Agendar com Atraso (3 min)

```ruby
# Em rails console

# Agendar para 10 segundos depois
SubscriptionRenewalJob.perform_later(wait: 10.seconds)

# Agendar para horário específico
SubscriptionRenewalJob.set(wait_until: 1.hour.from_now).perform_later

# Ver fila de agendadas
require 'sidekiq/api'
scheduled = Sidekiq::ScheduledSet.new
puts "Scheduled jobs: #{scheduled.size}"

scheduled.each { |job| puts "#{job.klass} at #{Time.at(job.score)}" }
```

---

## Test 10: Histórico de Execuções (2 min)

```ruby
# Em rails console

require 'sidekiq/api'

# Ver estatísticas
stats = Sidekiq::Stats.new

puts "Processados: #{stats.processed}"
puts "Falhas: #{stats.failed}"
puts "Atualmente processando: #{stats.processes_size} workers"
puts "Latência média: #{stats.mean_latency}ms"
```

---

## Test 11: Simular Falha e Retry

```ruby
# No arquivo do job, modifique temporariamente:

class SubscriptionRenewalJob < ApplicationJob
  def perform
    raise "Simulando erro para teste"
  end
end
```

```ruby
# Em rails console

SubscriptionRenewalJob.perform_now
# => StandardError: Simulando erro para teste

# Ver na fila de retry
require 'sidekiq/api'
retries = Sidekiq::RetrySet.new
puts retries.size
# => 1
```

---

## Test 12: Web UI (Observar em Tempo Real)

1. Iniciar Rails: `rails s`
2. Abrir browser: http://localhost:3000/sidekiq
3. Ver:
   - Queues (filas)
   - Workers (processadores)
   - Processes (sidekiq processes)
   - Retry (jobs falhados)
   - Schedule (agendados)
   - Stats (estatísticas)

---

## 🎯 Checklist de Teste Completo

Execute na ordem:

- [ ] Test 1: Schedule carregado
- [ ] Test 2: Enfileirar manualmente
- [ ] Test 3: Executar agora
- [ ] Test 4: Forçar scheduler
- [ ] Test 5: Monitorar fila
- [ ] Test 6: Ver detalhes
- [ ] Test 7: Limpar fila
- [ ] Test 8: Logs em tempo real
- [ ] Test 9: Agendar com atraso
- [ ] Test 10: Histórico
- [ ] Test 11: Simular falha
- [ ] Test 12: Web UI

**Tempo total**: ~20 minutos

---

## 🐛 Troubleshooting

### Redis não está rodando
```
Error: Redis::ConnectionError: Error connecting to Redis
```
**Solução**:
```bash
redis-server
```

### Job não executa às 2 AM
**Check 1**: Timezone
```ruby
puts Time.zone.now
# Deve ser em Brasilia (ou sua timezone)
```

**Check 2**: Schedule carregou
```ruby
Sidekiq::Cron::Job.find('renewal_job')
# Deve retornar o job
```

**Check 3**: Sidekiq está rodando
```bash
ps aux | grep sidekiq
# Deve mostrar processo
```

### Job fica na retry infinitamente
```ruby
# Limpar retry set
require 'sidekiq/api'
Sidekiq::RetrySet.new.clear
```

---

## 📊 Exemplo de Output Esperado

**Terminal 2 (Sidekiq) - quando job executa:**

```
2026-04-17T02:00:00Z INFO -- Scheduler: Job scheduled for execution
2026-04-17T02:00:01Z INFO -- SubscriptionRenewalJob JID-abc123: start
2026-04-17T02:00:01Z INFO -- SubscriptionRenewalJob: Encontradas 5 assinaturas para renovar
2026-04-17T02:00:02Z INFO -- SubscriptionRenewalJob: Renovação de assinatura 1 bem-sucedida
2026-04-17T02:00:03Z INFO -- SubscriptionRenewalJob: Renovação de assinatura 2 bem-sucedida
2026-04-17T02:00:03Z INFO -- SubscriptionRenewalJob: Concluído. Processadas 5 assinaturas
2026-04-17T02:00:03Z INFO -- SubscriptionRenewalJob JID-abc123: finish (0.001 seconds)
```

---

## ✅ Próxima Etapa

Após confirmar todos os testes:

1. Deploy para staging
2. Monitorar por 24h (verifique Se executa às 2 AM)
3. Deploy para produção
4. Configurar alertas e logs

---

**Status**: ✅ Pronto para testar!  
**Tempo estimado**: 20 minutos


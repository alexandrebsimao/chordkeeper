# Número de threads
threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
threads threads_count, threads_count

# Porta
port ENV.fetch("PORT") { 3000 }

# Ambiente
environment ENV.fetch("RAILS_ENV") { "production" }

# Workers (opcional, para melhor performance)
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Preload app para economizar memória
preload_app!

# Bind em todas as interfaces
bind "tcp://0.0.0.0:3000"

# IMPORTANTE: NÃO adicione configurações SSL aqui!
# O SSL é feito pelo Traefik
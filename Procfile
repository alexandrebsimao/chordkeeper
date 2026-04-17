# Procfile - Definição de processos para desenvolvimento e produção

# Web server
web: bundle exec puma -t 5:5 -p ${PORT:-3000} -e ${RAILS_ENV:-development}

# Background job processing
worker: bundle exec sidekiq -c 5 -v -C config/sidekiq.yml

# Optional: Dedicated scheduler (um só processo)
scheduler: bundle exec sidekiq -c 1 -v -C config/sidekiq.yml

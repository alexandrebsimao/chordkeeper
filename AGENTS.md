# Repository Guidelines

## Project Structure & Module Organization
This repository combines a Rails API/backend with a React frontend.
- `app/`, `config/`, `db/`: Rails app code, environment config, and migrations.
- `app/controllers/api/`, `app/services/`, `app/models/`: API endpoints, business logic, and domain models.
- `test/`: Minitest suites (models, controllers, system tests).
- `spec/`: RSpec suites (services, models, controllers, support/factories).
- `frontend/src/`: React + TypeScript UI (`components/`, `pages/`, `hooks/`, `services/api/`).
- `frontend/public/`: static frontend assets.

## Build, Test, and Development Commands
This project runs in Docker. Prefer `docker compose` from the repo root instead of running Rails or Node directly on the host.

Full stack (repo root):
- `docker compose up --build`: build and start Rails, PostgreSQL, Redis, Sidekiq, and the Vite frontend.
- `docker compose up`: start the existing Docker services.
- `docker compose down`: stop and remove the local containers.
- `docker compose exec web bin/rails db:prepare`: create/migrate DB for the Docker environment.
- `docker compose exec web bin/rails test test:system`: run Minitest + system tests.
- `docker compose exec web bundle exec rspec`: run RSpec suites.
- `docker compose exec web bin/rubocop -f github`: run Ruby linting.
- `docker compose exec web bin/brakeman --no-pager`: run Rails security scan.

Frontend:
- `docker compose exec frontend npm run dev -- --host 0.0.0.0`: start Vite dev server in the frontend container if it is not already running.
- `docker compose exec frontend npm run build`: production build.
- `docker compose exec frontend npm run lint`: run ESLint for TS/React.
- `docker compose exec frontend npm run preview -- --host 0.0.0.0`: preview built frontend.

## Coding Style & Naming Conventions
- Ruby style follows `rubocop-rails-omakase` (`.rubocop.yml`); run RuboCop before PRs.
- Use 2-space indentation in Ruby and idiomatic Rails naming (`SongPdfCache`, `SetlistsController`).
- Frontend uses TypeScript + ESLint; prefer `PascalCase` for React components, `camelCase` for functions/hooks, and kebab-case only for non-code assets when needed.
- Keep service/repository files namespaced by feature (example: `app/services/songs/...`).

## Testing Guidelines
- Primary local test command: `docker compose exec web bin/rails db:test:prepare test test:system`.
- Add/maintain Minitest for request/model/system behavior in `test/`.
- Add/maintain RSpec for service/domain behavior in `spec/` (use `spec/factories`).
- Name tests by behavior and target class (example: `spec/services/permission_service_spec.rb`).

## Commit & Pull Request Guidelines
- Recent history uses short Portuguese summaries (for example, `Ajustes`, `Ajustes de segurança`); prefer clearer imperative messages like `Corrige validação de compartilhamento`.
- Keep commits focused and atomic.
- PRs should include: objective, key changes, test coverage notes, linked issue (if any), and screenshots/GIFs for frontend changes.
- Ensure CI checks pass (Brakeman, importmap audit, RuboCop, tests) before requesting review.

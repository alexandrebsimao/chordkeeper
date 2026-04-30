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
Backend (repo root):
- `bin/setup`: install gems, prepare DB, clear temp/logs, then start server.
- `bin/dev`: run Rails server locally.
- `bin/rails db:prepare`: create/migrate DB for current environment.
- `bin/rails test test:system`: run Minitest + system tests.
- `bin/rubocop -f github`: run Ruby linting.
- `bin/brakeman --no-pager`: run Rails security scan.

Frontend (`frontend/`):
- `npm run dev`: start Vite dev server.
- `npm run build`: production build.
- `npm run lint`: run ESLint for TS/React.
- `npm run preview`: preview built frontend.

## Coding Style & Naming Conventions
- Ruby style follows `rubocop-rails-omakase` (`.rubocop.yml`); run RuboCop before PRs.
- Use 2-space indentation in Ruby and idiomatic Rails naming (`SongPdfCache`, `SetlistsController`).
- Frontend uses TypeScript + ESLint; prefer `PascalCase` for React components, `camelCase` for functions/hooks, and kebab-case only for non-code assets when needed.
- Keep service/repository files namespaced by feature (example: `app/services/songs/...`).

## Testing Guidelines
- Primary CI test command: `bin/rails db:test:prepare test test:system`.
- Add/maintain Minitest for request/model/system behavior in `test/`.
- Add/maintain RSpec for service/domain behavior in `spec/` (use `spec/factories`).
- Name tests by behavior and target class (example: `spec/services/permission_service_spec.rb`).

## Commit & Pull Request Guidelines
- Recent history uses short Portuguese summaries (for example, `Ajustes`, `Ajustes de segurança`); prefer clearer imperative messages like `Corrige validação de compartilhamento`.
- Keep commits focused and atomic.
- PRs should include: objective, key changes, test coverage notes, linked issue (if any), and screenshots/GIFs for frontend changes.
- Ensure CI checks pass (Brakeman, importmap audit, RuboCop, tests) before requesting review.

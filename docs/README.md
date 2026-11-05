# 📚 Documentação do ChordKeeper

Bem-vindo à documentação do ChordKeeper. Este diretório centraliza os guias, relatórios técnicos, especificações e documentações de arquitetura do projeto.

---

## 🗂️ Estrutura da Documentação

```
docs/
├── README.md                          # Este índice geral
├── TODO.md                            # Lista de tarefas e backlog de desenvolvimento
├── levantamento-funcional.md          # Levantamento funcional e requisitos do sistema
├── modelo.txt                         # Exemplo de modelo/estrutura de texto
│
├── auth/                              # Autenticação e integrações OAuth
│   ├── GOOGLE_OAUTH_SETUP.md          # Guia passo a passo de configuração do Google OAuth
│   └── OAUTH_IMPLEMENTATION.md        # Resumo técnico da implementação OAuth no backend
│
├── deployment/                        # Guias e notas de deploy
│   └── DEPLOY_FRONTEND.md             # Notas e correções para deploy do frontend
│
├── environment/                       # Configuração de ambientes e variáveis
│   ├── ENV_SETUP_CHECKLIST.md         # Checklist de verificação de variáveis de ambiente
│   └── ENV_VARIABLES_GUIDE.md         # Guia completo de variáveis de ambiente
│
├── frontend/                          # Arquitetura e refatorações do frontend
│   ├── COMPONENT_REFACTORING.md       # Documentação de hooks e componentes refatorados
│   └── REFACTORING.md                 # Visão geral das refatorações e estrutura do React
│
├── pdf/                               # Geração, visualização e performance de PDFs
│   ├── PDF_OPTIMIZATION_GUIDE.md      # Análise e otimização da geração de PDFs (Grover/Puppeteer)
│   └── REACT_PDF_SETUP.md             # Setup e visualização de PDFs com React-PDF
│
└── security/                          # Auditoria e segurança
    └── SECURITY_REPORT.md             # Relatório de segurança e análise com Brakeman
```

---

## 📖 Guias Rápidos por Assunto

### 🔐 Autenticação
- **[Setup do Google OAuth](auth/GOOGLE_OAUTH_SETUP.md)**: Passo a passo para configurar credenciais no Google Cloud Console e variáveis no app.
- **[Implementação Técnica OAuth](auth/OAUTH_IMPLEMENTATION.md)**: Detalhes dos endpoints, fluxo Devise + JWT e integração com o frontend.

### ⚙️ Ambiente e Configuração
- **[Guia de Variáveis de Ambiente](environment/ENV_VARIABLES_GUIDE.md)**: Descrição detalhada de todas as variáveis do backend e frontend.
- **[Checklist de Configuração](environment/ENV_SETUP_CHECKLIST.md)**: Lista de checagem para configurar um novo ambiente local ou de produção.

### ⚛️ Frontend
- **[Refatorações e Arquitetura Frontend](frontend/REFACTORING.md)**: Padrões de código, organização em camadas e manutenibilidade.
- **[Componentes e Hooks](frontend/COMPONENT_REFACTORING.md)**: Detalhamento dos hooks customizados e componentes desacoplados.

### 📄 PDFs
- **[Otimização de Geração de PDFs](pdf/PDF_OPTIMIZATION_GUIDE.md)**: Estratégias de cache, background jobs e Puppeteer para exportação de cifras e setlists.
- **[Visualização com React-PDF](pdf/REACT_PDF_SETUP.md)**: Configuração do leitor de PDF no MusicPlayer.

### 🛡️ Segurança
- **[Relatório de Segurança](security/SECURITY_REPORT.md)**: Vulnerabilidades mapeadas com Brakeman, status de mitigação e boas práticas.

### 🚀 Deploy
- **[Deploy Frontend](deployment/DEPLOY_FRONTEND.md)**: Ajustes de configuração no Docker Compose e servidores web para produção.

### 📋 Planejamento
- **[Levantamento Funcional](levantamento-funcional.md)**: Regras de negócio, personas e especificações de funcionalidades.
- **[TODO de Desenvolvimento](TODO.md)**: Tarefas concluídas e pendentes no projeto.

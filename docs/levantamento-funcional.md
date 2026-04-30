# Levantamento Funcional do Sistema

Este documento consolida o que o sistema Cifrary / Chord Keeper faz a partir da estrutura atual do backend Rails e do frontend React.

## Visao Geral

O sistema e uma aplicacao para gerenciar cifras, musicas e setlists. Ele combina uma API Rails com um frontend React/TypeScript e roda em Docker.

Principais capacidades:

- Autenticacao de usuarios.
- Gerenciamento de bibliotecas.
- Cadastro e organizacao de musicas/cifras.
- Editor e visualizador de cifras em ChordPro.
- Transposicao de acordes.
- Geracao de PDFs.
- Criacao e apresentacao de setlists.
- Compartilhamento de setlists com usuarios e via link publico.

## Autenticacao e Conta

O sistema permite:

- Cadastro de usuario.
- Login com email e senha.
- Login/cadastro com Google OAuth.
- Logout.
- Confirmacao obrigatoria de email.
- Reenvio de email de confirmacao.
- Recuperacao de senha.
- Alteracao de senha em configuracoes.
- Consulta dos dados do usuario autenticado.

A sessao usa JWT em cookies HttpOnly, com refresh token e protecao CSRF para requisicoes que alteram estado.

Ao criar um usuario, o backend cria automaticamente uma biblioteca inicial para ele.

## Bibliotecas

Cada usuario possui ou acessa bibliotecas de musicas.

O backend suporta:

- Listar bibliotecas acessiveis pelo usuario.
- Consultar uma biblioteca especifica.
- Definir a biblioteca atual como escopo de trabalho.
- Compartilhar biblioteca com outros usuarios por email.
- Alterar permissao de usuarios em uma biblioteca.
- Remover acesso de usuarios a uma biblioteca.

Permissoes suportadas:

- `owner`
- `admin`
- `editor`
- `read_only`

Observacao: parte da interface de multiplas bibliotecas e compartilhamento de bibliotecas existe no frontend, mas ha trechos comentados ou nao totalmente ligados a navegacao atual.

## Musicas e Cifras

O sistema permite:

- Listar musicas da biblioteca atual com paginacao.
- Buscar musicas por titulo ou artista.
- Criar musica/cifra.
- Editar musica/cifra.
- Visualizar musica/cifra.
- Excluir musica, desde que ela nao esteja associada a setlists.
- Transpor uma musica para outro tom.
- Gerar PDF individual da musica.

Campos principais de uma musica:

- Titulo.
- Artista.
- Genero.
- Tom original.
- Tom transposto.
- BPM.
- Capotraste.
- Conteudo da cifra.
- Biblioteca.

## Editor ChordPro

O frontend possui um formulario unificado para criar e editar musicas.

Recursos do editor:

- Edicao de conteudo em ChordPro.
- Modo editor.
- Modo visualizacao.
- Modo dividido entre editor e preview.
- Preview formatado.
- Insercoes rapidas de estruturas:
  - verso;
  - refrao;
  - ponte;
  - acorde.
- Conversor de cifra tradicional para ChordPro.
- Sincronizacao de scroll entre editor e visualizador.

## Processamento Musical

O backend possui servicos para:

- Detectar automaticamente o tom quando `original_key` esta vazio e ha conteudo.
- Converter linhas de acordes para formato ChordPro.
- Processar conteudo ChordPro e gerar HTML formatado.
- Transpor acordes para outro tom.
- Formatar acordes acima da letra.

A transposicao suporta:

- Notas naturais.
- Sustenidos.
- Normalizacao de bemois para sustenidos.
- Inversoes de acorde.
- Modificadores basicos.

Tambem ha logica auxiliar para lidar com tablaturas.

## Arquivos e Midias

Musicas podem ter:

- Anexo principal via Active Storage.
- Midias de referencia.

Tipos de anexo principal suportados no backend:

- PDF.
- DOC.
- DOCX.
- TXT.

O backend valida tamanho maximo por tipo de arquivo.

Quando `convert_pdf` esta ativo, o backend tenta extrair texto de PDFs e preencher o conteudo da musica.

Midias de referencia por musica:

- URL.
- Arquivo.
- Descricao.

No frontend, as midias sao exibidas como:

- Links do YouTube.
- Links do Spotify.
- Arquivos de audio reproduziveis.
- PDF anexado para visualizacao/download.

Observacao: parte da UI de upload do anexo principal da musica esta comentada no formulario atual, embora o backend suporte o recurso.

## PDFs

O sistema gera PDFs para:

- Musica individual.
- Setlist completo.
- Setlist publico.

Tecnologias usadas:

- PDFKit para gerar PDF a partir de HTML.
- CombinePDF para unir PDFs.

No caso de setlists:

- Se a musica tiver PDF anexado e nao estiver marcada para conversao, o PDF anexado entra no documento final.
- Caso contrario, o sistema gera um PDF da cifra e junta tudo em um unico arquivo.

Existe um job para cachear PDFs por tamanho de fonte, mas a leitura desse cache esta comentada no servico de geracao atual.

## Setlists

O sistema permite:

- Listar setlists com paginacao.
- Buscar setlists por titulo ou descricao no frontend.
- Criar setlist.
- Visualizar detalhes de um setlist.
- Excluir setlist.
- Adicionar musicas ao setlist.
- Remover musicas do setlist.
- Reordenar musicas por drag and drop.
- Reordenar musicas em dispositivos touch.
- Gerar PDF do setlist.

Campos principais de um setlist:

- Titulo.
- Descricao.
- Biblioteca.
- Dono.
- Musicas ordenadas.

## Modo Apresentacao

O sistema possui modo apresentacao/player para setlists autenticados e publicos.

Recursos:

- Navegar para musica anterior.
- Navegar para proxima musica.
- Exibir posicao atual no setlist.
- Ajustar tamanho da fonte.
- Ativar/desativar scroll automatico.
- Ajustar velocidade do scroll automatico.
- Navegacao por teclado.
- Exibir informacoes da musica, como tom, capotraste, BPM e posicao.

## Compartilhamento de Setlists

O sistema permite compartilhar setlists de duas formas.

### Compartilhamento com Usuarios

O dono do setlist pode:

- Adicionar usuarios por email.
- Definir permissao do usuario.
- Alterar permissao.
- Remover acesso.

Permissoes de setlist:

- `owner`
- `editor`
- `read_only`

### Link Publico

O sistema permite:

- Gerar link publico para um setlist.
- Remover link publico.
- Copiar link publico.
- Gerar QR Code para o link.
- Abrir setlist publico sem login.
- Baixar PDF publico do setlist.
- Abrir modo apresentacao publico.

O QR Code e gerado usando o servico externo `api.qrserver.com`.

## Acesso Publico

Rotas publicas permitem acessar setlists sem autenticacao por meio de token publico.

Funcionalidades publicas:

- Consultar dados basicos do setlist.
- Ver quantidade de musicas.
- Abrir modo apresentacao.
- Baixar PDF.
- Navegar pelas musicas do setlist.
- Usar scroll automatico e ajuste de fonte.

## Permissoes e Seguranca

O backend centraliza permissoes no `PermissionService`.

Tipos de permissao avaliados:

- `read`
- `edit`
- `admin`
- `owner`
- `share`

Protecoes presentes:

- Autenticacao JWT.
- Cookies HttpOnly.
- Refresh token.
- Denylist de JWT para revogacao.
- CSRF em requisicoes mutaveis autenticadas por cookie.
- Validacao de acesso por biblioteca.
- Validacao de acesso por setlist.
- Restricoes para edicao de musicas fora da biblioteca atual.
- Sidekiq Web protegido por Basic Auth quando configurado.

Em producao, `SIDEKIQ_USERNAME` e `SIDEKIQ_PASSWORD` sao obrigatorios.

## Configuracoes do Usuario

A tela de configuracoes permite:

- Ver nome.
- Ver email.
- Ver data de criacao da conta.
- Alterar senha.

Nome e email aparecem como somente leitura na UI atual.

## Infraestrutura

O projeto roda em Docker.

Servicos principais do `docker-compose.yml`:

- `web`: Rails API.
- `db`: PostgreSQL.
- `redis`: Redis.
- `sidekiq`: processamento assíncrono.
- `frontend`: Vite/React.

Backend:

- Rails.
- PostgreSQL.
- Active Storage.
- Devise.
- JWT.
- Sidekiq.
- PDFKit.
- CombinePDF.

Frontend:

- React.
- TypeScript.
- Vite.
- React Router.
- TanStack Query.
- Componentes baseados em UI/shadcn.

## Estruturas Presentes mas Nao Expostas

O schema contem tabelas que nao parecem ter models/controllers/telas ativos no codigo atual:

- `plans`
- `user_subscriptions`
- `feature_flags`

Elas indicam preparacao para planos, assinaturas e feature flags, mas nao aparecem como funcionalidade exposta atualmente.

## Pontos Parcialmente Implementados ou Comentados

- Interface de multiplas bibliotecas no sidebar esta comentada.
- Componentes de compartilhamento de biblioteca existem, mas parte do fluxo nao esta ligada a UI principal.
- Hook de bibliotecas esta simplificado e possui chamadas comentadas para listar/trocar biblioteca.
- Upload de arquivo principal da musica e conversao de PDF existem no backend, mas a UI correspondente esta comentada no formulario.
- Cache de PDF e gerado por job, mas a leitura do cache esta comentada na geracao de PDF.

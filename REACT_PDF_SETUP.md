# Configuração do React-PDF

## O que foi implementado

Foi adicionado o `react-pdf` para visualizar PDFs anexados às músicas no MusicPlayer. 

### Alterações realizadas:

1. **Dependências adicionadas** (`frontend/package.json`):
   - `react-pdf`: ^9.1.1
   - `pdfjs-dist`: ^4.8.69
   - `vite-plugin-static-copy`: ^1.0.6 (dev)

2. **Novo componente**: `frontend/src/components/PdfViewer.tsx`
   - Renderiza PDFs com controles de zoom e navegação entre páginas
   - Suporta múltiplas páginas com navegação
   - Controles de zoom (50% a 300%)

3. **MusicPlayer atualizado**: `frontend/src/pages/setlists/MusicPlayer.tsx`
   - Removido código de blob URL manual
   - Integração com o componente PdfViewer
   - Renderiza PDF quando não há content ou content_format mas existe attachment_url

4. **Vite configurado**: `frontend/vite.config.ts`
   - Plugin para copiar worker do PDF.js durante build
   - Suporte ao worker local

## Como usar

### Para desenvolvimento local:

1. Rebuild do container frontend com as novas dependências:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

### Para Docker Context (servidor remoto):

1. Rebuild e deploy:
```bash
docker context use remote
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

### Verificar instalação:

```bash
# Ver logs do frontend
docker-compose logs -f frontend

# Verificar se as dependências foram instaladas
docker-compose exec frontend npm list react-pdf pdfjs-dist
```

## Como funciona

Quando uma música não tem `content` ou `content_format` mas tem `attachment_url` (PDF anexado):

1. O MusicPlayer renderiza o componente `<PdfViewer>`
2. O PdfViewer usa `react-pdf` para carregar e renderizar o PDF
3. Controles de zoom e navegação de páginas são exibidos automaticamente
4. O PDF é renderizado com layers de texto e anotações habilitados

## Benefícios sobre a implementação anterior

- ✅ Melhor renderização (text layer, anotações)
- ✅ Controles nativos de zoom e navegação
- ✅ Suporte a múltiplas páginas
- ✅ Melhor performance
- ✅ Seleção de texto no PDF
- ✅ Sem problemas de CORS com blob URLs
- ✅ Componente reutilizável

## Troubleshooting

### Erro: "Cannot find module 'react-pdf'"
Rebuild o container: `docker-compose build frontend`

### PDF não carrega
Verifique se o `attachment_url` está correto no console do navegador

### Worker error
Verifique se o plugin `vite-plugin-static-copy` está instalado e o vite.config.ts está correto

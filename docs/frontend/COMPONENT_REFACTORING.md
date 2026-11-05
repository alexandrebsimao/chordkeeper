# Refatorações de Componentes - Frontend

## 📦 Novos Componentes e Hooks Criados

### **1. Hooks**

#### `useRequireAuth()` 
**Arquivo:** `frontend/src/hooks/use-require-auth.ts`

Verifica automaticamente autenticação e redireciona para login se necessário.

**Uso:**
```tsx
const MyProtectedPage = () => {
  useRequireAuth(); // Auto-redirect se não autenticado
  // resto do componente
}
```

**Impacto:** Elimina ~20 duplicações de código de verificação de autenticação.

---

#### `useRequirePermission()`
**Arquivo:** `frontend/src/hooks/use-require-auth.ts`

Verifica autenticação E permissão específica.

**Uso:**
```tsx
const EditPage = () => {
  const { canEdit } = usePermissions();
  useRequirePermission(canEdit, '/songs');
  // resto do componente
}
```

---

#### `usePrintSetlist()`
**Arquivo:** `frontend/src/hooks/use-print-setlist.ts`

Centraliza lógica de impressão de setlist em PDF.

**Uso:**
```tsx
const { printSetlist, printing, error } = usePrintSetlist();

<Button onClick={() => printSetlist(setlistId, 16)} disabled={printing}>
  {printing ? 'Gerando...' : 'Imprimir'}
</Button>
```

**Impacto:** Elimina duplicação de lógica de PDF em 2 páginas (~60 linhas).

---

### **2. Componentes de UI**

#### `<PageHeader>`
**Arquivo:** `frontend/src/components/PageHeader.tsx`

Header padronizado com título, descrição e ação opcional.

**Uso:**
```tsx
<PageHeader 
  title="Minhas Cifras"
  description="Gerencie e acesse suas cifras favoritas"
  action={canEdit() && <Button>Nova Cifra</Button>}
/>
```

**Impacto:** Padroniza headers em todas as páginas (~15 linhas por página).

---

#### `<SearchInput>`
**Arquivo:** `frontend/src/components/SearchInput.tsx`

Input de busca com ícone integrado.

**Uso:**
```tsx
<SearchInput 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar por título ou artista..."
/>
```

**Impacto:** Elimina ~10 linhas de código por página com busca.

---

#### `<ResourceCard>`
**Arquivo:** `frontend/src/components/ResourceCard.tsx`

Card genérico para exibir recursos (músicas, setlists, etc).

**Uso:**
```tsx
<ResourceCard 
  title="Imagine"
  subtitle="John Lennon"
  badges={[
    { label: "Tom: C", variant: "outline", className: "font-mono" },
    { label: "Capo: 2ª casa", variant: "outline" }
  ]}
  onClick={() => navigate(`/songs/${id}`)}
/>
```

**Impacto:** Elimina ~25 linhas de JSX por item de lista.

---

#### `<KeySelector>`
**Arquivo:** `frontend/src/components/KeySelector.tsx`

Seletor de tom musical usando `MUSICAL_KEYS` centralizado.

**Uso:**
```tsx
<KeySelector 
  value={originalKey}
  onChange={setOriginalKey}
  label="Tom Original"
  placeholder="Selecione o tom"
/>
```

**Impacto:** Elimina duplicação de array de tons musicais (~20 linhas).

---

### **3. Componentes de Estado (Já existentes - atualizados)**

#### `<LoadingState>`, `<EmptyState>`, `<ErrorState>`
**Arquivos:** `frontend/src/components/*.tsx`

**Atualização:** `EmptyState` agora tem ícone opcional (default: Music).

---

## 📊 Páginas Migradas

### ✅ `songs/Index.tsx`
- [x] useRequireAuth
- [x] PageHeader
- [x] SearchInput
- [x] LoadingState
- [x] EmptyState
- [x] ErrorState
- [x] ResourceCard

**Linhas economizadas:** ~60 linhas

---

### ✅ `setlists/Index.tsx`
- [x] useRequireAuth
- [x] usePrintSetlist
- [x] PageHeader
- [x] SearchInput
- [x] LoadingState
- [x] EmptyState

**Linhas economizadas:** ~80 linhas

---

## 🎯 Próximas Migrações Recomendadas

### Alta Prioridade:

1. **`songs/Create.tsx` e `songs/Edit.tsx`**
   - Criar `<SongForm>` unificado
   - Elimina ~400 linhas de duplicação
   - Sub-componentes: `<MediaReferenceManager>`, `<SongBasicInfoSection>`, `<SongContentSection>`

2. **`songs/Show.tsx`**
   - Usar `useRequireAuth`
   - Usar `KeySelector` para transposição
   - Usar `LoadingState`/`ErrorState`
   - ~40 linhas economizadas

3. **`setlists/SetlistManager.tsx`**
   - Usar `useRequireAuth`
   - Usar `useRequirePermission`
   - Usar `usePrintSetlist`
   - ~80 linhas economizadas

### Média Prioridade:

4. **Páginas auth (`Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`)**
   - Podem compartilhar componentes de formulário
   - `<AuthFormCard>` component

5. **`Settings.tsx`**
   - Usar `useRequireAuth`
   - Usar `LoadingState`/`ErrorState`

---

## 📈 Impacto Total Estimado

### Já Implementado:
- **Hooks criados:** 3 (useRequireAuth, useRequirePermission, usePrintSetlist)
- **Componentes criados:** 4 (PageHeader, SearchInput, ResourceCard, KeySelector)
- **Componentes atualizados:** 1 (EmptyState - ícone opcional)
- **Páginas migradas:** 2 (songs/Index, setlists/Index)
- **Linhas eliminadas:** ~140 linhas
- **Código mais legível e manutenível:** ✅

### Próximas Migrações (Estimado):
- **SongForm unificado:** ~400 linhas economizadas
- **Demais páginas:** ~200 linhas economizadas
- **Total projetado:** ~740 linhas eliminadas

---

## 🔄 Como Usar os Novos Componentes

### Pattern para Páginas de Lista:

```tsx
import { useRequireAuth } from '@/hooks/use-require-auth';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ResourceCard } from '@/components/ResourceCard';

const MyListPage = () => {
  useRequireAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader 
          title="Minha Lista"
          description="Descrição da página"
          action={<Button>Nova Item</Button>}
        />
        
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar..."
        />

        {loading ? (
          <LoadingState message="Carregando..." />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum item encontrado" />
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <ResourceCard key={item.id} {...item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## ✅ Checklist de Migração

Ao migrar uma nova página, seguir este checklist:

- [ ] Remover `isAuthenticated()` e verificações manuais → usar `useRequireAuth()`
- [ ] Remover header manual → usar `<PageHeader>`
- [ ] Remover input de busca com ícone → usar `<SearchInput>`
- [ ] Remover estados de loading/empty/error manuais → usar componentes
- [ ] Remover cards customizados → usar `<ResourceCard>` quando aplicável
- [ ] Remover seletor de tom musical → usar `<KeySelector>`
- [ ] Remover lógica de impressão → usar `usePrintSetlist()`

---

## 🎨 Benefícios

1. **Consistência:** UI padronizada em todas as páginas
2. **Manutenibilidade:** Mudanças centralizadas
3. **DRY:** Elimina duplicação massiva
4. **Legibilidade:** Código mais limpo e declarativo
5. **Testabilidade:** Componentes isolados e testáveis
6. **Performance:** Componentes otimizados e reutilizáveis

---

## 📝 Notas de Desenvolvimento

- Todos os componentes são **backward-compatible**
- Migração pode ser feita **gradualmente**
- TypeScript errors esperados em ambiente isolado (dependências não instaladas)
- Testar em desenvolvimento após npm install
- Componentes seguem padrão shadcn/ui

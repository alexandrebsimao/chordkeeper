/**
 * Configurações e constantes centralizadas
 */

// Musical keys
export const MUSICAL_KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type MusicalKey = (typeof MUSICAL_KEYS)[number];

// Pagination
export const PAGINATION_DEFAULTS = {
  perPage: 6,
  loadMoreThreshold: 1.0,
} as const;

// API Routes
export const API_ROUTES = {
  songs: "/api/songs",
  setlists: "/api/setlists",
  libraries: "/api/libraries",
  users: "/api/users",
  auth: {
    login: "/users/sign_in",
    logout: "/users/sign_out",
    register: "/users",
    forgotPassword: "/users/password",
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  unauthorized: "Você não tem permissão para realizar esta ação",
  notFound: "Recurso não encontrado",
  serverError: "Erro no servidor. Tente novamente mais tarde",
  networkError: "Erro de conexão. Verifique sua internet",
  loadError: "Erro ao carregar dados",
  saveError: "Erro ao salvar dados",
  deleteError: "Erro ao excluir",
  invalidData: "Dados inválidos",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  created: "Criado com sucesso",
  updated: "Atualizado com sucesso",
  deleted: "Excluído com sucesso",
  saved: "Salvo com sucesso",
} as const;

// Font sizes for PDF
export const PDF_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24] as const;

export type PdfFontSize = (typeof PDF_FONT_SIZES)[number];

// Permission roles
export const PERMISSION_ROLES = {
  owner: "owner",
  admin: "admin",
  editor: "editor",
  readOnly: "read_only",
} as const;

export type PermissionRole = (typeof PERMISSION_ROLES)[keyof typeof PERMISSION_ROLES];

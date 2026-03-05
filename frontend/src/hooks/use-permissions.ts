import { useMemo } from "react";
import { useLibraries, Library } from "./use-libraries";

export type Permission = "read" | "edit" | "admin" | "owner" | "share";
export type Role = "owner" | "admin" | "editor" | "read_only";

/**
 * Hook centralizado para verificação de permissões
 * Baseado na mesma lógica do backend (PermissionService)
 */
export function usePermissions() {
  const { currentLibrary } = useLibraries();

  /**
   * Verifica se o usuário tem uma permissão específica
   * Alinhado com o PermissionService do backend
   */
  const can = (permission: Permission, objectLibraryId?: number): boolean => {
    return currentLibrary?.id === objectLibraryId;
  };

  // Métodos auxiliares para facilitar o uso
  const canRead = (objectLibraryId?: number) => can("read", objectLibraryId);
  const canEdit = (objectLibraryId?: number) => can("edit", objectLibraryId);
  const canAdmin = (objectLibraryId?: number) => can("admin", objectLibraryId);
  const isOwner = (objectLibraryId?: number) => can("owner", objectLibraryId);
  const canShare = (objectLibraryId?: number) => can("share", objectLibraryId);

  // Retorna o role atual
  const role = (): Role | null => {
    return (currentLibrary?.permission as Role) || null;
  };

  return {
    can,
    canRead,
    canEdit,
    canAdmin,
    isOwner,
    canShare,
    role,
    currentLibrary,
  };
}

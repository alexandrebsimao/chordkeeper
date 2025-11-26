import { useMemo } from "react";
import { useLibraries, Library } from "./use-libraries";

export type Permission = "read" | "edit" | "admin" | "owner" | "share";
export type Role = "owner" | "admin" | "editor" | "read_only";

/**
 * Hook centralizado para verificação de permissões
 * Baseado na mesma lógica do backend (PermissionService)
 */
export function usePermissions() {
  const { libraries } = useLibraries();
  const currentLibrary = useMemo(
    () => libraries.find((lib) => lib.is_current),
    [libraries]
  );

  /**
   * Verifica se o usuário tem uma permissão específica
   * Alinhado com o PermissionService do backend
   */
  const can = (permission: Permission): boolean => {
    if (!currentLibrary?.permission) return false;

    const role = currentLibrary.permission as Role;

    // Matriz de permissões (mesma do backend)
    const permissionMatrix: Record<Permission, Role[]> = {
      read: ["owner", "admin", "editor", "read_only"],
      edit: ["owner", "admin", "editor"],
      admin: ["owner", "admin"],
      owner: ["owner"],
      share: ["owner", "admin", "editor"],
    };

    return permissionMatrix[permission]?.includes(role) || false;
  };

  // Métodos auxiliares para facilitar o uso
  const canRead = () => can("read");
  const canEdit = () => can("edit");
  const canAdmin = () => can("admin");
  const isOwner = () => can("owner");
  const canShare = () => can("share");

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

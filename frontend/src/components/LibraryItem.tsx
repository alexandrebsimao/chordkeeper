import { Library as LibraryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import ManageLibraryUsersDialog from "@/components/ManageLibraryUsersDialog";

interface Library {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  permission?: "owner" | "admin" | "editor" | "read_only";
  is_current?: boolean;
}

interface CurrentUser {
  id: number;
  email: string;
  name?: string;
}

interface LibraryItemProps {
  library: Library;
  currentUser: CurrentUser | null;
  isCurrentLibrary: boolean;
  onLibraryChange: (libraryId: number) => void;
  sidebarOpen: boolean;
}

export function LibraryItem({ 
  library, 
  currentUser, 
  isCurrentLibrary, 
  onLibraryChange,
  sidebarOpen 
}: LibraryItemProps) {
  // Check admin permission for THIS specific library, not the current one
  const hasAdminPermission = library.permission === "owner" || library.permission === "admin";

  const getPermissionBadge = () => {
    // Use the permission from THIS library, not the current library
    const libraryRole = library.permission;
    if (libraryRole === "owner") {
      return <Badge variant="default" className="ml-2 text-xs">Admin</Badge>;
    }
    if (libraryRole === "admin") {
      return <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>;
    }
    if (libraryRole === "editor") {
      return <Badge variant="secondary" className="ml-2 text-xs">Editor</Badge>;
    }
    return <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800 border-amber-200">Leitura</Badge>;
  };

  return (
    <SidebarMenuItem>
      <div className="flex items-center gap-1 w-full">
        <SidebarMenuButton
          asChild
          className={`flex-1 min-w-0 ${
            isCurrentLibrary
              ? "bg-sidebar-accent text-sidebar-primary"
              : ""
          }`}
        >
          <button 
            onClick={() => onLibraryChange(library.id)}
            className="flex items-center justify-between gap-2 w-full px-2"
          >
            <span className="truncate text-sm font-medium" title={library.name}>
              {library.name}
            </span>
            {sidebarOpen && (
              <div className="flex-shrink-0">
                {getPermissionBadge()}
              </div>
            )}
          </button>
        </SidebarMenuButton>
        {hasAdminPermission && (
          <div className="flex-shrink-0">
            <ManageLibraryUsersDialog
              libraryId={library.id}
              libraryName={library.name}
              isOwner={true}
            />
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
}

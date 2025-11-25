import { Library as LibraryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import ManageLibraryUsersDialog from "@/components/ManageLibraryUsersDialog";

interface Library {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  permission?: "owner" | "editor" | "read_only";
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
  const isOwner = () => {
    return library.permission === "owner" || (currentUser && library.owner_id === currentUser.id);
  };

  const getPermissionBadge = () => {
    if (library.permission === "owner") {
      return <Badge variant="default" className="ml-2 text-xs">Admin</Badge>;
    }
    if (library.permission === "editor") {
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
        {isOwner() && (
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

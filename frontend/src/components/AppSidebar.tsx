import { Home, Plus, Search, ListMusic, Settings, LogOut, Library, Users, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import { LibraryItem } from "@/components/LibraryItem";
import { Badge } from "@/components/ui/badge";
import { useLibraries } from "@/hooks/use-libraries";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { title: "Minhas Cifras", url: "/songs", icon: Home },
  { title: "Adicionar Cifra", url: "/songs/create", icon: Plus },
  { title: "Setlists", url: "/setlists", icon: ListMusic },
];

const bottomItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Sair", url: "/logout", icon: LogOut },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { libraries, currentUser, switchLibrary, currentLibraryId: apiCurrentLibraryId } = useLibraries();
  const [currentLibraryId, setCurrentLibraryId] = useState<number | null>(null);
  const [librariesOpen, setLibrariesOpen] = useState(() => {
    const saved = localStorage.getItem('librariesOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const { canEdit } = usePermissions();

  const filteredMenuItems = menuItems.filter(item => {
    if (item.url === "/songs/create") {
      return canEdit();
    }
    return true;
  });

  useEffect(() => {
    if (apiCurrentLibraryId) {
      setCurrentLibraryId(apiCurrentLibraryId);
    } else if (libraries.length > 0 && !currentLibraryId) {
      setCurrentLibraryId(libraries[0].id);
    }
  }, [libraries, apiCurrentLibraryId]);

  useEffect(() => {
    localStorage.setItem('librariesOpen', JSON.stringify(librariesOpen));
  }, [librariesOpen]);

  const handleLibraryChange = async (libraryId: number) => {
    const success = await switchLibrary(libraryId);
    if (success) {
      setCurrentLibraryId(libraryId);
      window.location.reload();
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="px-6 py-4">
            <h2 className="text-xl font-bold text-sidebar-foreground">chorfy</h2>
          </div>

          {/* <SidebarGroup>
            <Collapsible open={librariesOpen} onOpenChange={setLibrariesOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    {open && <span>Bibliotecas</span>}
                  </div>
                  {open && (
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${librariesOpen ? "rotate-90" : ""}`}
                    />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {libraries.map((library) => (
                      <LibraryItem
                        key={library.id}
                        library={library}
                        currentUser={currentUser}
                        isCurrentLibrary={currentLibraryId === library.id}
                        onLibraryChange={handleLibraryChange}
                        sidebarOpen={open}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup> */}
          
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className="h-5 w-5" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

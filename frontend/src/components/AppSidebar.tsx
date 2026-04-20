import { Home, Plus, ListMusic, Settings, LogOut, CreditCard, ShieldCheck, Users, SlidersHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLibraries } from "@/hooks/use-libraries";
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

const menuItems = [
  { title: "Minhas Cifras", url: "/songs", icon: Home },
  { title: "Adicionar Cifra", url: "/songs/create", icon: Plus },
  { title: "Setlists", url: "/setlists", icon: ListMusic },
  { title: "Assinatura", url: "/billing", icon: CreditCard },
];

const adminItems = [
  { title: "Planos", url: "/admin/plans", icon: ShieldCheck },
  { title: "Clientes", url: "/admin/customers", icon: Users },
  { title: "Funcionalidades", url: "/admin/features", icon: SlidersHorizontal },
];

const bottomItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Sair", url: "/logout", icon: LogOut },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { currentUser } = useLibraries();

  const isAdmin = Boolean((currentUser as any)?.admin || (currentUser as any)?.role === "admin");

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="px-6 py-4 flex items-center">
            <img 
              src="/logo-cifrary.png" 
              alt="Cifrary Logo" 
              className="h-20 w-auto"
            />
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
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

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Painel Administrativo</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
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
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex flex-col items-start py-4 border-t border-sidebar-border">
              {currentUser?.name && (
                <div className="flex items-center gap-3 mb-4 pl-4">
                  <div className="bg-sidebar-accent rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold text-sidebar-primary">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-base font-semibold text-sidebar-foreground">{currentUser.name}</span>
                </div>
              )}

              <div className="w-full flex flex-col gap-2 mt-2">
                {bottomItems.map((item, idx) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent/60 text-sidebar-foreground ${idx === 0 ? "mb-1" : ""}`}
                    activeClassName="bg-sidebar-accent text-sidebar-primary"
                  >
                    <item.icon className="h-5 w-5" />
                    {open && <span>{item.title}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

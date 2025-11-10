import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import Index from "./pages/songs/Index";
import AddCifra from "./pages/songs/Create";
import EditSong from "./pages/songs/Edit";
import CifraView from "./pages/songs/Show";
import Search from "./pages/Search";
import Setlists from "./pages/setlists/Index";
import SetlistManager from "./pages/setlists/SetlistManager";
import Settings from "./pages/Settings";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b bg-background hidden md:flex items-center px-6">
                <SidebarTrigger />
                <h1 className="ml-4 font-semibold text-lg">ChordKeeper</h1>
              </header>
              <main className="flex-1 flex flex-col">
                <Routes>
                  <Route path="/songs/" element={<Index />} />  
                  <Route path="/songs/add" element={<AddCifra />} />
                  <Route path="/songs/:id/edit" element={<EditSong />} />
                  <Route path="/songs/:id" element={<CifraView />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/setlists" element={<Setlists />} />
                  <Route path="/setlist/:id" element={<SetlistManager />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/logout" element={<Logout />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <MobileNav />
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

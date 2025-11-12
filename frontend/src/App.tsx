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
import Setlists from "./pages/setlists/Index";
import SetlistManager from "./pages/setlists/SetlistManager";
import MusicPlayer from "./pages/setlists/MusicPlayer";
import PublicSetlistOptions from "./pages/public/PublicSetlistOptions";
import PublicMusicPlayer from "./pages/public/PublicMusicPlayer";
import Settings from "./pages/Settings";
import Logout from "./pages/Logout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes without sidebar */}
          <Route path="/" element={<Login />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          
          {/* Public routes without sidebar */}
          <Route path="/public/setlist/:publicToken" element={<PublicSetlistOptions />} />
          <Route path="/public/setlist/:publicToken/play" element={<PublicMusicPlayer />} />
          
          {/* App routes with sidebar */}
          <Route path="/*" element={
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
                      <Route path="/songs/create" element={<AddCifra />} />
                      <Route path="/songs/:id/edit" element={<EditSong />} />
                      <Route path="/songs/:id" element={<CifraView />} />
                      <Route path="/setlists" element={<Setlists />} />
                      <Route path="/setlist/:id" element={<SetlistManager />} />
                      <Route path="/setlist/:id/play" element={<MusicPlayer />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <MobileNav />
                </div>
              </div>
            </SidebarProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

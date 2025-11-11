import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { removeAuthToken, fetchWithAuth } from "@/lib/auth";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Chamar endpoint de logout do backend (revoga o token JWT)
        await fetchWithAuth("/users/sign_out", {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      } finally {
        // Sempre remove o token local
        removeAuthToken();
        
        // Aguarda um pouco antes de redirecionar
        setTimeout(() => {
          navigate("/auth/login");
        }, 1500);
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <LogOut className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Saindo...</h2>
        <p className="text-muted-foreground">Até logo!</p>
      </div>
    </div>
  );
};

export default Logout;

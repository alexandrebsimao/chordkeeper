import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simula logout e redireciona
    const timer = setTimeout(() => {
      navigate("/");
    }, 1500);

    return () => clearTimeout(timer);
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

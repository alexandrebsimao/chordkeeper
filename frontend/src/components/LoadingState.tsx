import { Music2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

/**
 * Componente reutilizável para estados de carregamento
 * Usado em: songs/Show, songs/Edit, setlists/SetlistManager, etc.
 */
export function LoadingState({
  message = "Carregando...",
  icon: Icon = Music2,
  size = "md",
}: LoadingStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Icon className={`${sizes[size]} text-muted-foreground mx-auto mb-4 animate-pulse`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

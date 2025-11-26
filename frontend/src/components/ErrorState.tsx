import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Componente reutilizável para estados de erro
 */
export function ErrorState({
  error,
  onRetry,
  icon: Icon = Music2,
}: ErrorStateProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-red-500 mb-4">{errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
}

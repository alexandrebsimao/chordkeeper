import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Crown } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  limitType?: 'songs' | 'setlists' | 'feature';
  currentCount?: number;
  limit?: number;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title,
  message,
  limitType,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  const defaultTitle = limitType
    ? `Limite de ${limitType === 'songs' ? 'músicas' : 'setlists'} atingido`
    : 'Recurso não disponível no seu plano';

  const defaultMessage = limitType
    ? `Você atingiu o limite de ${currentCount}/${limit} ${
        limitType === 'songs' ? 'músicas' : 'setlists'
      } do seu plano atual. Faça upgrade para continuar adicionando mais conteúdo.`
    : 'Este recurso não está disponível no seu plano atual. Faça upgrade para acessar todas as funcionalidades.';

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/plans');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message || defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <Crown className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">
                  Desbloqueie recursos ilimitados
                </h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>✓ Músicas e setlists ilimitadas</li>
                  <li>✓ Colaboração em tempo real</li>
                  <li>✓ Exportação em PDF</li>
                  <li>✓ Compartilhamento público</li>
                  <li>✓ E muito mais...</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Continuar no plano atual
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Ver Planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

interface PrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (fontSize: number) => void;
  isPrinting: boolean;
}

export default function PrintOptionsDialog({
  open,
  onOpenChange,
  onPrint,
  isPrinting,
}: PrintOptionsDialogProps) {
  const [fontSize, setFontSize] = useState<number>(16);

  const handlePrint = () => {
    onPrint(fontSize);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Opções de Impressão</DialogTitle>
          <DialogDescription>
            Ajuste o tamanho da fonte antes de imprimir o setlist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fontSize">
              Tamanho da Fonte: {fontSize}px
            </Label>
            <Slider
              id="fontSize"
              min={12}
              max={24}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="w-full"
              disabled={isPrinting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12px</span>
              <span>18px</span>
              <span>24px</span>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
            <pre style={{ fontSize: `${fontSize}px` }} className="font-mono">
              <span className="text-blue-600 font-bold">C</span>    <span className="text-blue-600 font-bold">G</span>    <span className="text-blue-600 font-bold">Am</span>   <span className="text-blue-600 font-bold">F</span>{'\n'}
              Exemplo de música{'\n'}
              com cifras e letras
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPrinting}
          >
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              'Imprimir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '@/lib/auth';

interface UsePrintSetlistReturn {
  printSetlist: (setlistId: number, fontSize?: number) => Promise<void>;
  printing: boolean;
  error: string | null;
}

/**
 * Hook to centralize setlist printing logic.
 * Handles PDF generation, blob creation, and opening in new tab.
 * 
 * @example
 * ```tsx
 * const { printSetlist, printing } = usePrintSetlist();
 * 
 * <Button onClick={() => printSetlist(setlistId, 16)} disabled={printing}>
 *   {printing ? 'Gerando...' : 'Imprimir'}
 * </Button>
 * ```
 */
export function usePrintSetlist(): UsePrintSetlistReturn {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const printSetlist = async (setlistId: number, fontSize: number = 16) => {
    setPrinting(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `/api/setlists/${setlistId}/print?font_size=${fontSize}`
      );

      if (response.status === 401) {
        navigate('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF do setlist');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create temporary URL
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new tab
      window.open(url, '_blank');
      
      // Clean up URL after delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (err: any) {
      console.error('Failed to print setlist', err);
      setError(err.message || 'Erro ao gerar PDF');
      throw err; // Re-throw for caller to handle if needed
    } finally {
      setPrinting(false);
    }
  };

  return { printSetlist, printing, error };
}

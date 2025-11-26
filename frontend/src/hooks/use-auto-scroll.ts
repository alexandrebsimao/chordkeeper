import { useEffect, useRef, useCallback } from "react";

type Song = {
  content?: string;
  formatted_content?: string;
  content_format?: string;
  attachment_url?: string;
};

interface UseAutoScrollProps {
  isScrolling: boolean;
  scrollSpeed: number;
  currentSong: Song | null;
  onScrollComplete: () => void;
}

interface UseAutoScrollReturn {
  contentRef: React.RefObject<HTMLDivElement>;
  setContentRef: (element: HTMLDivElement | null) => void;
  scrollIntervalRef: React.RefObject<NodeJS.Timeout | null>;
}

/**
 * Hook para gerenciar scroll automático de conteúdo HTML
 * Para PDFs, o PdfViewer gerencia o scroll internamente
 */
export function useAutoScroll({
  isScrolling,
  scrollSpeed,
  currentSong,
  onScrollComplete,
}: UseAutoScrollProps): UseAutoScrollReturn {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Callback ref para garantir que sempre temos a referência
  const setContentRef = useCallback((element: HTMLDivElement | null) => {
    contentRef.current = element;
  }, []);

  // Reset scroll position when song changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentSong]);

  // Controle de scroll automático para conteúdo HTML
  useEffect(() => {
    // Detectar se é PDF - se for, deixar o PdfViewer gerenciar o scroll
    const isPdf = !currentSong?.content && !currentSong?.formatted_content && 
                  !currentSong?.content_format && currentSong?.attachment_url;
    if (isPdf) return;

    if (!isScrolling) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    if (!contentRef.current) {
      return;
    }

    // Aguardar um pouco antes de começar o scroll para garantir que o conteúdo foi renderizado
    const startDelay = setTimeout(() => {
      scrollIntervalRef.current = setInterval(() => {
        if (!contentRef.current) {
          return;
        }

        contentRef.current.scrollTop += scrollSpeed;

        // Parar quando chegar ao final
        const isAtBottom =
          contentRef.current.scrollHeight - contentRef.current.scrollTop <=
          contentRef.current.clientHeight + 10;

        if (isAtBottom) {
          onScrollComplete();
        }
      }, 50);
    }, 200);

    return () => {
      clearTimeout(startDelay);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isScrolling, scrollSpeed, currentSong, onScrollComplete]);

  return {
    contentRef,
    setContentRef,
    scrollIntervalRef,
  };
}

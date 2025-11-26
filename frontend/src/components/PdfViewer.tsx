import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar o worker do PDF.js via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  isScrolling: boolean;
  scrollSpeed: number;
  scale: number;
  onScrollComplete?: () => void;
}

const PdfViewer = ({ url, isScrolling, scrollSpeed, scale, onScrollComplete }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  // Controle de scroll automático
  useEffect(() => {
    if (!isScrolling) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    // Delay para garantir que o PDF está renderizado
    const startScrollTimeout = setTimeout(() => {
      if (!containerRef.current) {
        return;
      }

      scrollIntervalRef.current = setInterval(() => {
        if (!containerRef.current) {
          return;
        }

        containerRef.current.scrollTop += scrollSpeed;
        
        // Parar quando chegar ao final
        const remainingScroll = containerRef.current.scrollHeight - containerRef.current.scrollTop;
        const isAtBottom = remainingScroll <= containerRef.current.clientHeight + 10;
        
        if (isAtBottom && onScrollComplete) {
          onScrollComplete();
        }
      }, 50);
    }, 200);

    return () => {
      clearTimeout(startScrollTimeout);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isScrolling, scrollSpeed]); // Removido onScrollComplete das dependências

  return (
    <div className="flex flex-col items-center space-y-4 w-full h-full">
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto w-full flex justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Carregando PDF...</p>
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8">
              <p className="text-red-500">Erro ao carregar PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {numPages > 1 && (
        <div className="flex items-center gap-4 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <span className="text-sm font-medium">
            Página {pageNumber} de {numPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;

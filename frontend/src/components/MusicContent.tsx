import PdfViewer from "@/components/PdfViewer";
import { sanitizeHtml } from "@/lib/sanitize";

interface Song {
  content?: string;
  formatted_content?: string;
  content_format?: string;
  attachment_url?: string;
}

interface MusicContentProps {
  song: Song | null;
  fontSize: number;
  isScrolling: boolean;
  scrollSpeed: number;
  contentRef: (element: HTMLDivElement | null) => void;
  onScrollComplete: () => void;
}

export default function MusicContent({
  song,
  fontSize,
  isScrolling,
  scrollSpeed,
  contentRef,
  onScrollComplete,
}: MusicContentProps) {
  const isPdf = !song?.content && !song?.formatted_content && !song?.content_format && song?.attachment_url;

  return (
    <>
      <style>{`
        .cifra-content .chord-line {
          font-family: 'Courier New', monospace !important;
          font-size: ${fontSize}px !important;
          line-height: 1.4 !important;
        }
        .cifra-content .lyrics-line {
          font-family: 'Courier New', monospace !important;
          font-size: ${fontSize}px !important;
          line-height: 1.4 !important;
        }
        
        /* Sobrescreve estilos inline do HTML vindo do backend */
        .cifra-content div[style*="white-space: pre"] {
          font-size: ${fontSize}px !important;
        }

        .music-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          height: 100%;
        }
      `}</style>
      <div
        ref={contentRef}
        className="music-content cifra-content overflow-x-auto overflow-y-auto"
      >
        {isPdf ? (
          <PdfViewer
            url={song.attachment_url!}
            isScrolling={isScrolling}
            scrollSpeed={scrollSpeed}
            onScrollComplete={onScrollComplete}
            scale={fontSize / 12}
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                song?.content_format ||
                song?.formatted_content ||
                song?.content ||
                "Sem conteúdo disponível."
              ),
            }}
          />
        )}
      </div>
    </>
  );
}

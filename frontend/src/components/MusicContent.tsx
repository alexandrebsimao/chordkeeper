import PdfViewer from "@/components/PdfViewer";

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
        .cifra-content .chord-line,
        .cifra-content .chord {
          color: #2563eb;
          font-weight: bold;
          padding: 0;
          margin: 0;
        }

        .cifra-content .notation {
          color: #d97706;
          font-style: italic;
        }

        .music-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          height: 100%;
        }
      `}</style>
      <div
        ref={contentRef}
        className="music-content cifra-content font-mono text-xs sm:text-sm md:text-base whitespace-pre-wrap leading-relaxed overflow-x-auto overflow-y-auto"
        style={{ fontSize: `${fontSize}px` }}
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
              __html:
                song?.content_format ||
                song?.formatted_content ||
                song?.content ||
                "Sem conteúdo disponível.",
            }}
          />
        )}
      </div>
    </>
  );
}

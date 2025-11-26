import { useEffect, RefObject } from "react";

interface UseMusicNavigationProps {
  currentIndex: number;
  songsLength: number;
  contentRef: RefObject<HTMLDivElement>;
  onNext: () => void;
  onPrevious: () => void;
  onToggleScroll: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

/**
 * Hook para gerenciar navegação por teclado no player de música
 */
export function useMusicNavigation({
  currentIndex,
  songsLength,
  contentRef,
  onNext,
  onPrevious,
  onToggleScroll,
  onIncreaseFontSize,
  onDecreaseFontSize,
}: UseMusicNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!contentRef.current) return;

      const scrollAmount = 50;

      switch (e.key) {
        case " ": // Spacebar
          e.preventDefault();
          onToggleScroll();
          break;
        case "+":
        case "=":
          e.preventDefault();
          onIncreaseFontSize();
          break;
        case "-":
        case "_":
          e.preventDefault();
          onDecreaseFontSize();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex < songsLength - 1) {
            onNext();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          contentRef.current.scrollTop -= scrollAmount;
          break;
        case "ArrowDown":
          e.preventDefault();
          contentRef.current.scrollTop += scrollAmount;
          break;
        case "PageUp":
          e.preventDefault();
          contentRef.current.scrollTop -= contentRef.current.clientHeight;
          break;
        case "PageDown":
          e.preventDefault();
          contentRef.current.scrollTop += contentRef.current.clientHeight;
          break;
        case "Home":
          e.preventDefault();
          contentRef.current.scrollTop = 0;
          break;
        case "End":
          e.preventDefault();
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentIndex,
    songsLength,
    contentRef,
    onNext,
    onPrevious,
    onToggleScroll,
    onIncreaseFontSize,
    onDecreaseFontSize,
  ]);
}

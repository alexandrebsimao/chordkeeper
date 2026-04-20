import { Play, Pause, ZoomIn, ZoomOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface MusicPlayerControlsProps {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  onToggleScroll: () => void;
  onScrollSpeedChange: (value: number) => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
}

export default function MusicPlayerControls({
  isScrolling,
  scrollSpeed,
  fontSize,
  onToggleScroll,
  onScrollSpeedChange,
  onIncreaseFontSize,
  onDecreaseFontSize,
}: MusicPlayerControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onDecreaseFontSize}
        className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
        title={`Diminuir fonte (${fontSize}px)`}
      >
        <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <span className="text-xs font-semibold text-muted-foreground min-w-[2.5rem] text-center">
        {fontSize}px
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={onIncreaseFontSize}
        className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
        title={`Aumentar fonte (${fontSize}px)`}
      >
        <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <Label htmlFor="scroll-speed">
                Velocidade do Scroll: {scrollSpeed}x
              </Label>
              <Slider
                id="scroll-speed"
                min={0.5}
                max={5}
                step={0.5}
                value={[scrollSpeed]}
                onValueChange={(value) => onScrollSpeedChange(value[0])}
                className="mt-2"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={isScrolling ? "destructive" : "default"}
        size="icon"
        onClick={onToggleScroll}
        className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
      >
        {isScrolling ? (
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </Button>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

interface Song {
  original_key?: string;
  key?: string;
  capo?: number;
  bpm?: number;
}

interface SongInfoBadgesProps {
  song: Song | null;
  currentIndex: number;
  totalSongs: number;
}

export default function SongInfoBadges({
  song,
  currentIndex,
  totalSongs,
}: SongInfoBadgesProps) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <Badge variant="outline" className="font-mono text-xs">
        {currentIndex + 1} / {totalSongs}
      </Badge>
      {song?.original_key && (
        <Badge variant="outline" className="font-mono text-xs">
          Tom: {song.key || song.original_key}
        </Badge>
      )}
      {song?.capo !== null && song?.capo !== undefined && song?.capo > 0 && (
        <Badge variant="outline" className="font-mono text-xs">
          Capotraste: {song.capo}ª casa
        </Badge>
      )}
      {song?.bpm && (
        <Badge variant="outline" className="font-mono text-xs">
          BPM: {song.bpm}
        </Badge>
      )}
    </div>
  );
}

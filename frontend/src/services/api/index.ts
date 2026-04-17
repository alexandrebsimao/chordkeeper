/**
 * Centralized API Services
 * 
 * Uso:
 * import { songsService, setlistsService } from '@/services/api';
 * 
 * const songs = await songsService.list();
 * const setlist = await setlistsService.getById(1);
 */

export { songsService } from "./songs";
export { setlistsService } from "./setlists";
export { billingService } from "./billing";
// export { librariesService } from "./libraries";

export type { Song, MediaReference, CreateSongData } from "./songs";
export type { Setlist, SetlistSong, CreateSetlistData } from "./setlists";
export type { Plan, Subscription } from "./billing";
// export type { Library } from "./libraries";

declare module 'mpris-service' {
  type PlayerInterfaces = 'player' | 'playlists' | 'trackList';

  /** Options for the player */
  type PlayerOptions = {
    /** Name on the bus to export to as `org.mpris.MediaPlayer2.{name}`. */
    name: string;

    /** Identity for the player to display on the root media player interface. */
    identity: string;

    /** The URI schemes supported by the media player. */
    supportedUriSchemes: string[];

    /** Mime types this player can open with the `org.mpris.MediaPlayer2.Open` method. */
    supportedMimeTypes: string[];

    /** The interfaces this player supports. Can include `'player'`, `'playlists'`, and `'trackList'`. */
    supportedInterfaces?: PlayerInterfaces[];
  };

  type Track = any;
  type Playlist = any;

  type PlayerPlaybackStatus = 'Playing' | 'Paused' | 'Stopped';

  enum PlayerLoopStatus {
    None = 'None',
    Track = 'Track',
    Playlist = 'Playlist',
  }

  type PlayerEvent = {
    raise: () => void;
    quit: () => void;
    next: () => void;
    previous: () => void;
    pause: () => void;
    playpause: () => void;
    stop: () => void;
    play: () => void;
    seek: (position: number) => void;
    position: (trackId: string, position: number) => void;
    open: (uri: string) => void;
    volume: (vol: number) => void;
    loopStatus: (status: PlayerLoopStatus) => void;
    shuffle: (shuffleOn: boolean) => void;
    activatePlaylist: (playlistId: string) => void;
  };

  class MprisPlayer {
    getPosition(): number;
    seeked(position: number): void;
    getTrackIndex(trackId: string): number;
    getTrack(trackId: string): Track;
    addTrack(track: Track): void;
    removeTrack(trackId: string): void;
    getPlaylistIndex(playlistId: string): number;
    setPlaylists(playlists: Playlist[]): void;
    setActivePlaylist(playlistId: string): void;
    /**
     * Get a valid object path with the `subpath` as the basename which is suitable
     * for use as an id.
     *
     * @function
     * @param  subpath - The basename of this path
     * @returns A valid object path that can be used as an id.
     */
    objectPath(subpath: string): string;
    on<U extends keyof PlayerEvent>(event: U, handler: PlayerEvent[U]): void;
    metadata: MPRISMetadata;
    playbackStatus: PlayerPlaybackStatus;
  }

  function Player(opts: PlayerOptions): MprisPlayer;

  export = Player;
}

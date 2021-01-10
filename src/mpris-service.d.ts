declare module "mpris-service" {
  type PlayerInterfaces = "player" | "playlists" | "trackList";

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

  /** For more see https://www.freedesktop.org/wiki/Specifications/mpris-spec/metadata/ */
  type MPRISMetadata = {
    /** D-Bus path: A unique identity for this track within the context of an MPRIS object (eg: tracklist). */
    "mpris:trackid"?: string;

    /** The track artist(s). */
    "xesam:artist"?: string[];

    /** The duration of the track in microseconds. */
    "mpris:length"?: number;

    /** The location of an image representing the track or album. Clients should not assume this will continue to exist when the media player stops giving out the URL. */
    "mpris:artUrl"?: string;

    /** The album name. */
    "xesam:album"?: string;

    /** The album artist(s). */
    "xesam:albumArtist"?: string[];

    /** The track title. */
    "xesam:title"?: string;

    /** The track number on the album disc. */
    "xesam:trackNumber"?: number;

    /** The location of the media file. */
    "xesam:url"?: string;

    /** The track lyrics. */
    "xesam:asText"?: string;

    /** The speed of the music, in beats per minute. */
    "xesam:audioBPM"?: number;

    /** An automatically-generated rating, based on things such as how often it has been played. This should be in the range 0.0 to 1.0. */
    "xesam:autoRating"?: number;

    /** A (list of) freeform comment(s). */
    "xesam:comment"?: string[];

    /** The composer(s) of the track. */
    "xesam:composer"?: string[];

    /** When the track was created. Usually only the year component will be useful. */
    "xesam:contentCreated"?: Date;

    /** The disc number on the album that this track is from. */
    "xesam:discNumber"?: number;

    /** When the track was first played. */
    "xesam:firstUsed"?: Date;

    /** The genre(s) of the track. */
    "xesam:genre"?: string[];

    /** When the track was last played. */
    "xesam:lastUsed"?: Date;

    /** The lyricist(s) of the track. */
    "xesam:lyricist"?: string[];

    /** The number of times the track has been played. */
    "xesam:useCount"?: number;

    /** A user-specified rating. This should be in the range 0.0 to 1.0. */
    "xesam:userRating"?: number;
  };

  type PlayerPlaybackStatus = "Playing" | "Paused" | "Stopped";

  enum PlayerLoopStatus {
    None = "None",
    Track = "Track",
    Playlist = "Playlist",
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

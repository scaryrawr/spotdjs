/** For more see https://www.freedesktop.org/wiki/Specifications/mpris-spec/metadata/ */
type MPRISMetadata = {
  /** D-Bus path: A unique identity for this track within the context of an MPRIS object (eg: tracklist). */
  'mpris:trackid'?: string;

  /** The track artist(s). */
  'xesam:artist'?: string[];

  /** The duration of the track in microseconds. */
  'mpris:length'?: number;

  /** The location of an image representing the track or album. Clients should not assume this will continue to exist when the media player stops giving out the URL. */
  'mpris:artUrl'?: string;

  /** The album name. */
  'xesam:album'?: string;

  /** The album artist(s). */
  'xesam:albumArtist'?: string[];

  /** The track title. */
  'xesam:title'?: string;

  /** The track number on the album disc. */
  'xesam:trackNumber'?: number;

  /** The location of the media file. */
  'xesam:url'?: string;

  /** The track lyrics. */
  'xesam:asText'?: string;

  /** The speed of the music, in beats per minute. */
  'xesam:audioBPM'?: number;

  /** An automatically-generated rating, based on things such as how often it has been played. This should be in the range 0.0 to 1.0. */
  'xesam:autoRating'?: number;

  /** A (list of) freeform comment(s). */
  'xesam:comment'?: string[];

  /** The composer(s) of the track. */
  'xesam:composer'?: string[];

  /** When the track was created. Usually only the year component will be useful. */
  'xesam:contentCreated'?: Date;

  /** The disc number on the album that this track is from. */
  'xesam:discNumber'?: number;

  /** When the track was first played. */
  'xesam:firstUsed'?: Date;

  /** The genre(s) of the track. */
  'xesam:genre'?: string[];

  /** When the track was last played. */
  'xesam:lastUsed'?: Date;

  /** The lyricist(s) of the track. */
  'xesam:lyricist'?: string[];

  /** The number of times the track has been played. */
  'xesam:useCount'?: number;

  /** A user-specified rating. This should be in the range 0.0 to 1.0. */
  'xesam:userRating'?: number;
};

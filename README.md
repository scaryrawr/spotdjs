# Spotify DJs

This is an MPRIS Player wrapper around the Spotify Web APIs.

It has very limitted functionality since it's only goal is to integrate with MPRIS.

For more advance actions, I'd recommend checking out [spotify-tui](https://github.com/Rigellute/spotify-tui).

![GNOME Demo](./demo.gif)

Designed mostly to be used with [librespot](https://github.com/librespot-org/librespot). To have integration with
`playerctl` and `gnome-shell`.

## Setup

Uses node v18 or higher.

### Build and link

```sh
npm install
npm run build
npm link
```

### Create application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications) and create a new app.
2. Add the desired callback uri in the app (with the desired port)
3. Copy the Client ID into spotdjs.conf
4. Store the Client secret `secret-tool store --label='custom-label' service spotdjs account CLIENT_ID`
5. Set up the port number and redirect url
6. Copy the `spotdjs.conf` to `~/.config/spotdjs/spotdjs.conf`

### Set librespot callback

When running librespot, configure it to call the callback script:

```sh
librespot --onevent "~/GitHub/spotdjs/librespothandler.sh" # other options...
```

### First run

On the first run, it won't work since we haven't actually authenticated yet, but will output a link to authenticate with Spotify. Click that link and sign in to authorize spotdjs to be able to read playback state, modify playback sate, and read currently playing.

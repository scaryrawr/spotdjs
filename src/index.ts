#!/usr/bin/env node

import SpotifyWebApi = require('spotify-web-api-node');
import * as express from 'express';
import Player = require('mpris-service');
import { Config } from './Config';
import { ImageCache } from './ImageCache';
import { exit } from 'process';
import * as os from 'os';

const app = express();

const player = Player({
  name: 'spotdjs',
  identity: 'Spotify MPRIS controller',
  supportedUriSchemes: ['spotify'],
  supportedMimeTypes: [],
  supportedInterfaces: ['player'],
});

const imgCache = new ImageCache();
const configuration = new Config();
let last_device: string | undefined | null;

async function updateMetadata(data: SpotifyApi.TrackObjectFull) {
  if (data.album.images.length > 0) {
    const imgUri = await imgCache.getImageLocation(data.album.images[0].url);
    player.metadata = {
      'mpris:trackid': player.objectPath(`track/${data.id}`),
      'xesam:artist': data.artists.map(artist => artist.name),
      'mpris:length': data.duration_ms * 1000,
      'mpris:artUrl': imgUri,
      'xesam:album': data.album.name,
      'xesam:albumArtist': data.album.artists.map(artist => artist.name),
      'xesam:title': data.name,
      'xesam:trackNumber': data.track_number,
      'xesam:url': data.preview_url ?? undefined,
    };
  } else {
    player.metadata = {
      'mpris:trackid': player.objectPath(`track/${data.id}`),
      'xesam:artist': data.artists.map(artist => artist.name),
      'mpris:length': data.duration_ms * 1000,
      'xesam:album': data.album.name,
      'xesam:albumArtist': data.album.artists.map(artist => artist.name),
      'xesam:title': data.name,
      'xesam:trackNumber': data.track_number,
      'xesam:url': data.preview_url ?? undefined,
    };
  }
}

let spotify: SpotifyWebApi | undefined;
let expirationEpoch: number | undefined;

(async function () {
  const credentials = await configuration.config();
  spotify = new SpotifyWebApi(credentials);
  const cache = await configuration.cache();
  if (cache) {
    spotify.setRefreshToken(cache.refreshToken);
    const tokenResponse = await spotify.refreshAccessToken();
    spotify.setAccessToken(tokenResponse.body.access_token);
    expirationEpoch = new Date().getTime() / 1000 + tokenResponse.body.expires_in;

    const state = await spotify.getMyCurrentPlaybackState();
    last_device = state.body.device?.id;
    player.playbackStatus = state.body.is_playing ? 'Playing' : 'Paused';
    const track = state.body.item;
    if (track) {
      await updateMetadata(track);
    }
  } else {
    console.log(
      spotify.createAuthorizeURL(
        ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing'],
        'tacos'
      )
    );
  }
})().catch(err => {
  console.log(err);
  exit(-1);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const authCode = req.query.code;
  if (typeof authCode !== 'string' || !spotify) {
    res.sendStatus(500);
    return;
  }

  try {
    const tokenResponse = await spotify.authorizationCodeGrant(authCode);
    spotify.setAccessToken(tokenResponse.body.access_token);
    spotify.setRefreshToken(tokenResponse.body.refresh_token);
    await configuration.storeAuth({ refreshToken: tokenResponse.body.refresh_token });
    expirationEpoch = new Date().getTime() / 1000 + tokenResponse.body.expires_in;
    const state = await spotify.getMyCurrentPlaybackState();
    player.playbackStatus = state.body.is_playing ? 'Playing' : 'Paused';
    const track = state.body.item;
    if (track) {
      await updateMetadata(track);
    }

    res.send('OK');
  } catch (err) {
    console.log('failed to authenticate ', err.message);
    res.sendStatus(500);
  }
});

player.getPosition = function () {
  return 0;
};

app.put('/track/:trackId', async (req, res) => {
  if (!spotify) {
    res.sendStatus(500);
    return;
  }

  try {
    const trackResponse = await spotify.getTrack(req.params.trackId);
    const track = trackResponse.body;
    await updateMetadata(track);
    switch (req.query.event) {
      case 'start':
      case 'change':
      case 'playing':
        player.playbackStatus = 'Playing';
        break;
      case 'paused':
      case 'stop':
        player.playbackStatus = 'Paused';
        break;
    }

    res.send('OK');
  } catch (err) {
    console.log('Failed to get track info: ', err.message);
    res.sendStatus(500);
  }
});

setInterval(async () => {
  if (!spotify) {
    return;
  }

  if (expirationEpoch && expirationEpoch - new Date().getTime() / 1000 < 600) {
    try {
      const data = await spotify.refreshAccessToken();
      spotify.setAccessToken(data.body.access_token);
      expirationEpoch = new Date().getTime() / 1000 + data.body.expires_in;
    } catch (err) {
      console.log('Failed to refresh token: ', err.message);
    }
  }

  const state = await spotify.getMyCurrentPlaybackState();
  player.playbackStatus = state.body.is_playing ? 'Playing' : 'Paused';
  if (state.body.item) {
    await updateMetadata(state.body.item);
  }
}, 25000);

async function handlePause() {
  if (!spotify) {
    return;
  }

  try {
    await spotify.pause();
    player.playbackStatus = 'Paused';
  } catch (err) {
    console.log('Failed to pause/stop: ', err.message);
  }
}

async function handlePlay() {
  if (!spotify) {
    return;
  }

  try {
    try {
      await spotify.play();
    } catch (err) {
      const devices = (await spotify.getMyDevices()).body.devices;
      const hostname = os.hostname();
      const targetId =
        last_device && last_device in devices.map(dev => dev.id)
          ? last_device
          : devices.filter(dev => dev.name === hostname).map(dev => dev.id)[0];
      if (!targetId) {
        throw err;
      }

      console.log(targetId);
      await spotify.transferMyPlayback([targetId], {
        play: true,
      });
    }

    player.playbackStatus = 'Playing';
  } catch (err) {
    console.log('failed to play: ', err.message);
  }
}

player.on('pause', handlePause);

player.on('stop', handlePause);

player.on('playpause', async () => {
  if (!spotify) {
    return;
  }

  const state = await spotify.getMyCurrentPlaybackState();
  last_device = state.body.device?.id;
  if (state.body.is_playing) {
    await handlePause();
  } else {
    await handlePlay();
  }
});

player.on('play', handlePlay);

player.on('next', function () {
  spotify?.skipToNext();
});

player.on('previous', function () {
  spotify?.skipToPrevious();
});

configuration.config().then(function (config) {
  app.listen(config.port, function () {
    console.log(`App is listening on port ${config.port}`);
  });
});

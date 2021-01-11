#!/usr/bin/env node

import SpotifyWebApi = require("spotify-web-api-node");
import * as express from "express";
import Player = require("mpris-service");
import { Config } from "./Config";
import { ImageCache } from "./ImageCache";
import { exit } from "process";
const app = express();
const player = Player({
  name: "spotdjs",
  identity: "Spotify MPRIS controller",
  supportedUriSchemes: ["spotify"],
  supportedMimeTypes: [],
  supportedInterfaces: ["player"],
});

const imgCache = new ImageCache();
const configuration = new Config();
let expirationEpoch: number | undefined;

function updateMetadata(data: SpotifyApi.TrackObjectFull) {
  if (data.album.images.length > 0) {
    imgCache.getImageLocation(data.album.images[0].url).then(function (imgUri) {
      player.metadata = {
        "mpris:trackid": player.objectPath(`track/${data.id}`),
        "xesam:artist": data.artists.map((artist) => artist.name),
        "mpris:length": data.duration_ms * 1000,
        "mpris:artUrl": imgUri,
        "xesam:album": data.album.name,
        "xesam:albumArtist": data.album.artists.map((artist) => artist.name),
        "xesam:title": data.name,
        "xesam:trackNumber": data.track_number,
        "xesam:url": data.preview_url ?? undefined,
      };
    });
  } else {
    player.metadata = {
      "mpris:trackid": player.objectPath(`track/${data.id}`),
      "xesam:artist": data.artists.map((artist) => artist.name),
      "mpris:length": data.duration_ms * 1000,
      "xesam:album": data.album.name,
      "xesam:albumArtist": data.album.artists.map((artist) => artist.name),
      "xesam:title": data.name,
      "xesam:trackNumber": data.track_number,
      "xesam:url": data.preview_url ?? undefined,
    };
  }

  player.seeked(0);
}

let spotify: SpotifyWebApi | undefined;

configuration
  .config()
  .then(
    function (credentials) {
      return new SpotifyWebApi(credentials);
    },
    function (err) {
      console.log(err);
      exit(-1);
    }
  )
  .then(function (spt) {
    spotify = spt;
    configuration.cache().then(function (cache) {
      if (cache) {
        spt.setRefreshToken(cache.refreshToken);
        spt.authorizationCodeGrant(cache.authCode).then(
          function (data) {
            spt.setAccessToken(data.body.access_token);
            if (cache.authCode) {
              spt.setRefreshToken(data.body.refresh_token);
              configuration.storeAuth({
                authCode: cache.authCode,
                refreshToken: data.body.refresh_token,
              });
            }

            expirationEpoch =
              new Date().getTime() / 1000 + data.body.expires_in;
            spt.getMyCurrentPlaybackState().then(function (state) {
              player.playbackStatus = state.body.is_playing
                ? "Playing"
                : "Paused";
              if (state.body.item) {
                updateMetadata(state.body.item);
              }
            });
          },
          function () {
            spt.refreshAccessToken().then(function (data) {
              spt.setAccessToken(data.body.access_token);
              expirationEpoch =
                new Date().getTime() / 1000 + data.body.expires_in;
              spt.getMyCurrentPlaybackState().then(function (state) {
                player.playbackStatus = state.body.is_playing
                  ? "Playing"
                  : "Paused";
                if (state.body.item) {
                  updateMetadata(state.body.item);
                }
              });
            }, console.log);
          }
        );
      } else {
        console.log(
          spt.createAuthorizeURL(
            [
              "user-read-playback-state",
              "user-modify-playback-state",
              "user-read-currently-playing",
            ],
            "tacos"
          )
        );
      }
    });
  });

app.get("/auth/spotify/callback", function (req, res) {
  const authCode = req.query.code;
  if (typeof authCode !== "string" || !spotify) {
    res.sendStatus(500);
    return;
  }

  spotify.authorizationCodeGrant(authCode).then(
    function (data) {
      if (!spotify) {
        res.sendStatus(500);
        return;
      }

      spotify.setAccessToken(data.body.access_token);
      spotify.setRefreshToken(data.body.refresh_token);
      configuration.storeAuth({
        authCode,
        refreshToken: data.body.refresh_token,
      });

      expirationEpoch = new Date().getTime() / 1000 + data.body.expires_in;
      spotify.getMyCurrentPlaybackState().then(function (state) {
        player.playbackStatus = state.body.is_playing ? "Playing" : "Paused";
        if (state.body.item) {
          updateMetadata(state.body.item);
        }
      });

      res.send("OK");
    },
    function (err) {
      console.log("Failed to authenticate: ", err.message);
      res.sendStatus(500);
    }
  );
});

player.getPosition = function () {
  return 0;
};

app.put("/track/:trackId", function (req, res) {
  if (!spotify) {
    res.sendStatus(500);
    return;
  }

  spotify.getTrack(req.params.trackId).then(
    function (trackResponse) {
      updateMetadata(trackResponse.body);
      switch (req.query.event) {
        case "start":
        case "change":
        case "playing":
          player.playbackStatus = "Playing";
          break;
        case "paused":
        case "stop":
          player.playbackStatus = "Paused";
          break;
      }

      player.seeked(0);
      res.send("OK");
    },
    function (err) {
      console.log("Failed to get track info: ", err.message);
      res.sendStatus(500);
    }
  );
});

setInterval(function () {
  if (
    expirationEpoch &&
    expirationEpoch - new Date().getTime() / 1000 < 600 &&
    spotify
  ) {
    spotify.refreshAccessToken().then(
      function (data) {
        if (!spotify) {
          console.log("Invalid spotify instance");
          return;
        }

        spotify.setAccessToken(data.body.access_token);
        expirationEpoch = new Date().getTime() / 1000 + data.body.expires_in;
        spotify.getMyCurrentPlaybackState().then(function (state) {
          player.playbackStatus = state.body.is_playing ? "Playing" : "Paused";
          if (state.body.item) {
            updateMetadata(state.body.item);
          }
        });
      },
      function (err) {
        console.log("Failed to refresh token: ", err.message);
      }
    );
  }
}, 60000);

function handlePause() {
  spotify?.pause().then(
    function () {
      player.playbackStatus = "Paused";
    },
    function (err) {
      console.log("Failed to pause/stop: ", err.message);
    }
  );
}

function handlePlay() {
  spotify?.play().then(
    function () {
      player.playbackStatus = "Playing";
    },
    function (err) {
      console.log("failed to play: ", err.message);
    }
  );
}

player.on("pause", handlePause);

player.on("stop", handlePause);

player.on("playpause", function () {
  spotify?.getMyCurrentPlaybackState().then(function (state) {
    if (state.body.is_playing) {
      handlePause();
    } else {
      handlePlay();
    }
  });
});

player.on("play", handlePlay);

player.on("next", function () {
  spotify?.skipToNext();
});

player.on("previous", function () {
  spotify?.skipToPrevious();
});

configuration.config().then(function (config) {
  app.listen(config.port, function () {
    console.log(`App is listening on port ${config.port}`);
  });
});

#!/usr/bin/env bash

if [[ -z "${TRACK_ID}" ]]; then
    exit -1;
fi

port=`jq '.port' ~/.config/spotdjs/spotdjs.conf`

case $PLAYER_EVENT in
    change | playing | paused | stop | start )
        curl -X PUT "http://localhost:${port}/track/${TRACK_ID}?event=${PLAYER_EVENT}"
        ;;
    *)
        # This is a player event that we don't care about
        ;;
esac

# Enable notifications
# if [[ 'change' == "${PLAYER_EVENT}" ]]; then
    # ~/.local/bin/whatsplaying -n
# fi

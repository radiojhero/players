import type { EventCallbacks } from "../../../core/events";
import type Player from "../../../core/player";
import replaceClasses from "../../../misc/replace-classes";
import timeFormat from "../../../misc/time-format";
import html from "../layout.html";
import * as css from "../scss/index.scss";
import * as analyser from "./analyser";
import fontSupported from "./font";
import * as marquee from "./marquee";
import * as panes from "./pane-toggle";
import togglePlayState from "./play-state";
import * as progressBar from "./progress-bar";
import root from "./root";
import * as tabs from "./tabs";
import * as volume from "./volume";

const noObjectFit = document.createElement("img").style.objectFit === undefined;

export type DefaultPlayer = Player;

const initPlayer = () => {
  const player = window[PLAYER_NAMESPACE];

  if (!player) {
    requestAnimationFrame(initPlayer);
    return;
  }

  const events: EventCallbacks = {
    play() {
      root.query(css.playBtnPaused).classList.add(css.forceHidden);
      root.query(css.playBtnBuffering).classList.add(css.forceHidden);
      root.query(css.playBtnPlaying).classList.remove(css.forceHidden);

      if (!player.continuousMetadata) {
        togglePlayState(player, true, false);
      }
    },
    pause() {
      root.query(css.playBtnPaused).classList.remove(css.forceHidden);
      root.query(css.playBtnBuffering).classList.add(css.forceHidden);
      root.query(css.playBtnPlaying).classList.add(css.forceHidden);

      if (!player.continuousMetadata) {
        togglePlayState(player, false);
      }
    },
    buffering() {
      root.query(css.playBtnPaused).classList.add(css.forceHidden);
      root.query(css.playBtnBuffering).classList.remove(css.forceHidden);
      root.query(css.playBtnPlaying).classList.add(css.forceHidden);

      if (!player.continuousMetadata) {
        togglePlayState(player, true);
      }
    },
    gotmetadata(event) {
      const program = event.detail.program;

      root.query(css.programName).textContent = program.name;
      root.query(css.programDj).textContent =
        program.djs[0]?.name ?? "Playlist";
      root.query(css.programGenre).textContent = program.genre;
      root.query(css.programDescription).textContent = program.description;

      let imageUrl = "";
      const imageSourceSet: string[] = [];
      for (const image of program.cover) {
        imageUrl = image.src;
        const [imageSize] = image.sizes.split("x");
        imageSourceSet.push(`${imageUrl} ${imageSize}w`);
      }

      if (noObjectFit) {
        root.query<HTMLElement>(css.bannerInner).style.backgroundImage =
          `url('${imageUrl}')`;
      } else {
        root
          .queryMultiple<HTMLImageElement>(css.programAvatar)
          .forEach((element) => {
            element.src = imageUrl;
            element.srcset = imageSourceSet.join(", ");
          });
      }

      const song = event.detail.song_history[0];
      const songMetadata = root.query(css.songMetadata);
      const quantity = [song.album, song.artist, song.title].filter(
        Boolean,
      ).length;
      songMetadata.classList.toggle(css.items1, quantity === 1);
      songMetadata.classList.toggle(css.items2, quantity === 2);
      songMetadata.classList.toggle(css.items3, quantity === 3);

      root.query(css.songAlbum).textContent = song.album;
      root.query(css.songArtist).textContent = song.artist;
      root.query(css.songTitle).textContent = song.title;

      root
        .query(css.songSeparator1)
        .classList.toggle(css.forceHidden, !song.album || !song.title);
      root
        .query(css.songSeparator2)
        .classList.toggle(css.forceHidden, !song.artist || !song.title);

      if (song.duration > 0) {
        root.query(css.songTotalTime).textContent = timeFormat(song.duration);
        root
          .queryMultiple<HTMLProgressElement>(css.songProgress)
          .forEach((element) => {
            element.max = song.duration;
          });
      } else {
        root.query(css.songTotalTime).textContent = "?:??";
        root
          .queryMultiple<HTMLProgressElement>(css.songProgress)
          .forEach((element) => {
            element.max = 0;
          });
      }
    },
  };

  if (fontSupported("system-ui, '-apple-system', BlinkMacSystemFont")) {
    document.documentElement.className += ` ${css.sysUi}`;
  }

  root.innerHTML = replaceClasses(html, css);

  root.query(css.playBtn).addEventListener("click", () => {
    player.toggle();
  });

  if (noObjectFit) {
    root.query(css.programAvatar).classList.add(css.forceHidden);
    root.query(css.bannerInner).classList.add(css.noObjectFit);
  }

  if (player.playing) {
    (events as any).play();
  }

  if (player.metadata) {
    (events as any).gotmetadata({ detail: player.metadata });
  }

  if (player.continuousMetadata) {
    togglePlayState(player, true, false);
  }

  if ((globalThis as any).params.night) {
    document.documentElement.classList.add(css.night);
  }

  player.on(events);
  panes.setup();
  volume.setup(player);
  tabs.setup();
  marquee.setup(player);
  progressBar.setup(player);
  analyser.setup(player);

  window.addEventListener("unload", () => {
    player.off(events);
    volume.teardown();
    marquee.teardown(player);
    progressBar.teardown(player);
    analyser.teardown(player);
  });
};

export default initPlayer;

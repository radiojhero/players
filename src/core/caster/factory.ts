import type Caster from ".";
import type Events from "../events";
import AirPlayCaster from "./airplay-caster";
import ChromecastCaster from "./chromecast-caster";

export default function createCaster(
  audio: HTMLAudioElement,
  events: Events,
): Caster | undefined {
  for (const subclass of [AirPlayCaster, ChromecastCaster]) {
    if (subclass.isSupported()) {
      return new subclass(audio, events);
    }
  }

  return;
}

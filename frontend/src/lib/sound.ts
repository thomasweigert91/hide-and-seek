import { Howl } from "howler";
export const sounds = {
  step: new Howl({ src: ["/sounds/footstep.ogg"], volume: 0.3 }),
};
export const playSound = (sound: keyof typeof sounds) => {
  sounds[sound].play();
};

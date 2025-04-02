export const AudioManager = {
  sounds: {
    shoot: new Audio('assets/sounds/shoot.mp3'),
    explosion: new Audio('assets/sounds/explosion.mp3'),
    powerup: new Audio('assets/sounds/powerup.mp3'),
    bgm: new Audio('assets/sounds/bgm.mp3')
  },

  playSound(name) {
    this.sounds[name].currentTime = 0;
    this.sounds[name].play();
  },

  startBGM() {
    this.sounds.bgm.loop = true;
    this.sounds.bgm.play();
  }
} 
<template>
  <div class="game-container">
    <canvas
      ref="gameCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousemove="handleMouseMove"
      @click="handleClick"
    ></canvas>
    <div class="game-info">
      <div class="score">得分: {{ score }}</div>
      <div class="level">关卡: {{ currentLevel }}</div>
      <div class="next-level" v-if="currentLevel < 5">
        距离下一关: {{ nextLevelScore - score }}
      </div>
    </div>
    <div v-if="!gameStarted" class="start-screen">
      <h2>飞机大战</h2>
      <p>点击开始游戏</p>
      <button @click="startGame">开始游戏</button>
    </div>
    <div v-if="gameOver" class="game-over">
      <h2>游戏结束</h2>
      <p>最终得分: {{ score }}</p>
      <p>达到关卡: {{ currentLevel }}</p>
      <button @click="restartGame">重新开始</button>
    </div>
    <div class="skills">
      <button 
        @click="useBomb" 
        :disabled="!bombReady"
        class="skill-btn"
      >
        炸弹 (空格键)
        <span v-if="bombCooldownTime > 0" class="cooldown">{{ bombCooldownTime }}s</span>
      </button>
      <button 
        @click="useSlowMotion" 
        :disabled="!slowMotionReady"
        class="skill-btn"
      >
        时间减速 (Shift键)
        <span v-if="slowMotionCooldownTime > 0" class="cooldown">{{ slowMotionCooldownTime }}s</span>
      </button>
    </div>
    <div v-if="isPaused" class="pause-screen">
      <h2>游戏暂停</h2>
      <button @click="togglePause">继续游戏</button>
    </div>
    <!--
    <button 
      @click="toggleSound" 
      class="sound-btn"
    >
      {{ isMuted ? '开启声音' : '关闭声音' }}
    </button>
    -->
    <div class="powerup-status" v-if="gameStarted && !gameOver">
      <div v-if="playerPowerups.shield" class="powerup-icon shield">护盾</div>
      <div v-if="playerPowerups.rapidFire" class="powerup-icon rapid-fire">快速射击</div>
      <div v-if="playerPowerups.doubleScore" class="powerup-icon double-score">双倍得分</div>
    </div>
  </div>
</template>

<script>
import { GAME_CONSTANTS } from '../utils/gameConstants'
import { checkCollision } from '../utils/collision'
import playerImage from '../assets/images/player.png'
import enemyImage from '../assets/images/enemy.png'
import bulletImage from '../assets/images/bullet.png'

export default {
  name: 'GameCanvas',
  data() {
    return {
      canvasWidth: 400,
      canvasHeight: 600,
      ctx: null,
      gameStarted: false,
      gameOver: false,
      score: 0,
      player: {
        x: 200,
        y: 500,
        width: 60,
        height: 80,
        speed: 5,
        image: null
      },
      bullets: [],
      enemies: [],
      animationFrameId: null,
      images: {
        player: null,
        enemy: null,
        bullet: null
      },
      currentLevel: 1,
      nextLevelScore: GAME_CONSTANTS.LEVELS[0].scoreToNext,
      currentLevelConfig: GAME_CONSTANTS.LEVELS[0],
      bombReady: true,
      slowMotionReady: true,
      bombCooldown: 10000, // 10秒冷却
      slowMotionCooldown: 15000,
      bombCooldownTime: 0,
      slowMotionCooldownTime: 0,
      cooldownTimer: null,
      sounds: {
        shoot: null,
        explosion: null,
        powerup: null,
        levelup: null,
        bgm: null
      },
      isMuted: false,
      powerups: [],
      powerupTypes: {
        SHIELD: 'shield',
        RAPID_FIRE: 'rapid-fire',
        DOUBLE_SCORE: 'double-score'
      },
      playerPowerups: {
        shield: false,
        rapidFire: false,
        doubleScore: false
      },
      isPaused: false
    }
  },
  mounted() {
    this.initCanvas()
    this.loadImages()
    this.loadSounds()
    
    // 添加键盘事件监听
    window.addEventListener('keydown', this.handleKeyPress)
  },
  methods: {
    loadImages() {
      // 加载玩家飞机图片
      this.images.player = new Image()
      this.images.player.src = playerImage
      
      // 加载敌机图片
      this.images.enemy = new Image()
      this.images.enemy.src = enemyImage
      
      // 加载子弹图片
      this.images.bullet = new Image()
      this.images.bullet.src = bulletImage
    },
    loadSounds() {
      // 暂时注释掉音效加载，直到准备好音效文件
      /*
      this.sounds.shoot = new Audio(require('../assets/sounds/shoot.mp3'));
      this.sounds.explosion = new Audio(require('../assets/sounds/explosion.mp3'));
      this.sounds.powerup = new Audio(require('../assets/sounds/powerup.mp3'));
      this.sounds.levelup = new Audio(require('../assets/sounds/levelup.mp3'));
      this.sounds.bgm = new Audio(require('../assets/sounds/bgm.mp3'));
      this.sounds.bgm.loop = true;
      */
    },
    initCanvas() {
      const canvas = this.$refs.gameCanvas
      this.ctx = canvas.getContext('2d')
    },
    startGame() {
      this.gameStarted = true
      this.gameOver = false
      this.score = 0
      this.currentLevel = 1
      this.currentLevelConfig = GAME_CONSTANTS.LEVELS[0]
      this.nextLevelScore = this.currentLevelConfig.scoreToNext
      this.bullets = []
      this.enemies = []
      this.gameLoop()
    },
    gameLoop() {
      this.update()
      this.draw()
      this.animationFrameId = requestAnimationFrame(this.gameLoop)
    },
    update() {
      // 更新游戏状态
      this.updateBullets()
      this.updateEnemies()
      this.checkCollisions()
      this.updatePowerups()
    },
    draw() {
      // 清空画布
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      // 绘制玩家
      this.drawPlayer()
      // 绘制子弹
      this.drawBullets()
      // 绘制敌机
      this.drawEnemies()
    },
    handleMouseMove(e) {
      if (!this.gameStarted || this.gameOver) return
      const rect = this.$refs.gameCanvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      this.player.x = Math.max(0, Math.min(x - this.player.width / 2, this.canvasWidth - this.player.width))
    },
    handleClick() {
      if (!this.gameStarted || this.gameOver) return
      this.shoot()
    },
    drawPlayer() {
      if (this.images.player) {
        this.ctx.drawImage(
          this.images.player,
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height
        )
      }
    },
    shoot() {
      // 根据当前关卡设置子弹数量和扩散角度
      let bulletCount, spread;
      switch (this.currentLevel) {
        case 1:
          bulletCount = 1;
          spread = 0;
          break;
        case 2:
          bulletCount = 2;
          spread = 5; // 10度角扩散（每边5度）
          break;
        case 3:
          bulletCount = 3;
          spread = 7.5; // 15度角扩散（每边7.5度）
          break;
        case 4:
          bulletCount = 3;
          spread = 10; // 20度角扩散（每边10度）
          break;
        case 5:
          bulletCount = 4;
          spread = 12.5; // 25度角扩散（每边12.5度）
          break;
      }
      
      // 计算子弹发射角度
      const angles = [];
      if (bulletCount === 1) {
        angles.push(0);  // 单发子弹直射
      } else {
        // 计算多发子弹的角度
        const step = spread * 2 / (bulletCount - 1);
        for (let i = 0; i < bulletCount; i++) {
          angles.push(-spread + step * i);
        }
      }
      
      // 发射子弹
      angles.forEach(angle => {
        const radian = angle * Math.PI / 180;
        const bullet = {
          x: this.player.x + this.player.width / 2 - GAME_CONSTANTS.BULLET_WIDTH / 2,
          y: this.player.y,
          width: GAME_CONSTANTS.BULLET_WIDTH,
          height: GAME_CONSTANTS.BULLET_HEIGHT,
          speedX: Math.sin(radian) * GAME_CONSTANTS.BULLET_SPEED,
          speedY: -Math.cos(radian) * GAME_CONSTANTS.BULLET_SPEED
        }
        this.bullets.push(bullet);
      });
    },
    updateBullets() {
      this.bullets = this.bullets.filter(bullet => {
        // 更新子弹位置，加入水平移动
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        
        // 检查子弹是否在画布范围内
        return bullet.y + bullet.height > 0 && 
               bullet.x + bullet.width > 0 && 
               bullet.x < this.canvasWidth;
      });
    },
    drawBullets() {
      if (this.images.bullet) {
        this.bullets.forEach(bullet => {
          // 根据子弹角度旋转画布
          this.ctx.save();
          const angle = Math.atan2(bullet.speedX, -bullet.speedY);
          this.ctx.translate(bullet.x + bullet.width/2, bullet.y + bullet.height/2);
          this.ctx.rotate(angle);
          this.ctx.drawImage(
            this.images.bullet,
            -bullet.width/2,
            -bullet.height/2,
            bullet.width,
            bullet.height
          );
          this.ctx.restore();
        });
      }
    },
    spawnEnemy() {
      const enemy = {
        x: Math.random() * (this.canvasWidth - GAME_CONSTANTS.ENEMY_WIDTH),
        y: -GAME_CONSTANTS.ENEMY_HEIGHT,
        width: GAME_CONSTANTS.ENEMY_WIDTH,
        height: GAME_CONSTANTS.ENEMY_HEIGHT,
        speed: GAME_CONSTANTS.ENEMY_SPEED
      }
      this.enemies.push(enemy)
    },
    updateEnemies() {
      this.enemies = this.enemies.filter(enemy => {
        enemy.y += this.currentLevelConfig.enemySpeed
        return enemy.y < this.canvasHeight
      })

      if (Math.random() < this.currentLevelConfig.spawnRate) {
        this.spawnEnemy()
      }
    },
    drawEnemies() {
      if (this.images.enemy) {
        this.enemies.forEach(enemy => {
          this.ctx.drawImage(
            this.images.enemy,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
          )
        })
      }
    },
    checkCollisions() {
      // 检查子弹与敌机的碰撞
      this.bullets.forEach((bullet, bulletIndex) => {
        this.enemies.forEach((enemy, enemyIndex) => {
          if (checkCollision(bullet, enemy)) {
            this.bullets.splice(bulletIndex, 1)
            this.enemies.splice(enemyIndex, 1)
            this.score += 100
            this.checkLevelUp()
          }
        })
      })

      // 检查玩家与敌机的碰撞
      this.enemies.forEach(enemy => {
        if (checkCollision(this.player, enemy)) {
          this.endGame()
        }
      })
    },
    endGame() {
      this.gameOver = true
      cancelAnimationFrame(this.animationFrameId)
    },
    restartGame() {
      this.startGame()
    },
    checkLevelUp() {
      if (this.score >= this.nextLevelScore && this.currentLevel < 5) {
        this.currentLevel++
        this.currentLevelConfig = GAME_CONSTANTS.LEVELS[this.currentLevel - 1]
        this.nextLevelScore = this.currentLevelConfig.scoreToNext
        this.showLevelUpMessage()
      }
    },
    showLevelUpMessage() {
      const ctx = this.ctx
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(this.canvasWidth/4, this.canvasHeight/2 - 40, this.canvasWidth/2, 80)
      ctx.fillStyle = '#000'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`升级到第 ${this.currentLevel} 关！`, this.canvasWidth/2, this.canvasHeight/2)
    },
    useBomb() {
      if (!this.bombReady || !this.gameStarted || this.gameOver) return;
      
      // 清除所有敌机并加分
      this.enemies.forEach(() => {
        this.score += 100;
      });
      this.enemies = [];
      
      // 设置冷却和倒计时
      this.bombReady = false;
      this.bombCooldownTime = this.bombCooldown / 1000;
      this.updateCooldown();
      
      setTimeout(() => {
        this.bombReady = true;
        this.bombCooldownTime = 0;
      }, this.bombCooldown);
    },
    useSlowMotion() {
      if (!this.slowMotionReady || !this.gameStarted || this.gameOver) return;
      
      // 减缓敌机速度和生成速率
      const originalConfig = { ...this.currentLevelConfig };
      this.currentLevelConfig = {
        ...this.currentLevelConfig,
        enemySpeed: this.currentLevelConfig.enemySpeed * 0.5,
        spawnRate: this.currentLevelConfig.spawnRate * 0.5
      };

      // 设置冷却和倒计时
      this.slowMotionReady = false;
      this.slowMotionCooldownTime = this.slowMotionCooldown / 1000;
      this.updateCooldown();

      // 5秒后恢复正常速度
      setTimeout(() => {
        this.currentLevelConfig = originalConfig;
      }, 5000);

      setTimeout(() => {
        this.slowMotionReady = true;
        this.slowMotionCooldownTime = 0;
      }, this.slowMotionCooldown);
    },
    updateCooldown() {
      if (this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
      }
      
      this.cooldownTimer = setInterval(() => {
        if (this.bombCooldownTime > 0) {
          this.bombCooldownTime--;
        }
        if (this.slowMotionCooldownTime > 0) {
          this.slowMotionCooldownTime--;
        }
        if (this.bombCooldownTime === 0 && this.slowMotionCooldownTime === 0) {
          clearInterval(this.cooldownTimer);
        }
      }, 1000);
    },
    handleKeyPress(event) {
      if (!this.gameStarted || this.gameOver) return;
      
      switch(event.key) {
        case ' ': // 空格键
          event.preventDefault(); // 防止页面滚动
          this.useBomb();
          break;
        case 'Shift': // Shift键
          event.preventDefault();
          this.useSlowMotion();
          break;
        case 'Escape':
          event.preventDefault();
          this.togglePause();
          break;
      }
    },
    playSound(soundName) {
      // 暂时注释掉音效播放
      /*
      if (!this.isMuted && this.sounds[soundName]) {
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play();
      }
      */
    },
    toggleSound() {
      this.isMuted = !this.isMuted;
      // 暂时注释掉音效控制
      /*
      if (this.isMuted) {
        this.sounds.bgm.pause();
      } else {
        this.sounds.bgm.play();
      }
      */
    },
    spawnPowerup() {
      if (Math.random() < 0.05) { // 5%的概率生成道具
        const types = Object.values(this.powerupTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const powerup = {
          x: Math.random() * (this.canvasWidth - 30),
          y: -30,
          width: 30,
          height: 30,
          type: randomType,
          speed: 2
        };
        
        this.powerups.push(powerup);
      }
    },
    updatePowerups() {
      this.powerups = this.powerups.filter(powerup => {
        powerup.y += powerup.speed;
        
        // 检查玩家是否收集到道具
        if (checkCollision(this.player, powerup)) {
          this.collectPowerup(powerup.type);
          return false;
        }
        
        return powerup.y < this.canvasHeight;
      });
    },
    collectPowerup(type) {
      this.playSound('powerup');
      const duration = 10000; // 10秒持续时间
      
      switch(type) {
        case this.powerupTypes.SHIELD:
          this.playerPowerups.shield = true;
          setTimeout(() => this.playerPowerups.shield = false, duration);
          break;
        case this.powerupTypes.RAPID_FIRE:
          this.playerPowerups.rapidFire = true;
          setTimeout(() => this.playerPowerups.rapidFire = false, duration);
          break;
        case this.powerupTypes.DOUBLE_SCORE:
          this.playerPowerups.doubleScore = true;
          setTimeout(() => this.playerPowerups.doubleScore = false, duration);
          break;
      }
    },
    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        this.gameLoop();
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyPress);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }
}
</script>

<style scoped>
.game-container {
  position: relative;
  width: 400px;
  margin: 0 auto;
}

.game-info {
  position: absolute;
  top: 10px;
  right: 10px;
  text-align: right;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.score, .level, .next-level {
  margin-bottom: 5px;
  font-size: 18px;
}

canvas {
  border: 1px solid #000;
  background: linear-gradient(to bottom, #87CEEB, #1E90FF);
}

.start-screen,
.game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

.skills {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.skill-btn {
  position: relative;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid white;
  cursor: pointer;
}

.skill-btn .cooldown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
}

.skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cooldown {
  font-size: 12px;
  margin-left: 5px;
}

.pause-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
}

.sound-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid white;
}

.powerup-status {
  position: absolute;
  top: 50px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.powerup-icon {
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 5px;
  font-size: 14px;
}
</style> 
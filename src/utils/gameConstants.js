export const GAME_CONSTANTS = {
  BULLET_SPEED: 7,
  ENEMY_SPEED: 3,
  ENEMY_SPAWN_INTERVAL: 1000,
  BULLET_WIDTH: 8,
  BULLET_HEIGHT: 20,
  ENEMY_WIDTH: 50,
  ENEMY_HEIGHT: 50,
  LEVELS: [
    { 
      level: 1,
      enemySpeed: 3,
      spawnRate: 0.02,
      scoreToNext: 500,
      bulletCount: 1,
      bulletSpread: 0
    },
    {
      level: 2,
      enemySpeed: 4,
      spawnRate: 0.03,
      scoreToNext: 1000,
      bulletCount: 2,
      bulletSpread: 15
    },
    {
      level: 3,
      enemySpeed: 5,
      spawnRate: 0.04,
      scoreToNext: 2000,
      bulletCount: 3,
      bulletSpread: 20
    },
    {
      level: 4,
      enemySpeed: 6,
      spawnRate: 0.05,
      scoreToNext: 3000,
      bulletCount: 3,
      bulletSpread: 25
    },
    {
      level: 5,
      enemySpeed: 7,
      spawnRate: 0.06,
      scoreToNext: Infinity,
      bulletCount: 4,
      bulletSpread: 30
    }
  ]
}

// 添加道具类型配置
export const POWER_UPS = {
  SHIELD: {
    type: 'shield',
    duration: 5000,  // 持续5秒
    probability: 0.1 // 10%出现概率
  },
  RAPID_FIRE: {
    type: 'rapidFire',
    duration: 3000,
    probability: 0.15
  },
  BOMB: {
    type: 'bomb',
    probability: 0.05
  }
}

export const ENEMY_TYPES = {
  NORMAL: {
    speed: 3,
    health: 1,
    score: 100,
    size: { width: 50, height: 50 }
  },
  FAST: {
    speed: 5,
    health: 1,
    score: 150,
    size: { width: 40, height: 40 }
  },
  BOSS: {
    speed: 2,
    health: 10,
    score: 1000,
    size: { width: 100, height: 100 }
  }
} 
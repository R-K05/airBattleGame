export const ACHIEVEMENTS = {
  BEGINNER: {
    id: 'beginner',
    name: '新手起航',
    description: '完成第一关',
    condition: (stats) => stats.maxLevel >= 1
  },
  MARKSMAN: {
    id: 'marksman',
    name: '神射手',
    description: '单局命中率超过80%',
    condition: (stats) => stats.accuracy >= 0.8
  },
  SURVIVOR: {
    id: 'survivor',
    name: '生存专家',
    description: '单局存活时间超过5分钟',
    condition: (stats) => stats.survivalTime >= 300
  }
} 
// 每次切換都檢查目標與其父場景，避免從熱點或平面圖繞過出租狀態。
export function canOpenPanorama(sceneId, scenes) {
  const byId = new Map(scenes.map((scene) => [scene.id, scene]))
  const visited = new Set()
  let scene = byId.get(sceneId)

  while (scene && !visited.has(scene.id)) {
    visited.add(scene.id)
    if (scene.availability === 'occupied') return false
    if (scene.group === 'tour' && !['vacant', 'showcase', 'shared'].includes(scene.availability)) return false
    if (!scene.parentId) return true
    scene = byId.get(scene.parentId)
  }

  return false
}

export function unavailablePanoramaLabel(scene) {
  return scene?.availability === 'occupied' ? '已出租' : '未開放'
}

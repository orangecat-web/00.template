const radians = (degrees) => degrees * Math.PI / 180

// 與 PanoramaRenderer 的視角運算一致：將環景經緯度投影到畫面座標。
export function projectPanoramaPoint(point, view, width, height) {
  if (!width || !height) return null

  const longitude = radians(point.yaw)
  const latitude = radians(point.pitch)
  const cosLatitude = Math.cos(latitude)
  const worldX = Math.sin(longitude) * cosLatitude
  const worldY = Math.sin(latitude)
  const worldZ = Math.cos(longitude) * cosLatitude

  const cosYaw = Math.cos(view.yaw)
  const sinYaw = Math.sin(view.yaw)
  const tiltedX = cosYaw * worldX - sinYaw * worldZ
  const tiltedZ = sinYaw * worldX + cosYaw * worldZ
  const cosPitch = Math.cos(view.pitch)
  const sinPitch = Math.sin(view.pitch)
  const rayY = cosPitch * worldY - sinPitch * tiltedZ
  const rayZ = sinPitch * worldY + cosPitch * tiltedZ
  if (rayZ <= 0) return null

  const focal = 1 / Math.tan(radians(view.fov) / 2)
  const screenX = tiltedX / rayZ * focal / (width / height)
  const screenY = rayY / rayZ * focal
  if (Math.abs(screenX) > 1 || Math.abs(screenY) > 1) return null

  return { left: `${(screenX + 1) * 50}%`, top: `${(1 - screenY) * 50}%` }
}

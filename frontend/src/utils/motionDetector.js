export function detectJ(pinkyBuffer) {
  // pinkyBuffer = array of last 20 {x, y} of pinky tip
  if (pinkyBuffer.length < 15) return false
  const first = pinkyBuffer.slice(0, 7)
  const last = pinkyBuffer.slice(-5)
  const verticalDrop = last[last.length-1].y - first[0].y
  const horizontalMove = Math.abs(first[0].x - last[last.length-1].x)
  return verticalDrop > 0.15 && horizontalMove > 0.05
}

export function detectZ(indexBuffer) {
  // indexBuffer = array of last 20 {x, y} of index tip
  if (indexBuffer.length < 15) return false
  const p1 = indexBuffer.slice(0, 7)
  const p2 = indexBuffer.slice(7, 13)
  const p3 = indexBuffer.slice(13)
  
  const part1Horizontal = Math.abs(p1[p1.length-1].x - p1[0].x) > 0.05
  const part2Down = p2[p2.length-1].y > p2[0].y
  const part2Horizontal = Math.abs(p2[p2.length-1].x - p2[0].x) > 0.02
  const part3Horizontal = Math.abs(p3[p3.length-1].x - p3[0].x) > 0.05
  
  return part1Horizontal && part2Down && part2Horizontal && part3Horizontal
}

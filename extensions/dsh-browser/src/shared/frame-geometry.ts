import { Matrix, solve } from 'ml-matrix'

/** A point in CSS pixels. */
export interface Point {
  x: number
  y: number
}

// 将 iframe 的局部视口投影到 CDP 返回的 content quad，包含 CSS 变换和透视。
export function framePointMapper(quad: readonly number[], width: number, height: number): (point: Point) => Point {
  if (quad.length !== 8 || !quad.every(Number.isFinite) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('The target frame has no usable viewport geometry.')
  }
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]] as const
  const rows = corners.flatMap(([u, v], index) => {
    const x = quad[index * 2]!
    const y = quad[index * 2 + 1]!
    return [[u, v, 1, 0, 0, 0, -x * u, -x * v], [0, 0, 0, u, v, 1, -y * u, -y * v]]
  })
  const coefficients = solve(new Matrix(rows), Matrix.columnVector([...quad])).to1DArray()
  return (point) => {
    const u = point.x / width
    const v = point.y / height
    const denominator = coefficients[6]! * u + coefficients[7]! * v + 1
    const x = (coefficients[0]! * u + coefficients[1]! * v + coefficients[2]!) / denominator
    const y = (coefficients[3]! * u + coefficients[4]! * v + coefficients[5]!) / denominator
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('The target point has no finite viewport position.')
    return { x, y }
  }
}

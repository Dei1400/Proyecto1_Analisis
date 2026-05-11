/** logica solo de prueba para probar interfaz del tablero */

/**
 * Crea un tablero N×N inicializado en -1 (sin visitar)
 * @param {number} n - tamaño del tablero
 * @returns {number[][]}
 */
export function crearTablero(n) {
  return Array.from({ length: n }, () => Array(n).fill(-1));
}

/**
 * Marca una celda como obstáculo (-2)
 * @param {number[][]} tablero
 * @param {number} x
 * @param {number} y
 * @returns {number[][]} nuevo tablero (no muta el original)
 */
export function toggleObstaculo(tablero, x, y) {
  const nuevo = tablero.map(fila => [...fila]);
  nuevo[x][y] = nuevo[x][y] === -2 ? -1 : -2;
  return nuevo;
}

export function movimientosValidos(x, y, n) {
  const movimientos = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];

  return movimientos
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => nx >= 0 && nx < n && ny >= 0 && ny < n);
}

/**
 * Verifica si el tablero tiene solución posible:
 * las celdas libres deben ser al menos N*N - obstáculos
 * y el caballo debe tener al menos un movimiento desde el inicio
 * @param {number[][]} tablero
 * @param {number} startX
 * @param {number} startY
 * @param {Function} getMovimientos - función de knightMoves.js
 * @returns {{ posible: boolean, mensaje: string }}
 */
export function verificarResoluble(tablero, startX, startY, getMovimientos) {
  const n = tablero.length;
  const celdasLibres = tablero.flat().filter(c => c !== -2).length;

  if (celdasLibres < n * n * 0.5) {
    return { posible: false, mensaje: "Demasiados obstáculos, el tablero es irresoluble." };
  }

  if (tablero[startX][startY] === -2) {
    return { posible: false, mensaje: "La casilla de inicio es un obstáculo." };
  }

  const movs = getMovimientos(startX, startY, n, tablero);
  if (movs.length === 0) {
    return { posible: false, mensaje: "El caballo no tiene movimientos desde la posición inicial." };
  }

  return { posible: true, mensaje: "" };
}
/**
 * ============================================
 * ♞ CONTEO DE CAMINOS CON PROGRAMACIÓN DINÁMICA
 * ============================================
 * Convenciones:
 * -1 = casilla libre
 * -2 = obstáculo
 */

/**
 * Movimientos posibles del caballo.
 * @type {number[][]}
 */
const movimientos = [
  [-2, -1],
  [-2, +1],
  [-1, -2],
  [-1, +2],
  [+1, -2],
  [+1, +2],
  [+2, -1],
  [+2, +1],
];

/**
 * Verifica si una posición está dentro del tablero.
 * @param {number} x
 * @param {number} y
 * @param {number} n - Tamaño del tablero
 * @returns {boolean}
 */
export function dentroTablero(x, y, n) {
  return x >= 0 && x < n && y >= 0 && y < n;
}

/**
 * Verifica si una posición es un obstáculo.
 * @param {number} x
 * @param {number} y
 * @param {number[][]} obstaculos
 * @returns {boolean}
 */
export function esObstaculo(x, y, obstaculos) {
  return obstaculos.some(
    ([ox, oy]) => ox === x && oy === y
  );
}

/**
 * Evita que el caballo "salte" usando obstáculos como puente.
 * @param {number} x - posición actual X
 * @param {number} y - posición actual Y
 * @param {number} nx - nueva X
 * @param {number} ny - nueva Y
 * @param {number[][]} obstaculos
 * @param {number} n
 * @returns {boolean}
 */
export function usaObstaculoComoPuente(x, y, nx, ny, obstaculos, n) {
  let dx = nx - x;
  let dy = ny - y;

  let sx = Math.sign(dx);
  let sy = Math.sign(dy);

  let casillas = [];

  if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
    casillas = [
      [x + sx, y],
      [x + 2 * sx, y]
    ];
  }

  if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
    casillas = [
      [x, y + sy],
      [x, y + 2 * sy]
    ];
  }

  return casillas.some(([cx, cy]) =>
    dentroTablero(cx, cy, n) && esObstaculo(cx, cy, obstaculos)
  );
}

/**
 * Obtiene TODOS los caminos posibles del caballo en exactamente k pasos.
 * Usa programación dinámica guardando rutas completas.
 *
 * ⚠️ Puede consumir mucha memoria si k es grande.
 *
 * @param {number[][]} tablero
 * @param {number} inicioX
 * @param {number} inicioY
 * @param {number} destinoX
 * @param {number} destinoY
 * @param {number} k - número de movimientos
 * @returns {{
 *   cantidad:number,
 *   caminos:{x:number,y:number}[][]
 * }}
 */
export function obtenerCaminos(tablero, inicioX, inicioY, destinoX, destinoY, k) {
  const n = tablero.length;

  // Extraer obstáculos
  const obstaculos = [];
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      if (tablero[x][y] === -2) obstaculos.push([x, y]);
    }
  }

  // Validación inicial
  if (
    esObstaculo(inicioX, inicioY, obstaculos) ||
    esObstaculo(destinoX, destinoY, obstaculos)
  ) {
    return { cantidad: 0, caminos: [] };
  }

  /**
   * dp[x][y] = lista de caminos que llegan a (x,y)
   */
  let dp = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [])
  );

  dp[inicioX][inicioY] = [[{ x: inicioX, y: inicioY }]];

  for (let paso = 1; paso <= k; paso++) {
    let siguiente = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => [])
    );

    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        if (dp[x][y].length > 0) {
          for (let mov of movimientos) {
            let nx = x + mov[0];
            let ny = y + mov[1];

            if (!dentroTablero(nx, ny, n)) continue;
            if (esObstaculo(nx, ny, obstaculos)) continue;
            if (usaObstaculoComoPuente(x, y, nx, ny, obstaculos, n)) continue;

            for (let camino of dp[x][y]) {
              siguiente[nx][ny].push([
                ...camino,
                { x: nx, y: ny }
              ]);
            }
          }
        }
      }
    }

    dp = siguiente;
  }

  return {
    cantidad: dp[destinoX][destinoY].length,
    caminos: dp[destinoX][destinoY]
  };
}

/**
 * Cuenta la cantidad de caminos sin guardar rutas (optimizado).
 * Usa programación dinámica clásica.
 *
 * ✅ Mucho más eficiente en memoria que obtenerCaminos
 *
 * @param {number[][]} tablero
 * @param {number} inicioX
 * @param {number} inicioY
 * @param {number} destinoX
 * @param {number} destinoY
 * @param {number} k
 * @returns {number}
 */
export function contarCaminosDP(tablero, inicioX, inicioY, destinoX, destinoY, k) {
  const n = tablero.length;

  // Extraer obstáculos
  const obstaculos = [];
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      if (tablero[x][y] === -2) obstaculos.push([x, y]);
    }
  }

  // Validación inicial
  if (
    esObstaculo(inicioX, inicioY, obstaculos) ||
    esObstaculo(destinoX, destinoY, obstaculos)
  ) {
    return 0;
  }

  /**
   * dp[x][y] = cantidad de formas de llegar a (x,y)
   */
  let dp = Array.from({ length: n }, () => Array(n).fill(0));
  dp[inicioX][inicioY] = 1;

  for (let paso = 1; paso <= k; paso++) {
    let siguiente = Array.from({ length: n }, () => Array(n).fill(0));

    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        if (dp[x][y] > 0) {
          for (let mov of movimientos) {
            let nx = x + mov[0];
            let ny = y + mov[1];

            if (!dentroTablero(nx, ny, n)) continue;
            if (esObstaculo(nx, ny, obstaculos)) continue;
            if (usaObstaculoComoPuente(x, y, nx, ny, obstaculos, n)) continue;

            siguiente[nx][ny] += dp[x][y];
          }
        }
      }
    }

    dp = siguiente;
  }

  return dp[destinoX][destinoY];
}
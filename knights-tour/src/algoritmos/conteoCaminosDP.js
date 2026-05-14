// Movimientos del caballo
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

// Función para validar si una posición está dentro del tablero
export function dentroTablero(x, y, n) {
  return x >= 0 && x < n && y >= 0 && y < n;
}

// Función para validar si una posición es un obstáculo
export function esObstaculo(x, y, obstaculos) {
  return obstaculos.some(
    obstaculo => obstaculo[0] === x && obstaculo[1] === y
  );
}

// Función para validar si se usa un obstáculo como puente
export function usaObstaculoComoPuente(x, y, nx, ny, obstaculos, n) {
  let dx = nx - x;
  let dy = ny - y;
  let sx = Math.sign(dx);
  let sy = Math.sign(dy);
  let casillasDelMovimiento = [];

  if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
    casillasDelMovimiento = [
      [x + sx, y],
      [x + 2 * sx, y]
    ];
  }

  if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
    casillasDelMovimiento = [
      [x, y + sy],
      [x, y + 2 * sy]
    ];
  }

  for (let casilla of casillasDelMovimiento) {
    let cx = casilla[0];
    let cy = casilla[1];
    if (dentroTablero(cx, cy, n) && esObstaculo(cx, cy, obstaculos)) {
      return true;
    }
  }
  return false;
}

// Función para obtener todos los caminos posibles (no solo contarlos)
export function obtenerCaminos(tablero, inicioX, inicioY, destinoX, destinoY, k) {
  const n = tablero.length;
  
  // Extrae los obstáculos del tablero
  const obstaculos = [];
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++)
      if (tablero[x][y] === -2) obstaculos.push([x, y]);

  if (esObstaculo(inicioX, inicioY, obstaculos) || esObstaculo(destinoX, destinoY, obstaculos)) {
    return { cantidad: 0, caminos: [] };
  }

  let dp = Array.from({ length: n }, () => Array(n).fill(null));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      dp[i][j] = [];

  dp[inicioX][inicioY] = [[{ x: inicioX, y: inicioY }]];

  for (let paso = 1; paso <= k; paso++) {
    let siguiente = Array.from({ length: n }, () => Array(n).fill(null));
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        siguiente[i][j] = [];

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
              siguiente[nx][ny].push([...camino, { x: nx, y: ny }]);
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

// Función principal de conteo de caminos (solo el número)
export function contarCaminosDP(tablero, inicioX, inicioY, destinoX, destinoY, k) {
  const n = tablero.length;
  
  // Extrae los obstáculos del tablero
  const obstaculos = [];
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++)
      if (tablero[x][y] === -2) obstaculos.push([x, y]);

  if (esObstaculo(inicioX, inicioY, obstaculos) || esObstaculo(destinoX, destinoY, obstaculos)) {
    return 0;
  }

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
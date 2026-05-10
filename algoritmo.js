const movimientos = [
    [-2, -1], //movimientos posibles del caballo en el ajedrez
    [-2, +1], //como cambios en las coordenadas x, y respectivamente
    [-1, -2],
    [-1, +2],
    [+1, -2],
    [+1, +2],
    [+2, -1],
    [+2, +1],
];

function esValido(x, y, tablero) {
    //verificar si la posicion esta dentro del tablero y no ha sido visitada
    return (
        x >= 0 && x < tablero.length &&
        y >= 0 && y < tablero[0].length &&
        tablero[x][y] === -1
    );
}

function movimientosValidos(x, y, n) {
    // Devuelve una lista de posiciones vaalidas a las que puede moverse el caballo desde (x, y) en un tablero n x n
    let validos = [];
    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];
        if (nx >= 0 && nx < n && ny >= 0 && ny < n) {
            validos.push([nx, ny]);
        }
    }
    return validos;
}

// Funcion para resolver el recorrido del caballo usando backtracking
function resolverCaballo(tablero, x, y, movimientoActual, n) {
    // Si hemos completado todos los movimientos, hemos encontrado una solución
    if (movimientoActual == n * n) {
        return true;
    }

    // Intenta todos los movimientos posibles desde la posición actual
    for (let i = 0; i < movimientos.length; i++) {
        let nuevoX = x + movimientos[i][0];
        let nuevoY = y + movimientos[i][1];

        if (esValido(nuevoX, nuevoY, tablero)) {
            // Marca la posición como visitada con el número de movimiento
            tablero[nuevoX][nuevoY] = movimientoActual;

            // Recursión para el siguiente movimiento
            if (resolverCaballo(tablero, nuevoX, nuevoY, movimientoActual + 1, n)) {
                return true;
            }

            // Backtrack: desmarca la posición si no lleva a una solución
            tablero[nuevoX][nuevoY] = -1;
        }
    }

    //No se encontró solución desde esta posición
    return false;
}

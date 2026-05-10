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

function movimientosValidos(x, y, tablero) {
    // Devuelve una lista de posiciones vaalidas a las que puede moverse el caballo desde (x, y) en un tablero n x n
    let validos = [];
    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];
    if (esValido(nx, ny, tablero)) {
            validos.push([nx, ny]);
    }    
    }
    return validos;
}

// Funcion para resolver el recorrido del caballo usando backtracking
function resolverCaballo(tablero, x, y, movimientoActual) {

    let totalCasillas = tablero.length * tablero[0].length;

    if (movimientoActual === totalCasillas) {
        return true;
    }
    let validos = movimientosValidos(x, y, tablero);

    for (let i = 0; i < validos.length; i++) {

        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;

        if (
            resolverCaballo(
                tablero,
                nuevoX,
                nuevoY,
                movimientoActual + 1
            )
        ) {
            return true;
        }

        tablero[nuevoX][nuevoY] = -1;
    }

    return false;
}

// PRUEBAS

// Tamaño del tablero
const n = 5;
let tablero = Array.from({ length: n }, () => Array(n).fill(-1));

let inicioX = 0;
let inicioY = 0;

tablero[inicioX][inicioY] = 0;

console.log("Probando recorrido del caballo");
console.log("Tamaño del tablero:", n + "x" + n);
console.log("Posición inicial:", "(" + inicioX + "," + inicioY + ")");

let solucion = resolverCaballo(tablero, inicioX, inicioY, 1);

// Mostrar resultado
if (solucion) {
  console.log("Solución encontrada:");
  console.table(tablero);
} else {
  console.log("No se encontró solución.");
}
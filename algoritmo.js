const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
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
function preguntar(texto) {
    return new Promise(resolve => {
        rl.question(texto, respuesta => resolve(respuesta));
    });
}
function esValido(x, y, tablero) {
    return (
        x >= 0 && x < tablero.length &&
        y >= 0 && y < tablero[0].length &&
        tablero[x][y] === -1
    );
}

function movimientosValidos(x, y, tablero) {
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

// CAMBIO: función para agregar obstáculos
function agregarObstaculos(tablero, obstaculos) {
    for (let obstaculo of obstaculos) {
        let x = obstaculo[0];
        let y = obstaculo[1];

        tablero[x][y] = -2;
    }
}

function contarCasillasLibres(tablero) {
    let total = 0;

    for (let x = 0; x < tablero.length; x++) {
        for (let y = 0; y < tablero[0].length; y++) {
            if (tablero[x][y] !== -2) {
                total++;
            }
        }
    }

    return total;
}

function resolverCaballo(tablero, x, y, movimientoActual, totalCasillas) {
    if (movimientoActual === totalCasillas) {
        return true;
    }

    let validos = movimientosValidos(x, y, tablero);

    for (let i = 0; i < validos.length; i++) {
        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;

        if (resolverCaballo(tablero, nuevoX, nuevoY, movimientoActual + 1, totalCasillas)) {
            return true;
        }

        tablero[nuevoX][nuevoY] = -1;
    }

    return false;
}

// PRUEBAS

const n = 5;
let tablero = Array.from({ length: n }, () => Array(n).fill(-1));

let inicioX = 0;
let inicioY = 0;

// CAMBIO: lista de obstáculos
let obstaculos = [
    [1, 1],
    [2, 3],
    [4, 0]
];

agregarObstaculos(tablero, obstaculos);

if (tablero[inicioX][inicioY] === -2) {
    console.log("Error: la posición inicial no puede ser un obstáculo.");
} else {
    tablero[inicioX][inicioY] = 0;

    let totalCasillas = contarCasillasLibres(tablero);

    console.log("Probando recorrido del caballo con obstáculos");
    console.log("Tamaño del tablero:", n + "x" + n);
    console.log("Posición inicial:", "(" + inicioX + "," + inicioY + ")");
    console.log("Obstáculos:", obstaculos);

    let solucion = resolverCaballo(tablero, inicioX, inicioY, 1, totalCasillas);

    if (solucion) {
        console.log("Solución encontrada:");
        console.table(tablero);
    } else {
        console.log("No se encontró solución.");
        console.table(tablero);
    }
}
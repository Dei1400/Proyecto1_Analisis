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
// Estadísticas
let estadisticas = {
    movimientosIntentados: 0,
    retrocesos: 0,
    tiempo: 0
};

// Guarda los pasos del proceso
let historial = [];

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

        estadisticas.movimientosIntentados++;

        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;
        historial.push({
        tipo: "avance",
        x: nuevoX,
        y: nuevoY,
        paso: movimientoActual
    });

        if (resolverCaballo(tablero, nuevoX, nuevoY, movimientoActual + 1, totalCasillas)) {
            return true;
        }

        estadisticas.retrocesos++;

        historial.push({
            tipo: "retroceso",
            x: nuevoX,
            y: nuevoY,
            paso: movimientoActual
        });
        tablero[nuevoX][nuevoY] = -1;
    }

    return false;
}

// PRUEBAS

async function main() {
    const n = parseInt(
        await preguntar("Digite el tamaño N del tablero: ")
    );

    if (isNaN(n) || n < 4) {
        console.log("Error: el tamaño del tablero debe ser un número mayor o igual a 4.");
        rl.close();
        return;
    }

    let tablero = Array.from(
        { length: n },
        () => Array(n).fill(-1)
    );

    const inicioX = parseInt(
        await preguntar("Digite fila inicial: ")
    );

    const inicioY = parseInt(
        await preguntar("Digite columna inicial: ")
    );

    // Validar que la posición inicial esté dentro del tablero
    if (
        isNaN(inicioX) || isNaN(inicioY) ||
        inicioX < 0 || inicioX >= n ||
        inicioY < 0 || inicioY >= n
    ) {
        console.log("Error: posición inicial fuera del tablero.");
        rl.close();
        return;
    }

    const cantidadObstaculos = parseInt(
        await preguntar("Digite cantidad de obstáculos: ")
    );

    if (isNaN(cantidadObstaculos) || cantidadObstaculos < 0) {
        console.log("Error: la cantidad de obstáculos no es válida.");
        rl.close();
        return;
    }

    let obstaculos = [];

    for (let i = 0; i < cantidadObstaculos; i++) {
        let x = parseInt(
            await preguntar(`Fila obstáculo ${i + 1}: `)
        );

        let y = parseInt(
            await preguntar(`Columna obstáculo ${i + 1}: `)
        );

        // Validar que cada obstáculo esté dentro del tablero
        if (
            isNaN(x) || isNaN(y) ||
            x < 0 || x >= n ||
            y < 0 || y >= n
        ) {
            console.log("Error: obstáculo fuera del tablero.");
            rl.close();
            return;
        }

        // Evitar obstáculo en la posición inicial
        if (x === inicioX && y === inicioY) {
            console.log("Error: no puede haber un obstáculo en la posición inicial.");
            rl.close();
            return;
        }

        // Evitar obstáculos repetidos
        let repetido = obstaculos.some(
            obstaculo => obstaculo[0] === x && obstaculo[1] === y
        );

        if (repetido) {
            console.log("Error: obstáculo repetido.");
            rl.close();
            return;
        }

        obstaculos.push([x, y]);
    }

    agregarObstaculos(tablero, obstaculos);

    tablero[inicioX][inicioY] = 0;

    historial.push({
        tipo: "inicio",
        x: inicioX,
        y: inicioY,
        paso: 0
    });

    let totalCasillas = contarCasillasLibres(tablero);

    console.log("\n=== DATOS DEL PROBLEMA ===");
    console.log("Tamaño:", n + "x" + n);
    console.log("Inicio:", "(" + inicioX + "," + inicioY + ")");
    console.log("Obstáculos:", obstaculos);

    let inicioTiempo = performance.now();

    let solucion = resolverCaballo(
        tablero,
        inicioX,
        inicioY,
        1,
        totalCasillas
    );

    let finTiempo = performance.now();
    estadisticas.tiempo = finTiempo - inicioTiempo;

    if (solucion) {
        console.log("\nSolución encontrada:");
        console.table(tablero);
    } else {
        console.log("\nNo se encontró solución.");
        console.table(tablero);
    }

    console.log("\n=== ESTADÍSTICAS ===");
    console.log("Movimientos intentados:", estadisticas.movimientosIntentados);
    console.log("Retrocesos:", estadisticas.retrocesos);
    console.log("Tiempo total:", estadisticas.tiempo.toFixed(2), "ms");
    console.log("Cantidad de pasos guardados:", historial.length);

    console.log("\nPrimeros 20 pasos del historial:");
    console.table(historial.slice(0, 20));

    // Mostrar cómo terminó el proceso
    console.log("\nÚltimos 20 pasos del historial:");
    console.table(historial.slice(-20));

    rl.close();
}

main();
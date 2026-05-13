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

let estadisticas = {
    movimientosIntentados: 0,
    retrocesos: 0,
    tiempo: 0
};

let historial = [];
let mejorTablero = null;
let mayorPasoAlcanzado = 0;

function preguntar(texto) {
    return new Promise(resolve => {
        rl.question(texto, respuesta => resolve(respuesta));
    });
}

function dentroTablero(x, y, tablero) {
    return (
        x >= 0 &&
        x < tablero.length &&
        y >= 0 &&
        y < tablero[0].length
    );
}

function esValido(x, y, tablero) {
    return (
        dentroTablero(x, y, tablero) &&
        tablero[x][y] === -1
    );
}

function usaObstaculoComoPuente(x, y, nx, ny, tablero) {

    let dx = nx - x;
    let dy = ny - y;

    let sx = Math.sign(dx);
    let sy = Math.sign(dy);

    let casillasDelMovimiento = [];

    if (
        Math.abs(dx) === 2 &&
        Math.abs(dy) === 1
    ) {

        casillasDelMovimiento = [

            [x + sx, y],
            [x + 2 * sx, y]

        ];
    }

    if (
        Math.abs(dx) === 1 &&
        Math.abs(dy) === 2
    ) {

        casillasDelMovimiento = [

            [x, y + sy],
            [x, y + 2 * sy]

        ];
    }

    for (let casilla of casillasDelMovimiento) {

        let cx = casilla[0];
        let cy = casilla[1];

        if (

            dentroTablero(cx, cy, tablero) &&
            tablero[cx][cy] === -2
        ) {

            return true;
        }
    }

    return false;
}

function movimientosValidos(x, y, tablero) {

    let validos = [];

    // Revisa los 8 movimientos
    for (let mov of movimientos) {

        let nx = x + mov[0];
        let ny = y + mov[1];

        estadisticas.movimientosIntentados++;

        // Si se sale, cae en obstáculo o visitada
        if (!esValido(nx, ny, tablero)) {

            continue;
        }

        // Si usa obstáculo como puente
        if (usaObstaculoComoPuente(x,y,nx,ny,tablero)) {

            continue;
        }

        // Si cumple todo, se guarda
        validos.push([nx, ny]);
    }

    return validos;
}

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
// Función para copiar el tablero (para guardar el mejor estado)
function copiarTablero(tablero) {

    return tablero.map(
        fila => [...fila]
    );
}

function resolverCaballo(tablero,x,y,movimientoActual,totalCasillas) {

    if (movimientoActual >mayorPasoAlcanzado) {
        mayorPasoAlcanzado =
            movimientoActual;

        mejorTablero =
            copiarTablero(tablero);
    }

    // Si ya visitó todas las casillas libres
    if (movimientoActual === totalCasillas) {

        return true;
    }

    // Obtener movimientos válidos
    let validos = movimientosValidos(
        x,
        y,
        tablero
    );

    // Probar todos los movimientos válidos
    for (let i = 0; i < validos.length; i++) {

        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        // Marcar casilla
        tablero[nuevoX][nuevoY] =
            movimientoActual;

        historial.push({
            tipo: "avance",
            x: nuevoX,
            y: nuevoY,
            paso: movimientoActual
        });

        // Backtracking
        if (resolverCaballo(tablero,nuevoX,nuevoY,movimientoActual + 1,totalCasillas)) {
            return true;
        }

        // Retroceso
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

async function main() {

    const n = parseInt(

        await preguntar(
            "Digite el tamaño N del tablero: "
        )
    );

    if (
        isNaN(n) ||
        n < 4
    ) {

        console.log(
            "Error: tamaño inválido."
        );

        rl.close();
        return;
    }

    let tablero = Array.from(

        { length: n },

        () => Array(n).fill(-1)
    );

    const inicioX = parseInt(

        await preguntar(
            "Digite fila inicial: "
        )
    );

    const inicioY = parseInt(

        await preguntar(
            "Digite columna inicial: "
        )
    );

    if (

        isNaN(inicioX) ||
        isNaN(inicioY) ||

        inicioX < 0 ||
        inicioX >= n ||

        inicioY < 0 ||
        inicioY >= n
    ) {

        console.log(
            "Error: inicio inválido."
        );

        rl.close();
        return;
    }

    const cantidadObstaculos = parseInt(

        await preguntar(
            "Digite cantidad de obstáculos: "
        )
    );

    let obstaculos = [];

    for (
        let i = 0;
        i < cantidadObstaculos;
        i++
    ) {

        let x = parseInt(

            await preguntar(
                `Fila obstáculo ${i + 1}: `
            )
        );

        let y = parseInt(

            await preguntar(
                `Columna obstáculo ${i + 1}: `
            )
        );

        if (

            isNaN(x) ||
            isNaN(y) ||

            x < 0 ||
            x >= n ||

            y < 0 ||
            y >= n
        ) {

            console.log(
                "Error: obstáculo inválido."
            );

            rl.close();
            return;
        }

        if (
            x === inicioX &&
            y === inicioY
        ) {

            console.log(
                "Error: obstáculo en inicio."
            );

            rl.close();
            return;
        }

        obstaculos.push([x, y]);
    }

    agregarObstaculos(
        tablero,
        obstaculos
    );

    tablero[inicioX][inicioY] = 0;

    historial.push({

        tipo: "inicio",
        x: inicioX,
        y: inicioY,
        paso: 0
    });

    mejorTablero =
        copiarTablero(tablero);

    mayorPasoAlcanzado = 1;

    let totalCasillas =
        contarCasillasLibres(tablero);

    console.log(
        "\n=== DATOS DEL PROBLEMA ==="
    );

    console.log(
        "Tamaño:",
        n + "x" + n
    );

    console.log(
        "Inicio:",
        "(" + inicioX + "," + inicioY + ")"
    );

    console.log(
        "Obstáculos:",
        obstaculos
    );

    let inicioTiempo =
        Date.now();

    let solucion = resolverCaballo(

        tablero,
        inicioX,
        inicioY,
        1,
        totalCasillas
    );

    let finTiempo =
        Date.now();

    estadisticas.tiempo =
        finTiempo - inicioTiempo;

    if (solucion) {

        console.log(
            "\nSolución encontrada:"
        );

        console.table(tablero);

    } else {

        console.log(
            "\nNo se encontró solución completa."
        );

        console.log(
            "Mayor cantidad de pasos alcanzados:",
            mayorPasoAlcanzado,
            "de",
            totalCasillas
        );

        console.log(
            "\nMejor recorrido alcanzado:"
        );

        console.table(mejorTablero);
    }

    console.log(
        "\n=== ESTADÍSTICAS ==="
    );

    console.log(
        "Movimientos intentados:",
        estadisticas.movimientosIntentados
    );

    console.log(
        "Retrocesos:",
        estadisticas.retrocesos
    );

    console.log(
        "Tiempo total:",
        estadisticas.tiempo,
        "ms"
    );

    console.log(
        "Cantidad de pasos guardados:",
        historial.length
    );

    console.log(
        "\nPrimeros 20 pasos:"
    );

    console.table(
        historial.slice(0, 20)
    );

    console.log(
        "\nÚltimos 20 pasos:"
    );

    console.table(
        historial.slice(-20)
    );

    rl.close();
}

main();
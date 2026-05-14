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
    podasAccesibilidad: 0, // para contar cuántas veces se poda por no ser accesible
    tiempo: 0
};

let usarWarnsdorff = true;

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

    if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {

        casillasDelMovimiento = [
            [x + sx, y],
            [x + 2 * sx, y]
        ];
    }

    if (Math.abs(dx) === 1 &&Math.abs(dy) === 2) {

        casillasDelMovimiento = [
            [x, y + sy],
            [x, y + 2 * sy]
        ];
    }

    for (let casilla of casillasDelMovimiento) {

        let cx = casilla[0];
        let cy = casilla[1];

        if (dentroTablero(cx, cy, tablero) &&tablero[cx][cy] === -2) {
            return true;
        }
    }

    return false;
}

function movimientosValidos(x, y, tablero) {

    let validos = [];

    for (let mov of movimientos) {

        let nx = x + mov[0];
        let ny = y + mov[1];

        estadisticas.movimientosIntentados++;

        if (!esValido(nx, ny, tablero)) {
            continue;
        }

        if (usaObstaculoComoPuente(x,y,nx,ny,tablero)) {
            continue;
        }

        validos.push([nx, ny]);
    }

    return validos;
}

// Versión sin contar estadísticas de movimientos intentados
function movimientosValidosSinEstadistica(x, y, tablero) {

    let validos = [];

    for (let mov of movimientos) {

        let nx = x + mov[0];
        let ny = y + mov[1];

        if (!esValido(nx, ny, tablero)) {
            continue;
        }

        if (usaObstaculoComoPuente(x,y,nx,ny,tablero)) {
            continue;
        }

        validos.push([nx, ny]);
    }

    return validos;
}

// Para contar cuántos movimientos futuros válidos tiene una casilla (para la heurística de Warnsdorff)
function contarMovimientosFuturos(x, y, tablero) {

    let futuros = movimientosValidosSinEstadistica(
        x,
        y,
        tablero
    );

    return futuros.length;
}
// Para ordenar los movimientos según la heurística de Warnsdorff (menor cantidad de movimientos futuros)
function ordenarPorWarnsdorff(validos, tablero) {

    validos.sort((a, b) => {

        let futurosA = contarMovimientosFuturos(
            a[0],
            a[1],
            tablero
        );

        let futurosB = contarMovimientosFuturos(
            b[0],
            b[1],
            tablero
        );

        return futurosA - futurosB;
    });

    return validos;
}

// Para verifica si aún se puede llegar a todas las casillas libres restantes
function todasLasCasillasAccesibles(x, y, tablero) {

    let n = tablero.length;

    let casillasLibres = 0;

    for (let i = 0; i < n; i++) {

        for (let j = 0; j < n; j++) {

            if (tablero[i][j] === -1) {
                casillasLibres++;
            }
        }
    }

    if (casillasLibres === 0) {
        return true;
    }

    // para contar cuántas casillas libres se pueden alcanzar
    let visitados = Array.from(
        { length: n },
        () => Array(n).fill(false) 
    );

    let cola = [[x, y]];

    visitados[x][y] = true;

    let alcanzadas = 0;

    while (cola.length > 0) {

        let actual = cola.shift();

        let cx = actual[0];
        let cy = actual[1];

        for (let mov of movimientos) {

            let nx = cx + mov[0];
            let ny = cy + mov[1];

            if (!dentroTablero(nx, ny, tablero)) {
                continue;
            }

            if (visitados[nx][ny]) {
                continue;
            }

            if (tablero[nx][ny] === -2) {
                continue;
            }

            if (usaObstaculoComoPuente(cx,cy,nx,ny,tablero)) {
                continue;
            }

            visitados[nx][ny] = true;

            if (tablero[nx][ny] === -1) {
                alcanzadas++;
            }

            cola.push([nx, ny]);
        }
    }

    return alcanzadas === casillasLibres;
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

function copiarTablero(tablero) {
    return tablero.map(fila => [...fila]); // copia profunda del tablero
}

function resolverCaballo(tablero,x,y,movimientoActual,totalCasillas) {

    if (movimientoActual > mayorPasoAlcanzado) {

        mayorPasoAlcanzado = movimientoActual;

        mejorTablero = copiarTablero(tablero);
    }

    if (movimientoActual === totalCasillas) {

        return true;
    }

    let validos = movimientosValidos(
        x,
        y,
        tablero
    );

    // valida si se quiere usar la heurística de Warnsdorff para ordenar los movimientos
    if (usarWarnsdorff) {

        validos = ordenarPorWarnsdorff(
            validos,
            tablero
        );
    }

    for (let i = 0; i < validos.length; i++) {

        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;

        // Poda por accesibilidad
        if (todasLasCasillasAccesibles(nuevoX,nuevoY,tablero)) {
            if (resolverCaballo(tablero,nuevoX,nuevoY,movimientoActual + 1,totalCasillas)) {
                return true;
            }

        } else {

            estadisticas.podasAccesibilidad++;
        }

        estadisticas.retrocesos++;

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

    if (isNaN(n) || n < 4) {

        console.log("Error: tamaño inválido.");

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

        console.log("Error: inicio inválido.");

        rl.close();

        return;
    }

    const cantidadObstaculos = parseInt(
        await preguntar(
            "Digite cantidad de obstáculos: "
        )
    );

    let obstaculos = [];

    for (let i = 0; i < cantidadObstaculos; i++) {

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

    mejorTablero = copiarTablero(tablero);

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

    // CAMBIO NUEVO
    console.log(
        "Warnsdorff:",
        usarWarnsdorff
            ? "activado"
            : "desactivado"
    );

    let inicioTiempo = Date.now();

    let solucion = resolverCaballo(
        tablero,
        inicioX,
        inicioY,
        1,
        totalCasillas
    );

    let finTiempo = Date.now();

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

    // CAMBIO NUEVO
    console.log(
        "Podas por accesibilidad:",
        estadisticas.podasAccesibilidad
    );

    console.log(
        "Tiempo total:",
        estadisticas.tiempo,
        "ms"
    );

    rl.close();
}

main();
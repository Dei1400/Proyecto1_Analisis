// ─── Movimientos del caballo ──────────────────────────────────────────────────
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

// ─── Helpers internos ─────────────────────────────────────────────────────────
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

function copiarTablero(tablero) {
    return tablero.map(fila => [...fila]);
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

    if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
        casillasDelMovimiento = [
            [x, y + sy],
            [x, y + 2 * sy]
        ];
    }

    for (let casilla of casillasDelMovimiento) {
        let cx = casilla[0];
        let cy = casilla[1];
        if (dentroTablero(cx, cy, tablero) && tablero[cx][cy] === -2) {
            return true;
        }
    }

    return false;
}

function movimientosValidosConEstadistica(x, y, tablero, estadisticas) {
    let validos = [];

    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];

        estadisticas.movimientosIntentados++;

        if (!esValido(nx, ny, tablero)) continue;
        if (usaObstaculoComoPuente(x, y, nx, ny, tablero)) continue;

        validos.push([nx, ny]);
    }

    return validos;
}

function movimientosValidosSinEstadistica(x, y, tablero) {
    let validos = [];

    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];

        if (!esValido(nx, ny, tablero)) continue;
        if (usaObstaculoComoPuente(x, y, nx, ny, tablero)) continue;

        validos.push([nx, ny]);
    }

    return validos;
}

function contarMovimientosFuturos(x, y, tablero) {
    return movimientosValidosSinEstadistica(x, y, tablero).length;
}

function ordenarPorWarnsdorff(validos, tablero) {
    validos.sort((a, b) => {
        let futurosA = contarMovimientosFuturos(a[0], a[1], tablero);
        let futurosB = contarMovimientosFuturos(b[0], b[1], tablero);
        return futurosA - futurosB;
    });
    return validos;
}

function todasLasCasillasAccesibles(x, y, tablero) {
    let n = tablero.length;
    let casillasLibres = 0;

    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
            if (tablero[i][j] === -1) casillasLibres++;

    if (casillasLibres === 0) return true;

    let visitados = Array.from({ length: n }, () => Array(n).fill(false));
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

            if (!dentroTablero(nx, ny, tablero)) continue;
            if (visitados[nx][ny]) continue;
            if (tablero[nx][ny] === -2) continue;
            if (usaObstaculoComoPuente(cx, cy, nx, ny, tablero)) continue;

            visitados[nx][ny] = true;

            if (tablero[nx][ny] === -1) alcanzadas++;

            cola.push([nx, ny]);
        }
    }

    return alcanzadas === casillasLibres;
}

function contarCasillasLibres(tablero) {
    let total = 0;
    for (let x = 0; x < tablero.length; x++)
        for (let y = 0; y < tablero[0].length; y++)
            if (tablero[x][y] !== -2) total++;
    return total;
}

// ─── Algoritmo recursivo Warnsdorff ──────────────────────────────────────────
function resolverCaballoWarnsdorff(
    tablero, x, y, movimientoActual, totalCasillas,
    estadisticas, historial, mejorRecorridoData
) {
    if (movimientoActual > mejorRecorridoData.mayorPasoAlcanzado) {
        mejorRecorridoData.mayorPasoAlcanzado = movimientoActual;
        mejorRecorridoData.mejorTablero = copiarTablero(tablero);
        mejorRecorridoData.ultimaPosicion = { x, y };
    }

    if (movimientoActual === totalCasillas) return true;

    let validos = movimientosValidosConEstadistica(x, y, tablero, estadisticas);
    validos = ordenarPorWarnsdorff(validos, tablero);

    for (let i = 0; i < validos.length; i++) {
        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;

        if (historial) {
            historial.push({ tipo: "avance", x: nuevoX, y: nuevoY, paso: movimientoActual });
        }

        // Poda por accesibilidad
        if (todasLasCasillasAccesibles(nuevoX, nuevoY, tablero)) {
            if (resolverCaballoWarnsdorff(
                tablero, nuevoX, nuevoY, movimientoActual + 1, totalCasillas,
                estadisticas, historial, mejorRecorridoData
            )) {
                return true;
            }
        } else {
            estadisticas.podasAccesibilidad++;
        }

        estadisticas.retrocesos++;

        if (historial) {
            historial.push({ tipo: "retroceso", x: nuevoX, y: nuevoY, paso: movimientoActual });
        }

        tablero[nuevoX][nuevoY] = -1;
    }

    return false;
}

export function iniciarRecorridoWarnsdorff(tablero, inicioX, inicioY, guardarHistorial = true) {
    const n = tablero.length;

    if (inicioX < 0 || inicioX >= n || inicioY < 0 || inicioY >= n) {
        return {
            posible: false,
            mensaje: "La posición inicial está fuera del tablero.",
            tablero: tablero.map(fila => [...fila]),
            estadisticas: { movimientosIntentados: 0, retrocesos: 0, podasAccesibilidad: 0, tiempo: 0 },
            historial: [],
            mejorRecorrido: null,
            mayorPasoAlcanzado: 0
        };
    }

    const copia = tablero.map(fila => [...fila]);
    const estadisticas = { movimientosIntentados: 0, retrocesos: 0, podasAccesibilidad: 0, tiempo: 0 };
    const historial = guardarHistorial ? [] : null;

    if (copia[inicioX][inicioY] === -2) {
        return {
            posible: false,
            mensaje: "La casilla inicial es un obstáculo.",
            tablero: copia,
            estadisticas,
            historial: [],
            mejorRecorrido: null,
            mayorPasoAlcanzado: 0
        };
    }

    const totalCasillas = contarCasillasLibres(copia);
    copia[inicioX][inicioY] = 0;

    if (guardarHistorial) {
        historial.push({ tipo: "inicio", x: inicioX, y: inicioY, paso: 0 });
    }

    const mejorRecorridoData = {
        mejorTablero: copiarTablero(copia),
        mayorPasoAlcanzado: 1,
        ultimaPosicion: { x: inicioX, y: inicioY }
    };

    const inicioTiempo = performance.now();
    const posible = resolverCaballoWarnsdorff(
        copia, inicioX, inicioY, 1, totalCasillas,
        estadisticas, historial, mejorRecorridoData
    );
    estadisticas.tiempo = performance.now() - inicioTiempo;

    return {
        posible,
        tablero: posible ? copia : mejorRecorridoData.mejorTablero,
        estadisticas,
        historial: historial ?? [],
        mejorRecorrido: mejorRecorridoData.mejorTablero,
        mayorPasoAlcanzado: mejorRecorridoData.mayorPasoAlcanzado - 1,
        ultimaPosicion: mejorRecorridoData.ultimaPosicion
    };
}
/**
 * ============================================
 * ♞ Knight Tour/ Deilyn y Alexa
 * ============================================
 * Convenciones:
 * -1 = casilla libre
 * -2 = obstáculo
 * >=0 = número de paso del caballo
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
 * Crea un tablero n x n inicializado en -1.
 * @param {number} n
 * @returns {number[][]}
 */
export function crearTablero(n) {
    return Array.from({ length: n }, () => Array(n).fill(-1));
}

/**
 * Alterna una casilla entre libre (-1) y obstáculo (-2).
 * @param {number[][]} tablero
 * @param {number} x
 * @param {number} y
 * @returns {number[][]}
 */
export function toggleObstaculo(tablero, x, y) {
    const nuevo = tablero.map(fila => [...fila]);
    nuevo[x][y] = nuevo[x][y] === -2 ? -1 : -2;
    return nuevo;
}

/**
 * Valida tamaño del tablero.
 * @param {number|string} n
 * @returns {{valido:boolean, mensaje:string}}
 */
export function validarTamanio(n) {
    const valor = Number(n);
    if (!Number.isInteger(valor) || valor < 4) {
        return { valido: false, mensaje: "El tamaño del tablero debe ser un número entero mayor o igual a 4." };
    }
    return { valido: true, mensaje: "" };
}

/**
 * Valida posición inicial.
 * @param {number|string} x
 * @param {number|string} y
 * @param {number} n
 * @returns {{valido:boolean, mensaje:string}}
 */
export function validarPosicionInicial(x, y, n) {
    const xNum = Number(x);
    const yNum = Number(y);

    if (!Number.isInteger(xNum) || !Number.isInteger(yNum)) {
        return { valido: false, mensaje: "La posición inicial debe ser un número entero." };
    }

    if (xNum < 0 || xNum >= n || yNum < 0 || yNum >= n) {
        return { valido: false, mensaje: "La posición inicial está fuera del tablero." };
    }

    return { valido: true, mensaje: "" };
}

/**
 * Valida cantidad de obstáculos.
 * @param {number|string} cantidadObstaculos
 * @returns {{valido:boolean, mensaje:string}}
 */
export function validarCantidadObstaculos(cantidadObstaculos) {
    const cantidad = Number(cantidadObstaculos);
    if (!Number.isInteger(cantidad) || cantidad < 0) {
        return { valido: false, mensaje: "La cantidad de obstáculos no es válida." };
    }
    return { valido: true, mensaje: "" };
}

/**
 * Valida un obstáculo individual.
 * @param {number|string} x
 * @param {number|string} y
 * @param {number} n
 * @param {number} inicioX
 * @param {number} inicioY
 * @param {number[][]} obstaculos
 * @returns {{valido:boolean, mensaje:string}}
 */
export function validarObstaculo(x, y, n, inicioX, inicioY, obstaculos) {
    const xNum = Number(x);
    const yNum = Number(y);

    if (!Number.isInteger(xNum) || !Number.isInteger(yNum)) {
        return { valido: false, mensaje: "Las coordenadas del obstáculo deben ser números enteros." };
    }

    if (xNum < 0 || xNum >= n || yNum < 0 || yNum >= n) {
        return { valido: false, mensaje: "Obstáculo fuera del tablero." };
    }

    if (xNum === inicioX && yNum === inicioY) {
        return { valido: false, mensaje: "No puede haber un obstáculo en la posición inicial." };
    }

    const repetido = obstaculos.some(([ox, oy]) => ox === xNum && oy === yNum);

    if (repetido) {
        return { valido: false, mensaje: "Obstáculo repetido." };
    }

    return { valido: true, mensaje: "" };
}

/**
 * Agrega obstáculos al tablero.
 * @param {number[][]} tablero
 * @param {number[][]} obstaculos
 * @returns {number[][]}
 */
export function agregarObstaculos(tablero, obstaculos) {
    const copia = tablero.map(fila => [...fila]);
    for (let [x, y] of obstaculos) {
        copia[x][y] = -2;
    }
    return copia;
}

/**
 * Verifica si está dentro del tablero.
 * @private
 */
function dentroTablero(x, y, tablero) {
    return x >= 0 && x < tablero.length && y >= 0 && y < tablero[0].length;
}

/**
 * Verifica si una casilla es válida.
 * @private
 */
function esValido(x, y, tablero) {
    return dentroTablero(x, y, tablero) && tablero[x][y] === -1;
}

/**
 * Copia profunda del tablero.
 * @private
 */
function copiarTablero(tablero) {
    return tablero.map(fila => [...fila]);
}

/**
 * Evita que el caballo "salte" usando obstáculos como puente.
 * @private
 */
function usaObstaculoComoPuente(x, y, nx, ny, tablero) {
    let dx = nx - x;
    let dy = ny - y;

    let sx = Math.sign(dx);
    let sy = Math.sign(dy);

    let casillas = [];

    if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
        casillas = [[x + sx, y], [x + 2 * sx, y]];
    }

    if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
        casillas = [[x, y + sy], [x, y + 2 * sy]];
    }

    return casillas.some(([cx, cy]) =>
        dentroTablero(cx, cy, tablero) && tablero[cx][cy] === -2
    );
}

/**
 * Obtiene movimientos válidos del caballo.
 * @param {number} x
 * @param {number} y
 * @param {number[][]} tablero
 * @param {{movimientosIntentados:number}} [estadisticas]
 * @returns {number[][]}
 */
export function movimientosValidos(x, y, tablero, estadisticas = null) {
    let validos = [];

    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];

        if (estadisticas) estadisticas.movimientosIntentados++;

        if (!esValido(nx, ny, tablero)) continue;
        if (usaObstaculoComoPuente(x, y, nx, ny, tablero)) continue;

        validos.push([nx, ny]);
    }

    return validos;
}

/**
 * Cuenta casillas libres.
 * @private
 */
function contarCasillasLibres(tablero) {
    let total = 0;
    for (let fila of tablero) {
        for (let celda of fila) {
            if (celda !== -2) total++;
        }
    }
    return total;
}

/**
 * Verifica si existe solución.
 * @param {number[][]} tablero
 * @param {number} startX
 * @param {number} startY
 */
export function verificarResoluble(tablero, startX, startY) {
    const resultado = iniciarRecorrido(tablero, startX, startY, false);

    return {
        posible: resultado.posible,
        mensaje: resultado.posible ? "" : "No existe solución para este tablero con esta posición inicial."
    };
}

/**
 * Backtracking del caballo.
 * @private
 */
function resolverCaballo(tablero, x, y, paso, total, stats, historial, mejor) {
    if (paso > mejor.mayorPasoAlcanzado) {
        mejor.mayorPasoAlcanzado = paso;
        mejor.mejorTablero = copiarTablero(tablero);
        mejor.ultimaPosicion = { x, y };
    }

    if (paso === total) return true;

    let validos = movimientosValidos(x, y, tablero, stats);

    for (let [nx, ny] of validos) {
        tablero[nx][ny] = paso;

        if (historial) historial.push({ tipo: "avance", x: nx, y: ny, paso });

        if (resolverCaballo(tablero, nx, ny, paso + 1, total, stats, historial, mejor)) {
            return true;
        }

        stats.retrocesos++;
        if (historial) historial.push({ tipo: "retroceso", x: nx, y: ny, paso });

        tablero[nx][ny] = -1;
    }

    return false;
}

/**
 * Inicia el recorrido del caballo.
 * @param {number[][]} tablero
 * @param {number} inicioX
 * @param {number} inicioY
 * @param {boolean} [guardarHistorial=true]
 */
export function iniciarRecorrido(tablero, inicioX, inicioY, guardarHistorial = true) {
    const n = tablero.length;
    const validacion = validarPosicionInicial(inicioX, inicioY, n);

    if (!validacion.valido) {
        return {
            posible: false,
            mensaje: validacion.mensaje,
            tablero: copiarTablero(tablero),
            estadisticas: { movimientosIntentados: 0, retrocesos: 0, tiempo: 0 },
            historial: [],
            mejorRecorrido: null,
            mayorPasoAlcanzado: 0
        };
    }

    const copia = copiarTablero(tablero);
    const stats = { movimientosIntentados: 0, retrocesos: 0, tiempo: 0 };
    const historial = guardarHistorial ? [] : null;

    if (copia[inicioX][inicioY] === -2) {
        return {
            posible: false,
            mensaje: "La casilla inicial es un obstáculo.",
            tablero: copia,
            estadisticas: stats,
            historial: [],
            mejorRecorrido: null,
            mayorPasoAlcanzado: 0
        };
    }

    const total = contarCasillasLibres(copia);
    copia[inicioX][inicioY] = 0;

    if (historial) historial.push({ tipo: "inicio", x: inicioX, y: inicioY, paso: 0 });

    const mejor = {
        mejorTablero: copiarTablero(copia),
        mayorPasoAlcanzado: 1,
        ultimaPosicion: { x: inicioX, y: inicioY }
    };

    const t0 = performance.now();
    const posible = resolverCaballo(copia, inicioX, inicioY, 1, total, stats, historial, mejor);
    stats.tiempo = performance.now() - t0;

    return {
        posible,
        mensaje: posible
            ? "Solución encontrada."
            : `No se encontró solución. Mejor recorrido: ${mejor.mayorPasoAlcanzado - 1} de ${total - 1} pasos.`,
        tablero: posible ? copia : mejor.mejorTablero,
        estadisticas: stats,
        historial: historial ?? [],
        mejorRecorrido: mejor.mejorTablero,
        mayorPasoAlcanzado: mejor.mayorPasoAlcanzado - 1,
        ultimaPosicion: mejor.ultimaPosicion
    };
}
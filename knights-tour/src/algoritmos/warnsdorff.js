/**
 * ============================================================================
 * WARNDORFF 
 * ============================================================================
 * Arreglo constante que contiene los 8 movimientos válidos que puede realizar
 * un caballo en el ajedrez.
 *
 * Cada movimiento se representa como:
 * [desplazamientoX, desplazamientoY]
 *
 * Ejemplo:
 * [-2, -1] => mover 2 filas arriba y 1 columna a la izquierda.
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
 * ============================================================================
 * HELPERS INTERNOS
 * ============================================================================
 */

/**
 * Verifica si una posición se encuentra dentro de los límites del tablero.
 *
 * @param {number} x - Coordenada fila.
 * @param {number} y - Coordenada columna.
 * @param {number[][]} tablero - Matriz del tablero.
 * @returns {boolean} true si la posición es válida.
 */
function dentroTablero(x, y, tablero) {
    return (
        x >= 0 &&
        x < tablero.length &&
        y >= 0 &&
        y < tablero[0].length
    );
}

/**
 * Verifica si una casilla es válida para moverse.
 *
 * Una casilla es válida cuando:
 * - Está dentro del tablero.
 * - No ha sido visitada.
 *
 * Convención:
 * -1 => casilla libre
 * -2 => obstáculo
 *
 * @param {number} x - Coordenada fila.
 * @param {number} y - Coordenada columna.
 * @param {number[][]} tablero - Estado actual del tablero.
 * @returns {boolean} true si el movimiento es permitido.
 */
function esValido(x, y, tablero) {
    return (
        dentroTablero(x, y, tablero) &&
        tablero[x][y] === -1
    );
}

/**
 * Crea una copia profunda del tablero.
 *
 * Se utiliza para evitar modificar referencias originales y almacenar
 * estados intermedios del recorrido.
 *
 * @param {number[][]} tablero - Tablero original.
 * @returns {number[][]} Copia del tablero.
 */
function copiarTablero(tablero) {
    return tablero.map(fila => [...fila]);
}

/**
 * Verifica si un movimiento del caballo atraviesa un obstáculo.
 *
 * Aunque el caballo "salta" piezas en ajedrez tradicional, en esta
 * implementación se evita que el movimiento use obstáculos como puente.
 *
 * @param {number} x - Posición inicial fila.
 * @param {number} y - Posición inicial columna.
 * @param {number} nx - Nueva fila.
 * @param {number} ny - Nueva columna.
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {boolean} true si el movimiento atraviesa un obstáculo.
 */
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

/**
 * Obtiene los movimientos válidos desde una posición y actualiza
 * estadísticas del algoritmo.
 *
 * @param {number} x - Fila actual.
 * @param {number} y - Columna actual.
 * @param {number[][]} tablero - Estado del tablero.
 * @param {Object} estadisticas - Objeto acumulador de estadísticas.
 * @returns {Array<number[]>} Lista de movimientos válidos.
 */
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

/**
 * Obtiene movimientos válidos sin modificar estadísticas.
 *
 * Se utiliza principalmente en cálculos auxiliares como la heurística
 * de Warnsdorff.
 *
 * @param {number} x - Fila actual.
 * @param {number} y - Columna actual.
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {Array<number[]>} Lista de movimientos válidos.
 */
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

/**
 * Cuenta la cantidad de movimientos futuros posibles desde una casilla.
 *
 * Esta función es utilizada por la heurística de Warnsdorff para priorizar
 * movimientos con menos salidas futuras.
 *
 * @param {number} x - Fila actual.
 * @param {number} y - Columna actual.
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {number} Cantidad de movimientos disponibles.
 */
function contarMovimientosFuturos(x, y, tablero) {
    return movimientosValidosSinEstadistica(x, y, tablero).length;
}

/**
 * Ordena movimientos utilizando la heurística de Warnsdorff.
 *
 * La heurística prioriza las casillas con menos movimientos futuros,
 * reduciendo la probabilidad de bloqueos tempranos.
 *
 * @param {Array<number[]>} validos - Lista de movimientos válidos.
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {Array<number[]>} Lista ordenada.
 */
function ordenarPorWarnsdorff(validos, tablero) {
    validos.sort((a, b) => {
        let futurosA = contarMovimientosFuturos(a[0], a[1], tablero);
        let futurosB = contarMovimientosFuturos(b[0], b[1], tablero);

        return futurosA - futurosB;
    });

    return validos;
}

/**
 * Verifica si todas las casillas libres siguen siendo accesibles.
 *
 * Implementa una poda de accesibilidad utilizando búsqueda BFS
 * para evitar estados donde queden regiones inaccesibles.
 *
 * @param {number} x - Fila actual.
 * @param {number} y - Columna actual.
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {boolean} true si todas las casillas siguen accesibles.
 */
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

/**
 * Cuenta la cantidad total de casillas disponibles.
 *
 * Las casillas con obstáculos no se contabilizan.
 *
 * @param {number[][]} tablero - Estado del tablero.
 * @returns {number} Total de casillas libres.
 */
function contarCasillasLibres(tablero) {
    let total = 0;

    for (let x = 0; x < tablero.length; x++)
        for (let y = 0; y < tablero[0].length; y++)
            if (tablero[x][y] !== -2) total++;

    return total;
}

/**
 * ============================================================================
 * ALGORITMO RECURSIVO - WARNDORFF + BACKTRACKING
 * ============================================================================
 */

/**
 * Resuelve el recorrido del caballo utilizando:
 * - Heurística de Warnsdorff.
 * - Backtracking.
 * - Poda por accesibilidad.
 *
 * El algoritmo intenta recorrer todas las casillas exactamente una vez.
 *
 * @param {number[][]} tablero - Estado actual del tablero.
 * @param {number} x - Fila actual.
 * @param {number} y - Columna actual.
 * @param {number} movimientoActual - Número del movimiento actual.
 * @param {number} totalCasillas - Total de casillas a recorrer.
 * @param {Object} estadisticas - Estadísticas acumuladas.
 * @param {Array|null} historial - Historial de movimientos.
 * @param {Object} mejorRecorridoData - Información del mejor recorrido parcial.
 * @returns {boolean} true si se encontró solución completa.
 */
function resolverCaballoWarnsdorff(
    tablero, x, y, movimientoActual, totalCasillas,
    estadisticas, historial, mejorRecorridoData
) {

    /**
     * Guarda el mejor recorrido parcial alcanzado.
     */
    if (movimientoActual > mejorRecorridoData.mayorPasoAlcanzado) {
        mejorRecorridoData.mayorPasoAlcanzado = movimientoActual;
        mejorRecorridoData.mejorTablero = copiarTablero(tablero);

        mejorRecorridoData.ultimaPosicion = { x, y };
    }

    /**
     * Caso base:
     * Se completó el recorrido total.
     */
    if (movimientoActual === totalCasillas) return true;

    /**
     * Obtiene movimientos válidos ordenados por Warnsdorff.
     */
    let validos = movimientosValidosConEstadistica(
        x,
        y,
        tablero,
        estadisticas
    );

    validos = ordenarPorWarnsdorff(validos, tablero);

    /**
     * Explora recursivamente cada movimiento posible.
     */
    for (let i = 0; i < validos.length; i++) {
        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        tablero[nuevoX][nuevoY] = movimientoActual;

        /**
         * Guarda avance en historial.
         */
        if (historial) {
            historial.push({
                tipo: "avance",
                x: nuevoX,
                y: nuevoY,
                paso: movimientoActual
            });
        }

        /**
         * Poda por accesibilidad.
         */
        if (todasLasCasillasAccesibles(nuevoX, nuevoY, tablero)) {

            if (
                resolverCaballoWarnsdorff(
                    tablero,
                    nuevoX,
                    nuevoY,
                    movimientoActual + 1,
                    totalCasillas,
                    estadisticas,
                    historial,
                    mejorRecorridoData
                )
            ) {
                return true;
            }

        } else {
            estadisticas.podasAccesibilidad++;
        }

        /**
         * Retroceso (backtracking).
         */
        estadisticas.retrocesos++;

        if (historial) {
            historial.push({
                tipo: "retroceso",
                x: nuevoX,
                y: nuevoY,
                paso: movimientoActual
            });
        }

        tablero[nuevoX][nuevoY] = -1;
    }

    return false;
}

/**
 * ============================================================================
 * FUNCIÓN PRINCIPAL
 * ============================================================================
 */

/**
 * Inicia la ejecución del recorrido del caballo utilizando
 * la heurística de Warnsdorff.
 *
 * @param {number[][]} tablero - Tablero inicial.
 * @param {number} inicioX - Fila inicial.
 * @param {number} inicioY - Columna inicial.
 * @param {boolean} guardarHistorial - Indica si se almacena historial.
 *
 * @returns {Object} Resultado del algoritmo:
 * - posible
 * - tablero
 * - estadisticas
 * - historial
 * - mejorRecorrido
 * - mayorPasoAlcanzado
 * - ultimaPosicion
 */
export function iniciarRecorridoWarnsdorff(
    tablero,
    inicioX,
    inicioY,
    guardarHistorial = true
) {

    const n = tablero.length;

    /**
     * Validación de límites.
     */
    if (
        inicioX < 0 ||
        inicioX >= n ||
        inicioY < 0 ||
        inicioY >= n
    ) {
        return {
            posible: false,
            mensaje: "La posición inicial está fuera del tablero.",
            tablero: tablero.map(fila => [...fila]),
            estadisticas: {
                movimientosIntentados: 0,
                retrocesos: 0,
                podasAccesibilidad: 0,
                tiempo: 0
            },
            historial: [],
            mejorRecorrido: null,
            mayorPasoAlcanzado: 0
        };
    }

    const copia = tablero.map(fila => [...fila]);

    const estadisticas = {
        movimientosIntentados: 0,
        retrocesos: 0,
        podasAccesibilidad: 0,
        tiempo: 0
    };

    const historial = guardarHistorial ? [] : null;

    /**
     * Verifica que la casilla inicial no sea un obstáculo.
     */
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

    /**
     * Marca posición inicial.
     */
    const totalCasillas = contarCasillasLibres(copia);

    copia[inicioX][inicioY] = 0;

    if (guardarHistorial) {
        historial.push({
            tipo: "inicio",
            x: inicioX,
            y: inicioY,
            paso: 0
        });
    }

    /**
     * Estructura para almacenar el mejor recorrido parcial.
     */
    const mejorRecorridoData = {
        mejorTablero: copiarTablero(copia),
        mayorPasoAlcanzado: 1,
        ultimaPosicion: {
            x: inicioX,
            y: inicioY
        }
    };

    /**
     * Inicio medición de tiempo.
     */
    const inicioTiempo = performance.now();

    const posible = resolverCaballoWarnsdorff(
        copia,
        inicioX,
        inicioY,
        1,
        totalCasillas,
        estadisticas,
        historial,
        mejorRecorridoData
    );

    /**
     * Tiempo total de ejecución.
     */
    estadisticas.tiempo = performance.now() - inicioTiempo;

    /**
     * Resultado final.
     */
    return {
        posible,
        tablero: posible
            ? copia
            : mejorRecorridoData.mejorTablero,

        estadisticas,

        historial: historial ?? [],

        mejorRecorrido: mejorRecorridoData.mejorTablero,

        mayorPasoAlcanzado:
            mejorRecorridoData.mayorPasoAlcanzado - 1,

        ultimaPosicion:
            mejorRecorridoData.ultimaPosicion
    };
}
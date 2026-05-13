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

export function crearTablero(n) {
    return Array.from({ length: n }, () => Array(n).fill(-1));
}

export function toggleObstaculo(tablero, x, y) {
    const nuevo = tablero.map(fila => [...fila]);
    nuevo[x][y] = nuevo[x][y] === -2 ? -1 : -2;
    return nuevo;
}

export function validarTamanio(n) {
    const valor = Number(n);
    if (!Number.isInteger(valor) || valor < 4) {
        return { valido: false, mensaje: "El tamaño del tablero debe ser un número entero mayor o igual a 4." };
    }
    return { valido: true, mensaje: "" };
}

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

export function validarCantidadObstaculos(cantidadObstaculos) {
    const cantidad = Number(cantidadObstaculos);
    if (!Number.isInteger(cantidad) || cantidad < 0) {
        return { valido: false, mensaje: "La cantidad de obstáculos no es válida." };
    }
    return { valido: true, mensaje: "" };
}

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
    const repetido = obstaculos.some(obstaculo => obstaculo[0] === xNum && obstaculo[1] === yNum);
    if (repetido) {
        return { valido: false, mensaje: "Obstáculo repetido." };
    }
    return { valido: true, mensaje: "" };
}

export function agregarObstaculos(tablero, obstaculos) {
    const copia = tablero.map(fila => [...fila]);
    for (let obstaculo of obstaculos) {
        let x = obstaculo[0];
        let y = obstaculo[1];
        copia[x][y] = -2;
    }
    return copia;
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

// Nueva función: verifica si el movimiento usa un obstáculo como puente
function usaObstaculoComoPuente(x, y, nx, ny, tablero) {
    let dx = nx - x;
    let dy = ny - y;

    let sx = Math.sign(dx);
    let sy = Math.sign(dy);

    let casillasDelMovimiento = [];

    // Movimiento en L: 2 en X, 1 en Y
    if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
        casillasDelMovimiento = [
            [x + sx, y],
            [x + 2 * sx, y]
        ];
    }

    // Movimiento en L: 1 en X, 2 en Y
    if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
        casillasDelMovimiento = [
            [x, y + sy],
            [x, y + 2 * sy]
        ];
    }

    // Verificar si alguna casilla intermedia es un obstáculo
    for (let casilla of casillasDelMovimiento) {
        let cx = casilla[0];
        let cy = casilla[1];

        if (dentroTablero(cx, cy, tablero) && tablero[cx][cy] === -2) {
            return true;
        }
    }

    return false;
}

export function movimientosValidos(x, y, tablero, estadisticas = null) {
    let validos = [];

    for (let mov of movimientos) {
        let nx = x + mov[0];
        let ny = y + mov[1];

        // Contar movimiento intentado si se proporciona estadisticas
        if (estadisticas) {
            estadisticas.movimientosIntentados++;
        }

        // Verificar si la casilla es válida (dentro del tablero, no visitada, no obstáculo)
        if (!esValido(nx, ny, tablero)) {
            continue;
        }

        // Verificar si el movimiento usa un obstáculo como puente
        if (usaObstaculoComoPuente(x, y, nx, ny, tablero)) {
            continue;
        }

        validos.push([nx, ny]);
    }

    return validos;
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

export function verificarResoluble(tablero, startX, startY, getMovimientos) {
    const n = tablero.length;

    if (startX < 0 || startX >= n || startY < 0 || startY >= n) {
        return { posible: false, mensaje: "La posición inicial está fuera del tablero." };
    }

    if (tablero[startX][startY] === -2) {
        return { posible: false, mensaje: "La casilla inicial es un obstáculo." };
    }

    // Verificación real: correr el algoritmo completo
    const resultado = iniciarRecorrido(tablero, startX, startY);
    
    return {
        posible: resultado.posible,
        mensaje: resultado.posible ? "" : "No existe solución para este tablero con esta posición inicial."
    };
}

function resolverCaballo(tablero, x, y, movimientoActual, totalCasillas, estadisticas, historial) {
    // Si ya visitó todas las casillas libres
    if (movimientoActual === totalCasillas) {
        return true;
    }

    // Obtener movimientos válidos (pasando estadisticas para contar)
    let validos = movimientosValidos(x, y, tablero, estadisticas);

    // Probar todos los movimientos válidos
    for (let i = 0; i < validos.length; i++) {
        let nuevoX = validos[i][0];
        let nuevoY = validos[i][1];

        // Marcar casilla
        tablero[nuevoX][nuevoY] = movimientoActual;
        
        historial.push({
            tipo: "avance",
            x: nuevoX,
            y: nuevoY,
            paso: movimientoActual
        });

        // Backtracking recursivo
        if (resolverCaballo(tablero, nuevoX, nuevoY, movimientoActual + 1, totalCasillas, estadisticas, historial)) {
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

export function iniciarRecorrido(tablero, inicioX, inicioY) {
    const n = tablero.length;
    const validacion = validarPosicionInicial(inicioX, inicioY, n);
    
    if (!validacion.valido) {
        return {
            posible: false,
            mensaje: validacion.mensaje,
            tablero: tablero.map(fila => [...fila]),
            estadisticas: {
                movimientosIntentados: 0,
                retrocesos: 0,
                tiempo: 0
            },
            historial: []
        };
    }

    const copia = tablero.map(fila => [...fila]);
    const estadisticas = {
        movimientosIntentados: 0,
        retrocesos: 0,
        tiempo: 0
    };
    const historial = [];

    // Verificar que la casilla inicial no sea obstáculo
    if (copia[inicioX][inicioY] === -2) {
        return {
            posible: false,
            mensaje: "La casilla inicial es un obstáculo.",
            tablero: copia,
            estadisticas,
            historial
        };
    }

    const totalCasillas = contarCasillasLibres(copia);
    
    // Marcar posición inicial
    copia[inicioX][inicioY] = 0;
    historial.push({ 
        tipo: "inicio", 
        x: inicioX, 
        y: inicioY, 
        paso: 0 
    });

    // Medir tiempo de ejecución
    const inicioTiempo = performance.now();
    
    // Ejecutar el algoritmo recursivo
    const posible = resolverCaballo(copia, inicioX, inicioY, 1, totalCasillas, estadisticas, historial);
    
    estadisticas.tiempo = performance.now() - inicioTiempo;

    return {
        posible,
        mensaje: posible ? "Solución encontrada." : "No se encontró solución.",
        tablero: copia,
        estadisticas,
        historial
    };
}
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

function esValido(x, y, tablero) {
    return (
        x >= 0 && x < tablero.length &&
        y >= 0 && y < tablero[0].length &&
        tablero[x][y] === -1
    );
}

export function movimientosValidos(x, y, tablero) {
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
    const celdasLibres = tablero.flat().filter(c => c !== -2).length;

    if (startX < 0 || startX >= n || startY < 0 || startY >= n) {
        return { posible: false, mensaje: "La posición inicial está fuera del tablero." };
    }

    if (tablero[startX][startY] === -2) {
        return { posible: false, mensaje: "La casilla inicial es un obstáculo." };
    }

    if (celdasLibres < Math.max(1, Math.floor(n * n * 0.3))) {
        return { posible: false, mensaje: "Hay demasiados obstáculos en el tablero." };
    }

    const movs = getMovimientos(startX, startY, tablero);
    if (movs.length === 0) {
        return { posible: false, mensaje: "El caballo no tiene movimientos desde la posición inicial." };
    }

    return { posible: true, mensaje: "" };
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
    copia[inicioX][inicioY] = 0;
    historial.push({ tipo: "inicio", x: inicioX, y: inicioY, paso: 0 });

    function resolver(x, y, movimientoActual) {
        if (movimientoActual === totalCasillas) {
            return true;
        }

        let validos = movimientosValidos(x, y, copia);

        for (let i = 0; i < validos.length; i++) {
            estadisticas.movimientosIntentados++;

            let nuevoX = validos[i][0];
            let nuevoY = validos[i][1];

            copia[nuevoX][nuevoY] = movimientoActual;
            historial.push({ tipo: "avance", x: nuevoX, y: nuevoY, paso: movimientoActual });

            if (resolver(nuevoX, nuevoY, movimientoActual + 1)) {
                return true;
            }

            estadisticas.retrocesos++;
            historial.push({ tipo: "retroceso", x: nuevoX, y: nuevoY, paso: movimientoActual });
            copia[nuevoX][nuevoY] = -1;
        }

        return false;
    }

    const inicioTiempo = performance.now();
    const posible = resolver(inicioX, inicioY, 1);
    estadisticas.tiempo = performance.now() - inicioTiempo;

    return {
        posible,
        mensaje: posible ? "Solución encontrada." : "No se encontró solución.",
        tablero: copia,
        estadisticas,
        historial
    };
}

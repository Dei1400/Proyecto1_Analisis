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

// validar que una posición (x, y) esté dentro del tablero de tamaño n x n
function dentroTablero(x, y, n) {
    return x >= 0 && x < n && y >= 0 && y < n;
}
// validar que una posición (x, y) sea un obstáculo
function esObstaculo(x, y, obstaculos) {
    return obstaculos.some(
        obstaculo => obstaculo[0] === x && obstaculo[1] === y
    );
}
// validar que una posición (x, y) sea válida para moverse (dentro del tablero y sin obstáculo)
function usaObstaculoComoPuente(x, y, nx, ny, obstaculos, n) {
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

        if (
            dentroTablero(cx, cy, n) &&
            esObstaculo(cx, cy, obstaculos)
        ) {
            return true;
        }
    }

    return false;
}
// función principal para contar caminos usando programación dinámica
function contarCaminosDP(n, inicioX, inicioY, destinoX, destinoY, k, obstaculos) {

    if (esObstaculo(inicioX, inicioY, obstaculos) || esObstaculo(destinoX, destinoY, obstaculos)) {
        return 0;
    }

    let dp = Array.from(
        { length: n },
        () => Array(n).fill(0)
    );

    dp[inicioX][inicioY] = 1;

    for (let paso = 1; paso <= k; paso++) {
        let siguiente = Array.from(
            { length: n },
            () => Array(n).fill(0)
        );

        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                if (dp[x][y] > 0) {
                    for (let mov of movimientos) {
                        let nx = x + mov[0];
                        let ny = y + mov[1];

                        if (!dentroTablero(nx, ny, n)) {
                            continue;
                        }

                        if (esObstaculo(nx, ny, obstaculos)) {
                            continue;
                        }

                        if (usaObstaculoComoPuente(x,y,nx,ny,obstaculos,n)) {
                            continue;
                        }

                        siguiente[nx][ny] += dp[x][y];
                    }
                }
            }
        }

        dp = siguiente;
    }

    return dp[destinoX][destinoY];
}

async function main() {
    const n = parseInt(
        await preguntar("Digite el tamaño N del tablero: ")
    );

    const inicioX = parseInt(
        await preguntar("Digite fila inicial A: ")
    );

    const inicioY = parseInt(
        await preguntar("Digite columna inicial A: ")
    );

    const destinoX = parseInt(
        await preguntar("Digite fila destino B: ")
    );

    const destinoY = parseInt(
        await preguntar("Digite columna destino B: ")
    );

    const k = parseInt(
        await preguntar("Digite cantidad exacta de movimientos K: ")
    );

    const cantidadObstaculos = parseInt(
        await preguntar("Digite cantidad de obstáculos: ")
    );

    let obstaculos = [];

    for (let i = 0; i < cantidadObstaculos; i++) {
        let x = parseInt(
            await preguntar(`Fila obstáculo ${i + 1}: `)
        );

        let y = parseInt(
            await preguntar(`Columna obstáculo ${i + 1}: `)
        );

        obstaculos.push([x, y]);
    }

    const resultado = contarCaminosDP(
        n,
        inicioX,
        inicioY,
        destinoX,
        destinoY,
        k,
        obstaculos
    );

    console.log("\n=== CONTEO DE CAMINOS CON PROGRAMACIÓN DINÁMICA ===");
    console.log("Tablero:", n + "x" + n);
    console.log("Inicio A:", "(" + inicioX + "," + inicioY + ")");
    console.log("Destino B:", "(" + destinoX + "," + destinoY + ")");
    console.log("Movimientos exactos K:", k);
    console.log("Obstáculos:", obstaculos);
    console.log("Cantidad de caminos:", resultado);

    rl.close();
}

main();
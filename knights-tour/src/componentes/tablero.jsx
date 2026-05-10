/** interfaz basica */
import { useState } from "react";
import { crearTablero, toggleObstaculo, verificarResoluble, movimientosValidos } from "../algoritmos/logicaInterfaz";

// Colores según el estado de cada celda (requisito 4)
function getColor(valor, enRetroceso) {
  if (valor === -2) return "#555";        // obstáculo
  if (valor === -1) return "#f0e9d6";     // sin visitar
  if (enRetroceso)  return "#e74c3c";     // retroceso (rojo)
  return "#2ecc71";                       // avance válido (verde)
}

export default function Board() {
  const [n, setN] = useState(5);
  const [tablero, setTablero] = useState(() => crearTablero(5));
  const [modoObstaculo, setModoObstaculo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [corriendo, setCorriendo] = useState(false);

  // Cambia el tamaño del tablero
  function handleTamano(nuevoN) {
    const valor = Math.min(7, Math.max(4, Number(nuevoN)));
    setN(valor);
    setTablero(crearTablero(valor));
    setMensaje("");
  }

  // Click en celda: pone/quita obstáculo si está en ese modo
  function handleCeldaClick(x, y) {
    if (corriendo) return;
    if (!modoObstaculo) return;
    const nuevo = toggleObstaculo(tablero, x, y);
    setTablero(nuevo);
  }

  // Verifica si el tablero es resoluble antes de correr el algoritmo
  function handleVerificar() {
    const { posible, mensaje: msg } = verificarResoluble(
      tablero, 0, 0, movimientosValidos
    );
    setMensaje(posible ? "✅ El tablero parece resoluble." : `❌ ${msg}`);
  }

  // Reinicia el tablero
  function handleReset() {
    setTablero(crearTablero(n));
    setMensaje("");
    setCorriendo(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Knight's Tour</h2>

      {/* Control de tamaño */}
      <div style={{ marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <label>Tamaño del tablero:</label>
        <input
          type="number" min={4} max={7} value={n}
          onChange={e => handleTamano(e.target.value)}
          style={{ width: 50 }}
        />
        <span style={{ fontSize: 12, color: "#888" }}>(4 mín — 7 máx)</span>
      </div>

      {/* Controles */}
      <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
        <button
          onClick={() => setModoObstaculo(m => !m)}
          style={{ background: modoObstaculo ? "#e74c3c" : "#eee", padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" }}
        >
          {modoObstaculo ? "Modo obstáculo: ON" : "Modo obstáculo: OFF"}
        </button>
        <button onClick={handleVerificar} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" }}>
          Verificar tablero
        </button>
        <button onClick={handleReset} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" }}>
          Reiniciar
        </button>
      </div>

      {/* Mensaje de estado */}
      {mensaje && <p style={{ marginBottom: 10 }}>{mensaje}</p>}

      {/* Tablero */}
      <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${n}, 56px)`, gap: 2 }}>
        {tablero.map((fila, x) =>
          fila.map((valor, y) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCeldaClick(x, y)}
              style={{
                width: 56, height: 56,
                background: getColor(valor, false),
                border: "1px solid #999",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: valor >= 0 ? 16 : 12,
                fontWeight: "bold",
                cursor: modoObstaculo ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              {valor === -2 ? "✕" : valor >= 0 ? valor : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
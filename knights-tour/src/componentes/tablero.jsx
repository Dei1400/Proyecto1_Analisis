/** interfaz basica */
import { useState } from "react";
import { crearTablero, toggleObstaculo, verificarResoluble, movimientosValidos } from "../algoritmos/logicaInterfaz";

// Colores según el estado de cada celda (requisito 4) - Se mantienen originales
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
  
  // Estado para las estadísticas
  const [estadisticas, setEstadisticas] = useState({
    movimientosIntentados: 0,
    retrocesos: 0,
    tiempo: 0
  });

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
    setEstadisticas({
      movimientosIntentados: 0,
      retrocesos: 0,
      tiempo: 0
    });
  }

  // Paleta de colores pastel
  const pastelColors = {
    background: "#f8f4f9",      // lila muy claro
    header: "#b8a9c9",          // lila pastel
    headerText: "#6e4da2",      // lila oscuro para texto
    buttonPrimary: "#ffd4e8",   // rosa pastel
    buttonPrimaryHover: "#ffb3d9", // rosa pastel más intenso
    buttonSecondary: "#c9e4f7", // celeste pastel
    buttonSecondaryHover: "#b3d9f0", // celeste pastel más intenso
    buttonDanger: "#ffccd5",    // rosa claro pastel
    border: "#e0d5e8",          // lila pastel para bordes
    tableHeader: "#d4c4e2",     // lila pastel
    tableRow1: "#f0eaf6",       // lila muy claro
    tableRow2: "#e8f0fe",       // celeste muy claro
    text: "#5c4f6b",            // lila grisáceo para texto
    inputBorder: "#d4c4e2",     // lila pastel para inputs
  };

  return (
    <div style={{ 
      padding: 24, 
      fontFamily: "sans-serif",
      background: pastelColors.background,
      borderRadius: 15,
      maxWidth: 800,
      margin: "20px auto",
      boxShadow: "0 4px 15px rgba(180, 160, 200, 0.2)"
    }}>
      <h2 style={{ 
        color: pastelColors.headerText,
        marginBottom: 20,
        fontSize: 28,
        textAlign: "center",
        fontWeight: "600"
      }}>
        ♞ Knight's Tour ♞
      </h2>

      {/* Control de tamaño */}
      <div style={{ 
        marginBottom: 16, 
        display: "flex", 
        gap: 10, 
        alignItems: "center",
        background: "#ffffff",
        padding: "12px 16px",
        borderRadius: 10,
        border: `1px solid ${pastelColors.border}`
      }}>
        <label style={{ 
          color: pastelColors.text,
          fontWeight: "500"
        }}>
          Tamaño del tablero:
        </label>
        <input
          type="number" 
          min={4} 
          max={7} 
          value={n}
          onChange={e => handleTamano(e.target.value)}
          style={{ 
            width: 50,
            padding: "6px 8px",
            border: `2px solid ${pastelColors.inputBorder}`,
            borderRadius: 6,
            fontSize: 14,
            textAlign: "center",
            background: "#faf8fc",
            color: "#000000",  
            fontWeight: "600"
          }}
        />
        <span style={{ fontSize: 12, color: "#9b8eae" }}>(4 mín — 7 máx)</span>
      </div>

      {/* Controles */}
      <div style={{ 
        marginBottom: 16, 
        display: "flex", 
        gap: 10,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setModoObstaculo(m => !m)}
          style={{ 
            background: modoObstaculo ? "#ffb3c6" : pastelColors.buttonPrimary,
            padding: "10px 18px", 
            borderRadius: 8, 
            border: "none", 
            cursor: "pointer",
            fontWeight: "500",
            color: pastelColors.headerText,
            transition: "all 0.3s",
            boxShadow: "0 2px 4px rgba(200, 180, 210, 0.3)"
          }}
          onMouseEnter={(e) => e.target.style.background = modoObstaculo ? "#ff99b3" : pastelColors.buttonPrimaryHover}
          onMouseLeave={(e) => e.target.style.background = modoObstaculo ? "#ffb3c6" : pastelColors.buttonPrimary}
        >
          {modoObstaculo ? "Seleccionar obstáculo: ON" : "Seleccionar obstáculo: OFF"}
        </button>
        <button 
          onClick={handleVerificar} 
          style={{ 
            padding: "10px 18px", 
            borderRadius: 8, 
            border: "none", 
            cursor: "pointer",
            background: pastelColors.buttonSecondary,
            color: pastelColors.headerText,
            fontWeight: "500",
            transition: "all 0.3s",
            boxShadow: "0 2px 4px rgba(180, 200, 220, 0.3)"
          }}
          onMouseEnter={(e) => e.target.style.background = pastelColors.buttonSecondaryHover}
          onMouseLeave={(e) => e.target.style.background = pastelColors.buttonSecondary}
        >
            Verificar tablero
        </button>
        <button 
          onClick={handleReset} 
          style={{ 
            padding: "10px 18px", 
            borderRadius: 8, 
            border: "none", 
            cursor: "pointer",
            background: pastelColors.buttonDanger,
            color: pastelColors.headerText,
            fontWeight: "500",
            transition: "all 0.3s",
            boxShadow: "0 2px 4px rgba(220, 190, 200, 0.3)"
          }}
          onMouseEnter={(e) => e.target.style.background = "#ffb3c1"}
          onMouseLeave={(e) => e.target.style.background = pastelColors.buttonDanger}
        >
          Reiniciar
        </button>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <p style={{ 
          marginBottom: 16,
          padding: "10px 16px",
          background: "#ffffff",
          borderRadius: 8,
          border: `1px solid ${pastelColors.border}`,
          color: pastelColors.text
        }}>
          {mensaje}
        </p>
      )}

      {/* Tablero */}
      <div style={{ 
        display: "inline-grid", 
        gridTemplateColumns: `repeat(${n}, 56px)`, 
        gap: 2,
        background: "white",
        padding: 12,
        borderRadius: 10,
        boxShadow: `0 4px 12px rgba(180, 160, 210, 0.2)`
      }}>
        {tablero.map((fila, x) =>
          fila.map((valor, y) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCeldaClick(x, y)}
              style={{
                width: 56, height: 56,
                background: getColor(valor, false),
                border: "1px solid #ddd",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: valor >= 0 ? 16 : 12,
                fontWeight: "bold",
                cursor: modoObstaculo ? "pointer" : "default",
                userSelect: "none",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                if (modoObstaculo) {
                  e.target.style.transform = "scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              {valor === -2 ? "✕" : valor >= 0 ? valor : ""}
            </div>
          ))
        )}
      </div>

      {/* Estadísticas */}
      <div style={{
        marginTop: 24,
        maxWidth: `${n * 58}px`,
        border: `1px solid ${pastelColors.border}`,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "sans-serif",
        fontSize: 14,
        boxShadow: "0 4px 12px rgba(180, 160, 210, 0.15)"
      }}>
        {/* Encabezado */}
        <div style={{
          background: pastelColors.tableHeader,
          color: pastelColors.headerText,
          padding: "12px 20px",
          fontWeight: "600",
          fontSize: 16,
          letterSpacing: 1,
        }}>
         Estadísticas
        </div>

        {/* Filas */}
        {[
          { label: "Movimientos intentados", valor: estadisticas?.movimientosIntentados ?? "—" },
          { label: "Retrocesos",             valor: estadisticas?.retrocesos ?? "—" },
          { label: "Tiempo de ejecución",    valor: estadisticas?.tiempo ? `${estadisticas.tiempo} ms` : "—" },
        ].map(({ label, valor }, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: i % 2 === 0 ? pastelColors.tableRow1 : pastelColors.tableRow2,
            borderTop: `1px solid ${pastelColors.border}`,
            transition: "background 0.3s"
          }}>
            <span style={{ color: pastelColors.text }}>{label}</span>
            <span style={{ 
              fontWeight: "bold", 
              color: "#7b6b8e",
              background: "#ffffff80",
              padding: "2px 8px",
              borderRadius: 4
            }}>{valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
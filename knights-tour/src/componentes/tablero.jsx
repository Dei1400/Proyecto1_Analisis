import { useState, useEffect } from "react";
import {
  crearTablero,
  toggleObstaculo,
  verificarResoluble,
  movimientosValidos,
  iniciarRecorrido,
  validarPosicionInicial,
} from "../algoritmos/logicaInterfaz";

function getColor(valor, enRetroceso, esPosicionActual) {
  if (esPosicionActual) return "#f39c12";
  if (enRetroceso) return "#e74c3c";
  if (valor === -2) return "#555";
  if (valor === -1) return "#e9bcfe";
  return "#2ecc71";
}

export default function Board() {
  const [n, setN] = useState(5);
  const [tablero, setTablero] = useState(() => crearTablero(5));
  const [modoObstaculo, setModoObstaculo] = useState(false);
  const [modoSeleccionInicial, setModoSeleccionInicial] = useState(false);
  const [posicionInicial, setPosicionInicial] = useState({ x: 0, y: 0 });
  const [mensaje, setMensaje] = useState("");
  const [corriendo, setCorriendo] = useState(false);
  const [parametrosPrevios, setParametrosPrevios] = useState(null);
  const [animando, setAnimando] = useState(false);
  const [velocidadAnimacion, setVelocidadAnimacion] = useState(150);
  const [indiceHistorial, setIndiceHistorial] = useState(0);
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [tableroAnimado, setTableroAnimado] = useState(() => crearTablero(5));
  const [celdasEnRetroceso, setCeldasEnRetroceso] = useState(new Set());
  const [posicionActualCaballo, setPosicionActualCaballo] = useState({ x: 0, y: 0 });
  const [estadisticas, setEstadisticas] = useState({
    movimientosIntentados: 0,
    retrocesos: 0,
    tiempo: 0
  });
  const [solucionFinal, setSolucionFinal] = useState(null);
  const [mostrarSolucionFinal, setMostrarSolucionFinal] = useState(false);

  const activarModoObstaculo = () => {
    setModoObstaculo(true);
    if (modoSeleccionInicial) {
      setModoSeleccionInicial(false);
      setMensaje("Modo obstáculo activado");
    } else {
      setMensaje("Modo obstáculo activado");
    }
  };

  const desactivarModoObstaculo = () => {
    setModoObstaculo(false);
    setMensaje("Modo obstáculo desactivado");
  };

  const activarModoSeleccionInicial = () => {
    setModoSeleccionInicial(true);
    if (modoObstaculo) {
      setModoObstaculo(false);
      setMensaje("Modo selección inicial activado");
    } else {
      setMensaje("Selecciona una casilla para la posición inicial");
    }
  };

  const desactivarModoSeleccionInicial = () => {
    setModoSeleccionInicial(false);
    setMensaje("Modo selección inicial desactivado");
  };

  const toggleModoObstaculo = () => {
    if (modoObstaculo) desactivarModoObstaculo();
    else activarModoObstaculo();
  };

  const toggleModoSeleccionInicial = () => {
    if (modoSeleccionInicial) desactivarModoSeleccionInicial();
    else activarModoSeleccionInicial();
  };

  function handleTamano(nuevoN) {
    const valor = Math.min(7, Math.max(4, Number(nuevoN)));
    setN(valor);
    setTablero(crearTablero(valor));
    setTableroAnimado(crearTablero(valor));
    setPosicionInicial({ x: 0, y: 0 });
    setPosicionActualCaballo({ x: 0, y: 0 });
    setMensaje("");
    setParametrosPrevios(null);
    setAnimando(false);
    setMostrarSolucionFinal(false);
    setSolucionFinal(null);
    setIndiceHistorial(0);
    setHistorialCompleto([]);
    setModoObstaculo(false);
    setModoSeleccionInicial(false);
  }

  function handleCeldaClick(x, y) {
    if (corriendo || animando) return;

    if (modoObstaculo) {
      // No permitir obstáculo en la posición inicial
      if (x === posicionInicial.x && y === posicionInicial.y) {
        setMensaje("✗ No puedes poner un obstáculo en la posición inicial del caballo.");
        return;
      }
      const nuevo = toggleObstaculo(tablero, x, y);
      setTablero(nuevo);
      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
      setMensaje(`Obstáculo ${tablero[x][y] === -2 ? "eliminado" : "agregado"} en (${x}, ${y})`);
    } else if (modoSeleccionInicial) {
      if (tablero[x][y] === -2) {
        setMensaje("✗ No puedes colocar el caballo en un obstáculo.");
        return;
      }
      setPosicionInicial({ x, y });
      setPosicionActualCaballo({ x, y });
      setModoSeleccionInicial(false);
      setMensaje(`✓ Casilla inicial seleccionada: (${x}, ${y})`);
      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
    }
  }

  function handleVerificar() {
    const { posible, mensaje: msg } = verificarResoluble(
      tablero, posicionInicial.x, posicionInicial.y, movimientosValidos
    );
    setMensaje(posible ? "✓ El tablero es resoluble." : `✗ ${msg}`);
  }

  function handleMostrarAnimacionNormal() {
    if (!historialCompleto || historialCompleto.length === 0) {
      setMensaje("No hay una solución guardada. Primero ejecuta 'Resolver Tour'.");
      return;
    }
    setMostrarSolucionFinal(false);
    setAnimando(true);
    setVelocidadAnimacion(150);
    setIndiceHistorial(0);
    setTableroAnimado(parametrosPrevios?.tablero.map(fila => [...fila]) || crearTablero(n));
    setCeldasEnRetroceso(new Set());
    setPosicionActualCaballo(posicionInicial);
    setMensaje("Animando recorrido (velocidad normal)...");
  }

  function handleMostrarAnimacionRapida() {
    if (!historialCompleto || historialCompleto.length === 0) {
      setMensaje("No hay una solución guardada. Primero ejecuta 'Resolver Tour'.");
      return;
    }
    setMostrarSolucionFinal(false);
    setAnimando(true);
    setVelocidadAnimacion(30);
    setIndiceHistorial(0);
    setTableroAnimado(parametrosPrevios?.tablero.map(fila => [...fila]) || crearTablero(n));
    setCeldasEnRetroceso(new Set());
    setPosicionActualCaballo(posicionInicial);
    setMensaje("Animando recorrido (velocidad rápida)...");
  }

  useEffect(() => {
    if (!animando || historialCompleto.length === 0) return;

    const delay = setTimeout(() => {
      if (indiceHistorial < historialCompleto.length) {
        const paso = historialCompleto[indiceHistorial];
        const nuevoTablero = tableroAnimado.map(fila => [...fila]);
        const nuevasRetrocesos = new Set(celdasEnRetroceso);

        if (paso.tipo === "inicio") {
          nuevoTablero[paso.x][paso.y] = paso.paso;
          nuevasRetrocesos.delete(`${paso.x},${paso.y}`);
          setPosicionActualCaballo({ x: paso.x, y: paso.y });
        } else if (paso.tipo === "avance") {
          nuevoTablero[paso.x][paso.y] = paso.paso;
          nuevasRetrocesos.delete(`${paso.x},${paso.y}`);
          setPosicionActualCaballo({ x: paso.x, y: paso.y });
        } else if (paso.tipo === "retroceso") {
          nuevoTablero[paso.x][paso.y] = -1;
          nuevasRetrocesos.add(`${paso.x},${paso.y}`);
          setPosicionActualCaballo({ x: paso.x, y: paso.y });
          const tiempoRetroceso = velocidadAnimacion === 150 ? 600 : 120;
          setTimeout(() => {
            setCeldasEnRetroceso(prev => {
              const actualizado = new Set(prev);
              actualizado.delete(`${paso.x},${paso.y}`);
              return actualizado;
            });
          }, tiempoRetroceso);
        }

        setTableroAnimado(nuevoTablero);
        setCeldasEnRetroceso(nuevasRetrocesos);
        setIndiceHistorial(indiceHistorial + 1);
      } else {
        setAnimando(false);
        setCeldasEnRetroceso(new Set());
        const ultimoPaso = historialCompleto[historialCompleto.length - 1];
        const tieneSolucion = ultimoPaso?.tipo === "avance" &&
          historialCompleto.filter(p => p.tipo === "avance").length === contarCasillasLibres(tablero);
        setMensaje(tieneSolucion
          ? "✓ Animación completada - Solución encontrada"
          : "Animación completada - Sin solución completa"
        );
      }
    }, velocidadAnimacion);

    return () => clearTimeout(delay);
  }, [animando, indiceHistorial, historialCompleto, tableroAnimado, celdasEnRetroceso, tablero, velocidadAnimacion]);

  function handleResolver() {
    if (corriendo) return;

    const validacion = validarPosicionInicial(posicionInicial.x, posicionInicial.y, n);
    if (!validacion.valido) {
      setMensaje(`✗ ${validacion.mensaje}`);
      return;
    }

    setCorriendo(true);
    setMensaje("Resolviendo el recorrido...");

    const resultado = iniciarRecorrido(tablero, posicionInicial.x, posicionInicial.y);

    setParametrosPrevios({
      posicionInicial,
      tablero: tablero.map(fila => [...fila])
    });

    setHistorialCompleto(resultado.historial);
    setTablero(resultado.tablero);
    setEstadisticas(resultado.estadisticas);
    setSolucionFinal({
      tablero: resultado.tablero,
      posicionFinal: obtenerUltimaPosicion(resultado.historial)
    });
    setMostrarSolucionFinal(true);
    setPosicionActualCaballo(obtenerUltimaPosicion(resultado.historial));
    setCorriendo(false);
    setMensaje(resultado.posible
      ? "✓ Solución encontrada. Usa los botones de animación para ver el recorrido."
      : "✗ No se encontró solución. Usa los botones de animación para ver el intento."
    );
  }

  function contarCasillasLibres(tablero) {
    let total = 0;
    for (let x = 0; x < tablero.length; x++)
      for (let y = 0; y < tablero[0].length; y++)
        if (tablero[x][y] !== -2) total++;
    return total;
  }

  function obtenerUltimaPosicion(historial) {
    if (!historial || historial.length === 0) return posicionInicial;
    const ultimoMovimiento = historial[historial.length - 1];
    return { x: ultimoMovimiento.x, y: ultimoMovimiento.y };
  }

  function handleReset() {
    setTablero(crearTablero(n));
    setTableroAnimado(crearTablero(n));
    setPosicionInicial({ x: 0, y: 0 });
    setPosicionActualCaballo({ x: 0, y: 0 });
    setModoSeleccionInicial(false);
    setModoObstaculo(false);
    setMensaje("");
    setCorriendo(false);
    setAnimando(false);
    setMostrarSolucionFinal(false);
    setSolucionFinal(null);
    setParametrosPrevios(null);
    setIndiceHistorial(0);
    setHistorialCompleto([]);
    setEstadisticas({ movimientosIntentados: 0, retrocesos: 0, tiempo: 0 });
  }

  const pastelColors = {
    background: "#f8f4f9",
    headerText: "#6e4da2",
    buttonPrimary: "#ffd4e8",
    buttonSecondary: "#c9e4f7",
    buttonSecondaryHover: "#b3d9f0",
    buttonDanger: "#ffccd5",
    border: "#e0d5e8",
    tableHeader: "#d4c4e2",
    tableRow1: "#f0eaf6",
    tableRow2: "#e8f0fe",
    text: "#5c4f6b",
    inputBorder: "#d4c4e2",
  };

  const tableroAMostrar = animando
    ? tableroAnimado
    : (mostrarSolucionFinal && solucionFinal ? solucionFinal.tablero : tablero);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100vw",
      height: "100vh",
      background: pastelColors.background,
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        gap: 16,
        padding: 16,
        fontFamily: "sans-serif",
        background: pastelColors.background,
        borderRadius: 15,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
      }}>

        {/* Panel izquierdo */}
        <div style={{
          width: 250,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          maxHeight: "100%",
          paddingRight: 4,
        }}>
          <h2 style={{
            color: pastelColors.headerText,
            fontSize: 20,
            textAlign: "center",
            fontWeight: "600",
            margin: 0
          }}>
            ♞ Knight's Tour ♞
          </h2>

          <div style={{
            display: "flex", gap: 8, alignItems: "center",
            background: "#fff", padding: "6px 12px",
            borderRadius: 8, border: `1px solid ${pastelColors.border}`
          }}>
            <label style={{ color: pastelColors.text, fontWeight: "500", fontSize: 13 }}>
              Tamaño:
            </label>
            <input
              type="number" min={4} max={7} value={n}
              onChange={e => handleTamano(e.target.value)}
              style={{
                width: 46, padding: "4px 6px",
                border: `2px solid ${pastelColors.inputBorder}`,
                borderRadius: 6, fontSize: 13, textAlign: "center",
                background: "#faf8fc", color: "#000", fontWeight: "600"
              }}
            />
            <span style={{ fontSize: 11, color: "#9b8eae" }}>(4-7)</span>
          </div>

          <div style={{
            background: "#fff", padding: "5px 12px",
            borderRadius: 8, border: `1px solid ${pastelColors.border}`,
            color: pastelColors.text, fontWeight: "500", fontSize: 13
          }}>
            ♞ Inicio: ({posicionInicial.x}, {posicionInicial.y})
          </div>

          <div style={{
            background: "#fff", padding: "5px 12px",
            borderRadius: 8, border: `1px solid ${pastelColors.border}`,
            color: pastelColors.text, fontWeight: "500", fontSize: 13
          }}>
            ♞ Actual: ({posicionActualCaballo.x}, {posicionActualCaballo.y})
          </div>

          {/* Botones */}
          {[
            {
              label: modoObstaculo ? "Obstáculo: ON" : "Obstáculo: OFF",
              onClick: toggleModoObstaculo,
              disabled: corriendo || animando,
              bg: modoObstaculo ? "#ffb3c6" : pastelColors.buttonPrimary,
              color: pastelColors.headerText,
            },
            {
              label: modoSeleccionInicial ? "♞ Selec. inicio: ON" : "♘ Selec. inicio: OFF",
              onClick: toggleModoSeleccionInicial,
              disabled: corriendo || animando,
              bg: modoSeleccionInicial ? "#ec7cc0" : "#c594c7",
              color: "#000",
            },
            {
              label: "Verificar tablero",
              onClick: handleVerificar,
              disabled: false,
              bg: pastelColors.buttonSecondary,
              color: pastelColors.headerText,
            },
            {
              label: corriendo ? "Resolviendo..." : "Resolver Tour",
              onClick: handleResolver,
              disabled: corriendo,
              bg: "#a8d5ff",
              color: "#000",
            },
          ].map(({ label, onClick, disabled, bg, color }, i) => (
            <button key={i} onClick={onClick} disabled={disabled} style={{
              background: bg, padding: "7px 14px", borderRadius: 8,
              border: "none", cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: "500", fontSize: 13, color,
              opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
            }}>
              {label}
            </button>
          ))}

          <div style={{ display: "flex", gap: 8 }}>
            {[
              {
                label: animando && velocidadAnimacion === 150 ? "Animando..." : "▶ Normal",
                onClick: handleMostrarAnimacionNormal,
                bg: "#ffd966",
              },
              {
                label: animando && velocidadAnimacion === 30 ? "Animando..." : "⚡ Rápida",
                onClick: handleMostrarAnimacionRapida,
                bg: "#98d8ca",
              },
            ].map(({ label, onClick, bg }, i) => (
              <button key={i} onClick={onClick}
                disabled={animando || !historialCompleto || historialCompleto.length === 0}
                style={{
                  flex: 1, padding: "7px 8px", borderRadius: 8, border: "none",
                  cursor: (animando || !historialCompleto || historialCompleto.length === 0) ? "not-allowed" : "pointer",
                  background: bg, color: "#000", fontWeight: "500", fontSize: 13,
                  opacity: (animando || !historialCompleto || historialCompleto.length === 0) ? 0.6 : 1,
                }}>
                {label}
              </button>
            ))}
          </div>

          <button onClick={handleReset} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: pastelColors.buttonDanger, color: pastelColors.headerText,
            fontWeight: "500", fontSize: 13,
          }}>
            🔄 Reiniciar
          </button>

          {/* Estadísticas */}
          <div style={{
            border: `1px solid ${pastelColors.border}`,
            borderRadius: 10, overflow: "hidden", fontSize: 13,
          }}>
            <div style={{
              background: pastelColors.tableHeader, color: pastelColors.headerText,
              padding: "7px 14px", fontWeight: "600", fontSize: 13,
            }}>
              📊 Estadísticas
            </div>
            {[
              { label: "Mov. intentados", valor: estadisticas?.movimientosIntentados ?? "—" },
              { label: "Retrocesos", valor: estadisticas?.retrocesos ?? "—" },
              { label: "Tiempo", valor: estadisticas?.tiempo ? `${estadisticas.tiempo.toFixed(2)} ms` : "—" },
            ].map(({ label, valor }, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "7px 14px",
                background: i % 2 === 0 ? pastelColors.tableRow1 : pastelColors.tableRow2,
                borderTop: `1px solid ${pastelColors.border}`,
              }}>
                <span style={{ color: pastelColors.text }}>{label}</span>
                <span style={{
                  fontWeight: "bold", color: "#4a2580",
                  background: "#ffffff80", padding: "1px 6px", borderRadius: 4
                }}>{valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - tablero */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          overflow: "auto",       // ← scroll si el tablero es grande
          maxHeight: "100%",
          padding: 8,
        }}>
          {mensaje && (
            <div style={{
              padding: "8px 16px", background: "#fff",
              borderRadius: 8, border: `1px solid ${pastelColors.border}`,
              color: pastelColors.text, textAlign: "center",
              fontWeight: "500", fontSize: 13,
              // Altura fija para que no mueva el layout
              minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", maxWidth: 600, boxSizing: "border-box",
            }}>
              {mensaje}
            </div>
          )}

          {/* Espacio reservado cuando no hay mensaje para que el tablero no salte */}
          {!mensaje && (
            <div style={{ minHeight: 36 }} />
          )}

          <div style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${n}, 80px)`,
            gap: 2,
            background: "white",
            padding: 12,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(180, 160, 210, 0.2)",
            flexShrink: 0,
          }}>
            {tableroAMostrar.map((fila, x) =>
              fila.map((valor, y) => {
                const esPosicionActual = !animando && x === posicionActualCaballo.x && y === posicionActualCaballo.y;
                const enRetroceso = celdasEnRetroceso.has(`${x},${y}`);

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCeldaClick(x, y)}
                    style={{
                      width: 80, height: 80,
                      background: getColor(valor, enRetroceso, esPosicionActual),
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: esPosicionActual ? 36 : (valor >= 0 ? 18 : 12),
                      color: esPosicionActual ? "#fff" : (valor >= 0 ? "#3b1a6e" : "inherit"),
                      fontWeight: "bold",
                      cursor: (modoObstaculo || modoSeleccionInicial) && !corriendo && !animando ? "pointer" : "default",
                      userSelect: "none",
                      transition: "transform 0.15s, background 0.1s",
                    }}
                    onMouseEnter={e => {
                      if ((modoObstaculo || modoSeleccionInicial) && !corriendo && !animando)
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {esPosicionActual ? "♞" : (valor === -2 ? "🚫" : (valor >= 0 ? valor : ""))}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ fontSize: 12, color: pastelColors.text, textAlign: "center" }}>
            🟢 Verde = Visitado &nbsp;|&nbsp; 🔴 Rojo = Retroceso &nbsp;|&nbsp; 🟠 Naranja = Posición actual &nbsp;|&nbsp; 🚫 = Obstáculo
          </div>
        </div>
      </div>
    </div>
  );
}
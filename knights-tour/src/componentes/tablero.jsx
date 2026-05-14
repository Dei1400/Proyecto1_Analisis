import React, { useState, useEffect } from "react";
import {
  crearTablero,
  toggleObstaculo,
  verificarResoluble,
  movimientosValidos,
  iniciarRecorrido,
  validarPosicionInicial,
} from "../algoritmos/logicaInterfaz";

import { contarCaminosDP } from "../algoritmos/conteoCaminosDP";
import { iniciarRecorridoWarnsdorff } from "../algoritmos/warnsdorff";

function getColor(valor, enRetroceso, esPosicionActual, esDestino) {
  if (esPosicionActual) return "#f39c12";
  if (esDestino)        return "#74b9ff";
  if (enRetroceso)      return "#e74c3c";
  if (valor === -2)     return "#555";
  if (valor === -1)     return "#e9bcfe";
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
    podasAccesibilidad: 0,
    tiempo: 0
  });
  const [solucionFinal, setSolucionFinal] = useState(null);
  const [mostrarSolucionFinal, setMostrarSolucionFinal] = useState(false);
  const [modoAlgoritmo, setModoAlgoritmo] = useState("backtracking");
  const [resultadoEjecucion, setResultadoEjecucion] = useState(null);
  const [tableroResuelto, setTableroResuelto] = useState(false); // Nuevo estado

  // ── Modo conteo ──
  const [modoConteo, setModoConteo]               = useState(false);
  const [destinoConteo, setDestinoConteo]         = useState(null);
  const [kMovimientos, setKMovimientos]           = useState(3);
  const [resultadoConteo, setResultadoConteo]     = useState(null);
  const [seleccionandoDestino, setSeleccionandoDestino] = useState(false);

  // ─── Modos ────────────────────────────────────────────────────────
  const toggleModoObstaculo = () => {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para modificar el tablero");
      return;
    }
    if (modoObstaculo) {
      setModoObstaculo(false);
      setMensaje("Modo obstáculo desactivado");
    } else {
      setModoObstaculo(true);
      setModoSeleccionInicial(false);
      setSeleccionandoDestino(false);
      setMensaje("Modo obstáculo activado");
    }
  };

  const toggleModoSeleccionInicial = () => {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para modificar el tablero");
      return;
    }
    if (modoSeleccionInicial) {
      setModoSeleccionInicial(false);
      setMensaje("Modo selección inicial desactivado");
    } else {
      setModoSeleccionInicial(true);
      setModoObstaculo(false);
      setSeleccionandoDestino(false);
      setMensaje("Selecciona una casilla para la posición inicial");
    }
  };

  const activarBacktracking = () => {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para cambiar el algoritmo");
      return;
    }
    setModoAlgoritmo("backtracking");
    setMostrarSolucionFinal(false);
    setSolucionFinal(null);
    setResultadoEjecucion(null);
    setHistorialCompleto([]);
    setMensaje("Modo: Backtracking activado");
  };

  const activarWarnsdorff = () => {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para cambiar el algoritmo");
      return;
    }
    setModoAlgoritmo("warnsdorff");
    setMostrarSolucionFinal(false);
    setSolucionFinal(null);
    setResultadoEjecucion(null);
    setHistorialCompleto([]);
    setMensaje("Modo: Warnsdorff activado");
  };

  // ─── Tamaño (4x4 a 8x8) ──────────────────────────────────────────
  function handleTamano(nuevoN) {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para cambiar el tamaño");
      return;
    }
    const valor = Math.min(8, Math.max(4, Number(nuevoN)));
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
    setResultadoEjecucion(null);
    setIndiceHistorial(0);
    setHistorialCompleto([]);
    setModoObstaculo(false);
    setModoSeleccionInicial(false);
    setModoConteo(false);
    setDestinoConteo(null);
    setResultadoConteo(null);
    setSeleccionandoDestino(false);
    setTableroResuelto(false);
  }

  // ─── Click en celda ───────────────────────────────────────────────
  function handleCeldaClick(x, y) {
    if (corriendo || animando) return;
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para modificar el tablero");
      return;
    }

    if (modoObstaculo) {

      if (x === posicionInicial.x && y === posicionInicial.y) {
        setMensaje("✗ No puedes poner un obstáculo en la posición inicial del caballo.");
        return;
      }


      if (
        destinoConteo &&
        x === destinoConteo.x &&
        y === destinoConteo.y
      ) {
        setMensaje("✗ No puedes poner un obstáculo en la casilla destino B.");
        return;
      }

      const nuevo = toggleObstaculo(tablero, x, y);

      setTablero(nuevo);

      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
      setResultadoEjecucion(null);

      setMensaje(
        `Obstáculo ${tablero[x][y] === -2 ? "eliminado" : "agregado"} en (${x}, ${y})`
      );
    } else if (modoSeleccionInicial) {
      setPosicionInicial({ x, y });
      setPosicionActualCaballo({ x, y });
      setModoSeleccionInicial(false);
      setMensaje(`✓ Casilla inicial seleccionada: (${x}, ${y})`);
      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
      setResultadoEjecucion(null);
    } else if (seleccionandoDestino) {
      if (tablero[x][y] === -2) {
        setMensaje("✗ El destino no puede ser un obstáculo.");
        return;
      }
      setDestinoConteo({ x, y });
      setSeleccionandoDestino(false);
      setMensaje(`✓ Casilla destino seleccionada: (${x}, ${y})`);
    }
  }

  // ─── Animación ────────────────────────────────────────────────────
  function handleMostrarAnimacionNormal() {
    if (!historialCompleto || historialCompleto.length === 0) {
      setMensaje("No hay una solución guardada. Primero ejecuta 'Resolver'.");
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
      setMensaje("No hay una solución guardada. Primero ejecuta 'Resolver'.");
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
        setMensaje(
          resultadoEjecucion?.solucion
            ? "✓ Animación completada - Solución encontrada"
            : "Animación completada - Sin solución completa"
        );
      }
    }, velocidadAnimacion);

    return () => clearTimeout(delay);
  }, [animando, indiceHistorial, historialCompleto, tableroAnimado, celdasEnRetroceso, velocidadAnimacion, resultadoEjecucion]);

  // ─── Resolver ──────────────────────────────────────────────────────
  function handleResolver() {
    if (corriendo || tableroResuelto) return;

    const validacion = validarPosicionInicial(posicionInicial.x, posicionInicial.y, n);
    if (!validacion.valido) {
      setMensaje(`✗ ${validacion.mensaje}`);
      return;
    }

    setCorriendo(true);
    setMensaje(`Resolviendo con ${modoAlgoritmo === "warnsdorff" ? "Warnsdorff" : "Backtracking"}...`);

    setTimeout(() => {
      const resultado =
        modoAlgoritmo === "warnsdorff"
          ? iniciarRecorridoWarnsdorff(tablero, posicionInicial.x, posicionInicial.y)
          : iniciarRecorrido(tablero, posicionInicial.x, posicionInicial.y);

      setParametrosPrevios({
        posicionInicial,
        tablero: tablero.map(fila => [...fila])
      });

      setHistorialCompleto(resultado.historial);
      setTablero(resultado.tablero);
      setEstadisticas(resultado.estadisticas);
      setResultadoEjecucion({
        solucion: resultado.posible,
        mensaje: resultado.mensaje,
        tablero: resultado.tablero,
        mayorPasoAlcanzado: resultado.mayorPasoAlcanzado || 0,
        totalCasillas: resultado.totalCasillas || 0
      });
      setSolucionFinal({
        tablero: resultado.tablero,
        posicionFinal: obtenerUltimaPosicion(resultado.historial)
      });
      setMostrarSolucionFinal(true);
      setPosicionActualCaballo(obtenerUltimaPosicion(resultado.historial));
      setCorriendo(false);
      setTableroResuelto(true); // Marcar que el tablero ya fue resuelto
      setMensaje(
        resultado.posible
          ? `✓ Solución encontrada (${modoAlgoritmo === "warnsdorff" ? "Warnsdorff" : "Backtracking"}). Usa los botones de animación para ver el recorrido.`
          : `✗ No se encontró solución. Mejor recorrido: ${resultado.mayorPasoAlcanzado || 0} de ${resultado.totalCasillas || 0} pasos.`
      );
    }, 100);
  }

  // ─── Conteo DP ────────────────────────────────────────────────────
  function handleContarCaminos() {
    if (tableroResuelto) {
      setMensaje("Primero presiona 'Reiniciar' para contar caminos");
      return;
    }
    if (!destinoConteo) {
      setMensaje("✗ Selecciona una casilla destino B primero.");
      return;
    }
    if (kMovimientos < 1) {
      setMensaje("✗ K debe ser mayor a 0.");
      return;
    }
    const resultado = contarCaminosDP(
      tablero,
      posicionInicial.x, posicionInicial.y,
      destinoConteo.x,   destinoConteo.y,
      kMovimientos
    );
    setResultadoConteo(resultado);
    setMensaje(
      `Caminos de A(${posicionInicial.x},${posicionInicial.y}) → B(${destinoConteo.x},${destinoConteo.y}) en ${kMovimientos} movimientos: ${resultado}`
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  function contarCasillasLibres(t) {
    let total = 0;
    for (let x = 0; x < t.length; x++)
      for (let y = 0; y < t[0].length; y++)
        if (t[x][y] !== -2) total++;
    return total;
  }

  function obtenerUltimaPosicion(historial) {
    if (!historial || historial.length === 0) return posicionInicial;
    const ultimo = historial[historial.length - 1];
    return { x: ultimo.x, y: ultimo.y };
  }

  // ─── Reset ────────────────────────────────────────────────────────
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
    setResultadoEjecucion(null);
    setParametrosPrevios(null);
    setIndiceHistorial(0);
    setHistorialCompleto([]);
    setEstadisticas({ movimientosIntentados: 0, retrocesos: 0, podasAccesibilidad: 0, tiempo: 0 });
    setModoConteo(false);
    setDestinoConteo(null);
    setKMovimientos(3);
    setResultadoConteo(null);
    setSeleccionandoDestino(false);
    setTableroResuelto(false); // Resetear el estado de resuelto
  }

  const pastelColors = {
    background: "#f8f4f9",
    headerText: "#6e4da2",
    buttonPrimary: "#ffd4e8",
    buttonSecondary: "#c9e4f7",
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
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "100vw", height: "100vh",
      background: pastelColors.background,
      boxSizing: "border-box", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", gap: 16, padding: 16,
        fontFamily: "sans-serif", background: pastelColors.background,
        borderRadius: 15, width: "100%", height: "100%",
        boxSizing: "border-box", alignItems: "center", justifyContent: "center",
      }}>

        {/* ══════════════ Panel izquierdo ══════════════ */}
        <div style={{
          width: 250, flexShrink: 0, display: "flex", flexDirection: "column",
          gap: 8, overflowY: "auto", maxHeight: "100%", paddingRight: 4,
        }}>
          <h2 style={{
            color: pastelColors.headerText, fontSize: 20,
            textAlign: "center", fontWeight: "600", margin: 0,
          }}>
            ♞ Knight's Tour ♞
          </h2>

          {/* Tamaño */}
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
            background: "#fff", padding: "6px 12px",
            borderRadius: 8, border: `1px solid ${pastelColors.border}`,
          }}>
            <label style={{ color: pastelColors.text, fontWeight: "500", fontSize: 13 }}>Tamaño:</label>
            <input
              type="number" min={4} max={8} value={n}
              onChange={e => handleTamano(e.target.value)}
              disabled={tableroResuelto}
              style={{
                width: 46, padding: "4px 6px",
                border: `2px solid ${pastelColors.inputBorder}`,
                borderRadius: 6, fontSize: 13, textAlign: "center",
                background: tableroResuelto ? "#e0e0e0" : "#faf8fc", 
                color: tableroResuelto ? "#999" : "#000", 
                fontWeight: "600",
                cursor: tableroResuelto ? "not-allowed" : "text",
              }}
            />
            <span style={{ fontSize: 11, color: "#9b8eae" }}>(4-8)</span>
          </div>

          {/* Info posiciones */}
          {[
            `♞ Inicio A: (${posicionInicial.x}, ${posicionInicial.y})`,
            `♞ Actual: (${posicionActualCaballo.x}, ${posicionActualCaballo.y})`,
          ].map((txt, i) => (
            <div key={i} style={{
              background: "#fff", padding: "5px 12px",
              borderRadius: 8, border: `1px solid ${pastelColors.border}`,
              color: pastelColors.text, fontWeight: "500", fontSize: 13,
            }}>
              {txt}
            </div>
          ))}

          {/* Obstáculo + Selección inicial */}
          {[
            {
              label: modoObstaculo ? "Obstáculo: ON" : "Obstáculo: OFF",
              onClick: toggleModoObstaculo,
              disabled: corriendo || animando || tableroResuelto,
              bg: modoObstaculo ? "#ffb3c6" : pastelColors.buttonPrimary,
              color: pastelColors.headerText,
            },
            {
              label: modoSeleccionInicial ? "♞ Selec. inicio: ON" : "♘ Selec. inicio: OFF",
              onClick: toggleModoSeleccionInicial,
              disabled: corriendo || animando || tableroResuelto,
              bg: modoSeleccionInicial ? "#ec7cc0" : "#c594c7",
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

          {/* Botón Resolver */}
          <button
            onClick={handleResolver}
            disabled={corriendo || animando || tableroResuelto}
            style={{
              background: tableroResuelto ? "#ccc" : "#a8d5ff",
              padding: "7px 14px", borderRadius: 8,
              border: "none", cursor: (corriendo || animando || tableroResuelto) ? "not-allowed" : "pointer",
              fontWeight: "600", fontSize: 13, color: tableroResuelto ? "#666" : "#000",
              opacity: (corriendo || animando || tableroResuelto) ? 0.5 : 1, 
              transition: "all 0.2s",
            }}
          >
            {corriendo
              ? "Resolviendo..."
              : tableroResuelto 
                ? "Tablero ya resuelto" 
                : `Resolver (${modoAlgoritmo === "warnsdorff" ? "Warnsdorff" : "Backtracking"})`}
          </button>

          {/* Animación - Siempre habilitada si hay historial */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: animando && velocidadAnimacion === 150 ? "Animando..." : "▶ Normal", onClick: handleMostrarAnimacionNormal, bg: "#ffd966" },
              { label: animando && velocidadAnimacion === 30  ? "Animando..." : "⚡ Rápida", onClick: handleMostrarAnimacionRapida, bg: "#98d8ca" },
            ].map(({ label, onClick, bg }, i) => {
              const dis = animando || !historialCompleto || historialCompleto.length === 0;
              return (
                <button key={i} onClick={onClick} disabled={dis} style={{
                  flex: 1, padding: "7px 8px", borderRadius: 8, border: "none",
                  cursor: dis ? "not-allowed" : "pointer",
                  background: bg, color: "#000", fontWeight: "500", fontSize: 13,
                  opacity: dis ? 0.6 : 1,
                }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Reset - Siempre habilitado */}
          <button onClick={handleReset} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: pastelColors.buttonDanger, color: pastelColors.headerText,
            fontWeight: "500", fontSize: 13,
          }}>
            🔄 Reiniciar
          </button>
        </div>

        {/* ══════════════ Panel central — tablero ══════════════ */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 12, overflow: "auto", maxHeight: "100%", padding: 8,
        }}>
          {/* Mensaje */}
          <div style={{
            minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", maxWidth: 600, boxSizing: "border-box",
          }}>
            {mensaje && (
              <div style={{
                padding: "8px 16px", background: "#fff",
                borderRadius: 8, border: `1px solid ${pastelColors.border}`,
                color: pastelColors.text, textAlign: "center",
                fontWeight: "500", fontSize: 13, width: "100%",
              }}>
                {mensaje}
              </div>
            )}
          </div>

          {/* Tablero */}
          <div style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${n}, ${Math.min(80, 600 / n)}px)`,
            gap: 2, background: "white", padding: 12,
            borderRadius: 10, boxShadow: "0 4px 12px rgba(180,160,210,0.2)",
            flexShrink: 0,
          }}>
            {tableroAMostrar.map((fila, x) =>
              fila.map((valor, y) => {
                const esPosicionActual = !animando && x === posicionActualCaballo.x && y === posicionActualCaballo.y;
                const esDestino = modoConteo && destinoConteo && x === destinoConteo.x && y === destinoConteo.y;
                const enRetroceso = celdasEnRetroceso.has(`${x},${y}`);

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCeldaClick(x, y)}
                    style={{
                      width: Math.min(80, 600 / n), height: Math.min(80, 600 / n),
                      background: getColor(valor, enRetroceso, esPosicionActual, esDestino),
                      border: "1px solid #ddd", borderRadius: 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: esPosicionActual ? Math.min(36, 600 / n / 2) : (valor >= 0 ? Math.min(18, 600 / n / 4) : 12),
                      color: esPosicionActual ? "#fff" : (valor >= 0 ? "#3b1a6e" : "inherit"),
                      fontWeight: "bold",
                      cursor: (modoObstaculo || modoSeleccionInicial || seleccionandoDestino) && !corriendo && !animando && !tableroResuelto
                        ? "pointer" : "default",
                      userSelect: "none",
                      transition: "transform 0.15s, background 0.1s",
                    }}
                    onMouseEnter={e => {
                      if ((modoObstaculo || modoSeleccionInicial || seleccionandoDestino) && !corriendo && !animando && !tableroResuelto)
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    {esPosicionActual ? "♞"
                      : esDestino        ? "B"
                      : valor === -2     ? "🚫"
                      : valor >= 0       ? valor
                      : ""}
                  </div>
                );
              })
            )}
          </div>

          {/* Leyenda */}
          <div style={{ fontSize: 12, color: pastelColors.text, textAlign: "center" }}>
            🟢 Verde = Visitado &nbsp;|&nbsp; 🔴 Rojo = Retroceso &nbsp;|&nbsp; 🟠 Naranja = Posición actual &nbsp;|&nbsp; 🔵 Azul = Destino B &nbsp;|&nbsp; 🚫 = Obstáculo
          </div>
        </div>

        {/* ══════════════ Panel derecho — Algoritmo y Resultado ══════════════ */}
        <div style={{
          width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
          gap: 8, overflowY: "auto", maxHeight: "100%", paddingLeft: 4,
        }}>
          <h2 style={{
            color: pastelColors.headerText, fontSize: 20,
            textAlign: "center", fontWeight: "600", margin: 0,
          }}>
             Algoritmo
          </h2>

          {/* Toggle Backtracking */}
          <button
            onClick={activarBacktracking}
            disabled={corriendo || animando || tableroResuelto}
            style={{
              padding: "10px 14px", borderRadius: 8, border: "2px solid",
              borderColor: modoAlgoritmo === "backtracking" ? "#6e4da2" : pastelColors.border,
              cursor: (corriendo || animando || tableroResuelto) ? "not-allowed" : "pointer",
              background: modoAlgoritmo === "backtracking" ? "#d8c8f5" : "#fff",
              color: (corriendo || animando || tableroResuelto) ? "#999" : (modoAlgoritmo === "backtracking" ? "#4a2580" : pastelColors.text),
              fontWeight: "600", fontSize: 13,
              opacity: (corriendo || animando || tableroResuelto) ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {modoAlgoritmo === "backtracking" ? "✅" : "⬜"} Resolver Backtracking
          </button>

          {/* Toggle Warnsdorff */}
          <button
            onClick={activarWarnsdorff}
            disabled={corriendo || animando || tableroResuelto}
            style={{
              padding: "10px 14px", borderRadius: 8, border: "2px solid",
              borderColor: modoAlgoritmo === "warnsdorff" ? "#00b894" : pastelColors.border,
              cursor: (corriendo || animando || tableroResuelto) ? "not-allowed" : "pointer",
              background: modoAlgoritmo === "warnsdorff" ? "#c8f5e8" : "#fff",
              color: (corriendo || animando || tableroResuelto) ? "#999" : (modoAlgoritmo === "warnsdorff" ? "#006b4f" : pastelColors.text),
              fontWeight: "600", fontSize: 13,
              opacity: (corriendo || animando || tableroResuelto) ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {modoAlgoritmo === "warnsdorff" ? "✅" : "⬜"} Resolver Warnsdorff
          </button>

          {/* Indicador de modo activo */}
          <div style={{
            background: modoAlgoritmo === "warnsdorff" ? "#c8f5e8" : "#d8c8f5",
            borderRadius: 8, padding: "6px 12px", textAlign: "center",
            fontSize: 12, color: modoAlgoritmo === "warnsdorff" ? "#006b4f" : "#4a2580",
            fontWeight: "500", border: `1px solid ${pastelColors.border}`,
          }}>
            Activo: <strong>{modoAlgoritmo === "warnsdorff" ? "Warnsdorff" : "Backtracking"}</strong>
          </div>

          {/* ═══════ RESULTADO DE LA EJECUCIÓN ═══════ */}
          {resultadoEjecucion && (
            <>
              <hr style={{ border: "none", borderTop: `1px solid ${pastelColors.border}`, margin: "4px 0" }} />
              <h2 style={{
                color: resultadoEjecucion.solucion ? "#2ecc71" : "#e74c3c",
                fontSize: 18, textAlign: "center", fontWeight: "600", margin: 0,
              }}>
                {resultadoEjecucion.solucion ? "✅ SOLUCIÓN ENCONTRADA" : "❌ SIN SOLUCIÓN"}
              </h2>
      
            </>
          )}

          {/* Estadísticas */}
          <div style={{ border: `1px solid ${pastelColors.border}`, borderRadius: 10, overflow: "hidden", fontSize: 13, marginTop: 8 }}>
            <div style={{
              background: pastelColors.tableHeader, color: pastelColors.headerText,
              padding: "7px 14px", fontWeight: "600", fontSize: 13,
            }}>
              Estadísticas
            </div>
            {[
              { label: "Mov. intentados", valor: estadisticas?.movimientosIntentados ?? "—" },
              { label: "Retrocesos",      valor: estadisticas?.retrocesos ?? "—" },
              { label: "Podas accesib.", valor: estadisticas?.podasAccesibilidad ?? "—" },
              { label: "Tiempo",          valor: estadisticas?.tiempo ? `${Number(estadisticas.tiempo).toFixed(2)} ms` : "—" },
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
                  background: "#ffffff80", padding: "1px 6px", borderRadius: 4,
                }}>{valor}</span>
              </div>
            ))}
          </div>

          {/* Separador */}
          <hr style={{ border: "none", borderTop: `1px solid ${pastelColors.border}`, margin: "4px 0" }} />

          {/* ── Conteo de caminos DP ── */}
          <h2 style={{
            color: pastelColors.headerText, fontSize: 16,
            textAlign: "center", fontWeight: "600", margin: 0,
          }}>
             Conteo de Caminos
          </h2>

          <button
            onClick={() => { setModoConteo(m => !m); setResultadoConteo(null); }}
            disabled={corriendo || animando || tableroResuelto}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none",
              cursor: (corriendo || animando || tableroResuelto) ? "not-allowed" : "pointer",
              background: modoConteo ? "#a29bfe" : "#dfe6e9",
              color: (corriendo || animando || tableroResuelto) ? "#999" : "#000", 
              fontWeight: "500", fontSize: 13,
              opacity: (corriendo || animando || tableroResuelto) ? 0.5 : 1,
            }}
          >
            {modoConteo ? "Conteo DP: ON" : "Conteo DP: OFF"}
          </button>

          {modoConteo && (
            <div style={{
              background: "#fff", borderRadius: 8,
              border: `1px solid ${pastelColors.border}`,
              padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{
                background: pastelColors.tableRow1, borderRadius: 6,
                padding: "5px 10px", fontSize: 12, color: pastelColors.text,
              }}>
                <strong>A</strong> (inicio) = ({posicionInicial.x}, {posicionInicial.y})
              </div>

              <div style={{
                background: destinoConteo ? "#e0f7fa" : pastelColors.tableRow2,
                borderRadius: 6, padding: "5px 10px", fontSize: 12,
                color: destinoConteo ? "#006064" : pastelColors.text,
              }}>
                <strong>B</strong> (destino) = {destinoConteo
                  ? `(${destinoConteo.x}, ${destinoConteo.y})`
                  : "sin seleccionar"}
              </div>

          <button
            onClick={() => {
              setSeleccionandoDestino(s => !s);
              setModoObstaculo(false);
            }}
            disabled={tableroResuelto}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "none",
              cursor: tableroResuelto ? "not-allowed" : "pointer",
              background: seleccionandoDestino ? "#fd79a8" : "#c870ff",
              fontSize: 12,
              fontWeight: "500",
              opacity: tableroResuelto ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {seleccionandoDestino ? "Haz clic en el tablero..." : "Seleccionar destino B"}
          </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 12, color: pastelColors.text, whiteSpace: "nowrap" }}>
                  K movimientos:
                </label>
                <input
                  type="number" min={1} max={30} value={kMovimientos}
                  onChange={e => setKMovimientos(Number(e.target.value))}
                  disabled={tableroResuelto}
                  style={{
                    width: 50, padding: "3px 6px",
                    border: `1px solid ${pastelColors.inputBorder}`,
                    borderRadius: 6, fontSize: 12, textAlign: "center",
                    background: tableroResuelto ? "#562661" : "#562661",
                    cursor: tableroResuelto ? "not-allowed" : "text",
                  }}
                />
              </div>

              <button
                onClick={handleContarCaminos}
                disabled={tableroResuelto}
                style={{
                  padding: "6px 10px", borderRadius: 6, border: "none", cursor: tableroResuelto ? "not-allowed" : "pointer",
                  background: tableroResuelto ? "#ccc" : "#55efc4", 
                  fontSize: 12, fontWeight: "600",
                  opacity: tableroResuelto ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                Calcular caminos
              </button>

              {resultadoConteo !== null && (
                <div style={{
                  background: "#f0fff4", borderRadius: 6, padding: "8px 10px",
                  fontSize: 13, fontWeight: "bold", color: "#2d6a4f",
                  textAlign: "center", border: "1px solid #b7e4c7",
                }}>
                  <div style={{ fontSize: 11, fontWeight: "normal", marginBottom: 2 }}>
                    A({posicionInicial.x},{posicionInicial.y}) → B({destinoConteo?.x},{destinoConteo?.y}) en {kMovimientos} mov.
                  </div>
                  Caminos: {resultadoConteo}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
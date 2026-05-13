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
  if (esPosicionActual) return "#f39c12";     // naranja para posición actual del caballo
  if (enRetroceso) return "#e74c3c";          // retroceso (rojo)
  if (valor === -2) return "#555";            // obstáculo
  if (valor === -1) return "#e9bcfe";         // sin visitar
  return "#2ecc71";                           // avance válido (verde)
}

export default function Board() {
  const [n, setN] = useState(5);
  const [tablero, setTablero] = useState(() => crearTablero(5));
  const [modoObstaculo, setModoObstaculo] = useState(false);
  const [modoSeleccionInicial, setModoSeleccionInicial] = useState(false);
  const [posicionInicial, setPosicionInicial] = useState({ x: 0, y: 0 });
  const [mensaje, setMensaje] = useState("");
  const [corriendo, setCorriendo] = useState(false);
  
  // Estado para parámetros previos (para reintentos)
  const [parametrosPrevios, setParametrosPrevios] = useState(null);
  
  // Estado para animación paso a paso
  const [animando, setAnimando] = useState(false);
  const [indiceHistorial, setIndiceHistorial] = useState(0);
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [tableroAnimado, setTableroAnimado] = useState(() => crearTablero(5));
  const [celdasEnRetroceso, setCeldasEnRetroceso] = useState(new Set());
  const [posicionActualCaballo, setPosicionActualCaballo] = useState({ x: 0, y: 0 });
  
  // Estado para las estadísticas
  const [estadisticas, setEstadisticas] = useState({
    movimientosIntentados: 0,
    retrocesos: 0,
    tiempo: 0
  });

  // Estado para la solución final
  const [solucionFinal, setSolucionFinal] = useState(null);
  const [mostrarSolucionFinal, setMostrarSolucionFinal] = useState(false);

  // Función para activar modo obstáculo (desactiva modo selección inicial)
  const activarModoObstaculo = () => {
    setModoObstaculo(true);
    if (modoSeleccionInicial) {
      setModoSeleccionInicial(false);
      setMensaje("Modo obstáculo activado - Modo selección inicial desactivado");
    } else {
      setMensaje("Modo obstáculo activado");
    }
  };

  // Función para desactivar modo obstáculo
  const desactivarModoObstaculo = () => {
    setModoObstaculo(false);
    setMensaje("Modo obstáculo desactivado");
  };

  // Función para activar modo selección inicial (desactiva modo obstáculo)
  const activarModoSeleccionInicial = () => {
    setModoSeleccionInicial(true);
    if (modoObstaculo) {
      setModoObstaculo(false);
      setMensaje("Modo selección inicial activado - Modo obstáculo desactivado");
    } else {
      setMensaje("Modo selección inicial activado - Haz clic en una casilla para seleccionar la posición inicial");
    }
  };

  // Función para desactivar modo selección inicial
  const desactivarModoSeleccionInicial = () => {
    setModoSeleccionInicial(false);
    setMensaje("Modo selección inicial desactivado");
  };

  // Toggle modo obstáculo con validación
  const toggleModoObstaculo = () => {
    if (modoObstaculo) {
      desactivarModoObstaculo();
    } else {
      activarModoObstaculo();
    }
  };

  // Toggle modo selección inicial con validación
  const toggleModoSeleccionInicial = () => {
    if (modoSeleccionInicial) {
      desactivarModoSeleccionInicial();
    } else {
      activarModoSeleccionInicial();
    }
  };

  // Cambia el tamaño del tablero
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

  // Click en celda: pone/quita obstáculo o selecciona casilla inicial
  function handleCeldaClick(x, y) {
    if (corriendo || animando) return;
    
    if (modoObstaculo) {
      const nuevo = toggleObstaculo(tablero, x, y);
      setTablero(nuevo);
      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
      setMensaje(`Obstáculo ${tablero[x][y] === -2 ? 'eliminado' : 'agregado'} en (${x}, ${y})`);
    } else if (modoSeleccionInicial) {
      setPosicionInicial({ x, y });
      setPosicionActualCaballo({ x, y });
      setModoSeleccionInicial(false);
      setMensaje(`✓ Casilla inicial seleccionada: (${x}, ${y})`);
      setMostrarSolucionFinal(false);
      setSolucionFinal(null);
    }
  }

  // Verifica si el tablero es resoluble antes de correr el algoritmo
  function handleVerificar() {
    const { posible, mensaje: msg } = verificarResoluble(
      tablero, posicionInicial.x, posicionInicial.y, movimientosValidos
    );
    setMensaje(posible ? "✓ El tablero parece resoluble." : `✗ ${msg}`);
  }

  // Mostrar animación
  function handleMostrarAnimacion() {
    if (!historialCompleto || historialCompleto.length === 0) {
      setMensaje("No hay una solución guardada. Primero ejecuta 'Resolver Tour'.");
      return;
    }
    
    setMostrarSolucionFinal(false);
    setAnimando(true);
    setIndiceHistorial(0);
    setTableroAnimado(parametrosPrevios?.tablero.map(fila => [...fila]) || crearTablero(n));
    setCeldasEnRetroceso(new Set());
    setPosicionActualCaballo(posicionInicial);
    setMensaje("Animando recorrido...");
  }

  // Effect para animar el historial paso a paso
  useEffect(() => {
    if (!animando || historialCompleto.length === 0) return;

    const delay = setTimeout(() => {
      if (indiceHistorial < historialCompleto.length) {
        const paso = historialCompleto[indiceHistorial];
        const nuevoTablero = tableroAnimado.map(fila => [...fila]);
        const nuevasRetrocesos = new Set(celdasEnRetroceso);

        // Aplicar cambio según tipo de movimiento
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
          
          setTimeout(() => {
            setCeldasEnRetroceso(prev => {
              const actualizado = new Set(prev);
              actualizado.delete(`${paso.x},${paso.y}`);
              return actualizado;
            });
          }, 600);
        }

        setTableroAnimado(nuevoTablero);
        setCeldasEnRetroceso(nuevasRetrocesos);
        setIndiceHistorial(indiceHistorial + 1);
      } else {
        // Animación terminada
        setAnimando(false);
        setCeldasEnRetroceso(new Set());
        
        const ultimoPaso = historialCompleto[historialCompleto.length - 1];
        const tieneSolucion = ultimoPaso?.tipo === "avance" && 
                             historialCompleto.filter(p => p.tipo === "avance").length === contarCasillasLibres(tablero);
        
        if (tieneSolucion) {
          setMensaje("✓ Animación completada - Solución encontrada");
        } else {
          setMensaje("✗ Animación completada - Sin solución (última posición del caballo mostrada)");
        }
      }
    }, 150); // Velocidad media

    return () => clearTimeout(delay);
  }, [animando, indiceHistorial, historialCompleto, tableroAnimado, celdasEnRetroceso, tablero]);

  // Ejecuta el algoritmo
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
    
    // Guardar solución final
    setSolucionFinal({
      tablero: resultado.tablero,
      posicionFinal: obtenerUltimaPosicion(resultado.historial)
    });
    
    setMostrarSolucionFinal(true);
    setPosicionActualCaballo(obtenerUltimaPosicion(resultado.historial));
    
    setCorriendo(false);
    
    setMensaje(resultado.posible 
      ? "✓ Solución encontrada. Presiona 'Mostrar Animación' para ver el recorrido." 
      : "✗ No se encontró solución. Presiona 'Mostrar Animación' para ver el intento.");
  }

  // Función auxiliar para contar casillas libres
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

  // Obtener última posición del caballo del historial
  function obtenerUltimaPosicion(historial) {
    if (!historial || historial.length === 0) return posicionInicial;
    const ultimoMovimiento = historial[historial.length - 1];
    return { x: ultimoMovimiento.x, y: ultimoMovimiento.y };
  }

  // Reinicia el tablero
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
    setEstadisticas({
      movimientosIntentados: 0,
      retrocesos: 0,
      tiempo: 0
    });
  }

  // Paleta de colores pastel
  const pastelColors = {
    background: "#f8f4f9",
    header: "#b8a9c9",
    headerText: "#6e4da2",
    buttonPrimary: "#ffd4e8",
    buttonPrimaryHover: "#ffb3d9",
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

  // Determinar qué tablero mostrar
  const tableroAMostrar = animando ? tableroAnimado : (mostrarSolucionFinal && solucionFinal ? solucionFinal.tablero : tablero);

  return (
    <div style={{ 
      display: "flex",
      gap: 30,
      padding: 24, 
      fontFamily: "sans-serif",
      background: pastelColors.background,
      borderRadius: 15,
      maxWidth: 1200,
      margin: "20px auto",
      boxShadow: "0 4px 15px rgba(180, 160, 200, 0.2)"
    }}>
      {/* Panel izquierdo - Controles y estadísticas */}
      <div style={{ 
        flex: 1,
        minWidth: 280,
        display: "flex",
        flexDirection: "column",
        gap: 20
      }}>
        <h2 style={{ 
          color: pastelColors.headerText,
          fontSize: 28,
          textAlign: "center",
          fontWeight: "600",
          margin: 0
        }}>
          ♞ Knight's Tour ♞
        </h2>

        {/* Control de tamaño */}
        <div style={{ 
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
          <span style={{ fontSize: 12, color: "#9b8eae" }}>(4-7)</span>
        </div>

        {/* Información de casilla inicial */}
        <div style={{ 
          display: "flex", 
          gap: 10, 
          alignItems: "center",
          background: "#ffffff",
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${pastelColors.border}`
        }}>
          <span style={{ 
            color: pastelColors.text,
            fontWeight: "500"
          }}>
            ♞ Casilla inicial: ({posicionInicial.x}, {posicionInicial.y})
          </span>
        </div>

        {/* Información de posición actual */}
        <div style={{ 
          display: "flex", 
          gap: 10, 
          alignItems: "center",
          background: "#ffffff",
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${pastelColors.border}`
        }}>
          <span style={{ 
            color: pastelColors.text,
            fontWeight: "500"
          }}>
           ♞ Posición actual: ({posicionActualCaballo.x}, {posicionActualCaballo.y})
          </span>
        </div>

        {/* Controles */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: 10
        }}>
          <button
            onClick={toggleModoObstaculo}
            disabled={corriendo || animando}
            style={{ 
              background: modoObstaculo ? "#ffb3c6" : pastelColors.buttonPrimary,
              padding: "10px 18px", 
              borderRadius: 8, 
              border: "none", 
              cursor: corriendo || animando ? "not-allowed" : "pointer",
              fontWeight: "500",
              color: pastelColors.headerText,
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(200, 180, 210, 0.3)",
              opacity: corriendo || animando ? 0.5 : 1
            }}
          >
            {modoObstaculo ? "Modo obstáculo: ON" : "Modo obstáculo: OFF"}
          </button>
          
          <button
            onClick={toggleModoSeleccionInicial}
            disabled={corriendo || animando}
            style={{ 
              background: modoSeleccionInicial ? "#ec7cc0" : "#c594c7",
              padding: "10px 18px", 
              borderRadius: 8, 
              border: "none", 
              cursor: corriendo || animando ? "not-allowed" : "pointer",
              fontWeight: "500",
              color: "#000",
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(255, 235, 59, 0.3)",
              opacity: corriendo || animando ? 0.5 : 1
            }}
          >
            {modoSeleccionInicial ? "♞ Seleccionar inicio: ON" : "♘ Seleccionar inicio: OFF"}
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
            onClick={handleResolver} 
            disabled={corriendo}
            style={{ 
              padding: "10px 18px", 
              borderRadius: 8, 
              border: "none", 
              cursor: corriendo ? "not-allowed" : "pointer",
              background: "#a8d5ff",
              color: "#000",
              fontWeight: "500",
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(140, 170, 210, 0.3)",
              opacity: corriendo ? 0.6 : 1
            }}
          >
            {corriendo ? "Resolviendo..." : "Resolver Tour"}
          </button>
          
          <button 
            onClick={handleMostrarAnimacion}
            disabled={animando || !historialCompleto || historialCompleto.length === 0}
            style={{ 
              padding: "10px 18px", 
              borderRadius: 8, 
              border: "none", 
              cursor: (animando || !historialCompleto || historialCompleto.length === 0) ? "not-allowed" : "pointer",
              background: "#ffd966",
              color: "#000",
              fontWeight: "500",
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(255, 200, 100, 0.3)",
              opacity: (animando || !historialCompleto || historialCompleto.length === 0) ? 0.6 : 1
            }}
          > 
            {animando ? "Animando..." : "Mostrar Animación"}
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

        {/* Estadísticas */}
        <div style={{
          border: `1px solid ${pastelColors.border}`,
          borderRadius: 12,
          overflow: "hidden",
          fontFamily: "sans-serif",
          fontSize: 14,
          boxShadow: "0 4px 12px rgba(180, 160, 210, 0.15)"
        }}>
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

          {[
            { label: "Movimientos intentados", valor: estadisticas?.movimientosIntentados ?? "—" },
            { label: "Retrocesos", valor: estadisticas?.retrocesos ?? "—" },
            { label: "Tiempo de ejecución", valor: estadisticas?.tiempo ? `${estadisticas.tiempo.toFixed(2)} ms` : "—" },
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

      {/* Panel derecho - Tablero y mensajes */}
      <div style={{ 
        flex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16
      }}>
        {/* Mensaje de estado */}
        {mensaje && (
          <div style={{ 
            padding: "12px 20px",
            background: "#ffffff",
            borderRadius: 8,
            border: `1px solid ${pastelColors.border}`,
            color: pastelColors.text,
            width: "100%",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {mensaje}
          </div>
        )}

        {/* Tablero */}
        <div style={{ 
          display: "inline-grid", 
          gridTemplateColumns: `repeat(${n}, 80px)`, 
          gap: 2,
          background: "white",
          padding: 12,
          borderRadius: 10,
          boxShadow: `0 4px 12px rgba(180, 160, 210, 0.2)`
        }}>
          {tableroAMostrar.map((fila, x) =>
            fila.map((valor, y) => {
              const esPosicionActual = !animando && (x === posicionActualCaballo.x && y === posicionActualCaballo.y);
              const esInicial = x === posicionInicial.x && y === posicionInicial.y;
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: esPosicionActual ? 36 : (esInicial && !animando ? 24 : (valor >= 0 ? 16 : 12)),
                    color: esPosicionActual ? "#fff" : (valor >= 0 ? "#3b1a6e" : "inherit"),
                    fontWeight: "bold",
                    cursor: (modoObstaculo || modoSeleccionInicial) && !corriendo && !animando ? "pointer" : "default",
                    userSelect: "none",
                    transition: "transform 0.2s, background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if ((modoObstaculo || modoSeleccionInicial) && !corriendo && !animando) {
                      e.target.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  {esPosicionActual ? "♞" : (valor === -2 ? "🚫" : (valor >= 0 ? valor : ""))}
                </div>
              );
            })
          )}
        </div>
        
        <div style={{ 
          fontSize: 12, 
          color: pastelColors.text,
          textAlign: "center",
          marginTop: 8
        }}>
          🟢 Verde = Visitado | 🔴 Rojo = Retroceso | 🟠 Naranja = Posición actual | 🚫 = Obstáculo
        </div>
      </div>
    </div>
  );
}
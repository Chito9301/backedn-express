// Función para obtener los medios trending desde el backend
// Maneja errores HTTP y verifica que la respuesta sea JSON antes de parsear

export async function getTrendingMedia() {
  try {
    // Realiza la petición fetch al endpoint del backend
    const res = await fetch("/api/media/trending", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    // Verifica si la respuesta tiene el header Content-Type: application/json
    const contentType = res.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");

    // Si la respuesta es exitosa (status 200) y es JSON, la parsea
    if (res.ok && isJson) {
      const data = await res.json();
      return { success: true, data };
    }

    // Si la respuesta no es exitosa pero es JSON, muestra el mensaje de error del backend
    if (!res.ok && isJson) {
      const errorData = await res.json();
      return { success: false, error: errorData.error || "Error desconocido" };
    }

    // Si la respuesta no es JSON, muestra un mensaje genérico
    return { success: false, error: `Error HTTP ${res.status}: Respuesta no válida del servidor.` };
  } catch (err) {
    // Maneja errores de red o parseo
    return { success: false, error: "No se pudo conectar con el servidor o la respuesta no es válida." };
  }
}

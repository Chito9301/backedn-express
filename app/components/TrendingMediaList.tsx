// Componente React para mostrar medios trending usando getTrendingMedia
import { useEffect, useState } from "react";

// Importa la función getTrendingMedia
import { getTrendingMedia } from "../lib/getTrendingMedia"; // Ajusta la ruta según tu estructura

// Define el tipo de los datos de media para TypeScript
interface Media {
  _id: string;
  title: string;
  views: number;
  // Puedes agregar más campos según tu modelo
}

export default function TrendingMediaList() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Llama a la función al montar el componente
    getTrendingMedia().then(result => {
      if (result.success) {
        setMedia(result.data.data || []);
        setError("");
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Cargando medios trending...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <h2>Medios Trending</h2>
      {media.length === 0 ? (
        <div>No hay medios trending disponibles.</div>
      ) : (
        <ul>
          {media.map(item => (
            <li key={item._id}>
              <strong>{item.title}</strong> - {item.views} vistas
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

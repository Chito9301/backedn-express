"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);


  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/dashboard/login");
      return;
    }
    // Validar el token con el backend
    fetch("/api/status", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.replace("/dashboard/login");
          setValid(false);
        } else {
          setValid(true);
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace("/dashboard/login");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div>Cargando...</div>;
  if (!valid) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-blue-400">Retos Diarios</h1>
          </div>

          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded bg-blue-600 text-white">
              Dashboard
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Usuarios
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Contenido
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Estadísticas
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Configuración
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
            <p className="text-gray-400">Gestiona tu aplicación desde aquí</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Usuarios Totales</h3>
              <p className="text-3xl font-bold text-blue-400">1,234</p>
              <p className="text-sm text-green-400">+12% este mes</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Contenido Subido</h3>
              <p className="text-3xl font-bold text-purple-400">5,678</p>
              <p className="text-sm text-green-400">+8% este mes</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Interacciones</h3>
              <p className="text-3xl font-bold text-yellow-400">23,456</p>
              <p className="text-sm text-green-400">+15% este mes</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Ingresos</h3>
              <p className="text-3xl font-bold text-green-400">$12,345</p>
              <p className="text-sm text-green-400">+20% este mes</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Usuarios Activos</h3>
              <div className="h-64 flex items-center justify-center">
                <svg width="300" height="200" viewBox="0 0 300 200">
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    points="0,150 50,120 100,80 150,100 200,60 250,40 300,20"
                  />
                  <circle cx="0" cy="150" r="3" fill="#3B82F6" />
                  <circle cx="50" cy="120" r="3" fill="#3B82F6" />
                  <circle cx="100" cy="80" r="3" fill="#3B82F6" />
                  <circle cx="150" cy="100" r="3" fill="#3B82F6" />
                  <circle cx="200" cy="60" r="3" fill="#3B82F6" />
                  <circle cx="250" cy="40" r="3" fill="#3B82F6" />
                  <circle cx="300" cy="20" r="3" fill="#3B82F6" />
                </svg>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Distribución de Contenido</h3>
              <div className="h-64 flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#374151" strokeWidth="20" />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="20"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    transform="rotate(-90 100 100)"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="20"
                    strokeDasharray="125.6"
                    strokeDashoffset="0"
                    transform="rotate(90 100 100)"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Actividad Reciente</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-700 hover:bg-gray-750 px-2 rounded transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium">Nuevo usuario registrado</p>
                    <p className="text-sm text-gray-400">usuario@ejemplo.com</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">Hace 5 min</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-700 hover:bg-gray-750 px-2 rounded transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="font-medium">Contenido subido</p>
                    <p className="text-sm text-gray-400">Imagen por @usuario123</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">Hace 12 min</span>
              </div>

              <div className="flex items-center justify-between py-3 hover:bg-gray-750 px-2 rounded transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div>
                    <p className="font-medium">Sistema actualizado</p>
                    <p className="text-sm text-gray-400">Versión 2.1.0 desplegada</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">Hace 1 hora</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Estado del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Base de Datos: Conectada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Cloudinary: Activo</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>API: Funcionando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

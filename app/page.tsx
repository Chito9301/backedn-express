export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Backend Express API</h1>
        <p className="text-gray-600 mb-6">
          Tu backend está funcionando correctamente. Accede al dashboard administrativo para gestionar el sistema.
        </p>

        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </a>

          <a
            href="/health"
            className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Estado del Servidor
          </a>

          <a
            href="/api"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Documentación API
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">Endpoints disponibles: /api/auth, /api/users, /api/media</p>
        </div>
      </div>
    </div>
  )
}

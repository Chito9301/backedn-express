# Backend Express con MongoDB y Cloudinary

Backend completo desarrollado con Express.js que incluye autenticación JWT, subida de archivos a Cloudinary y gestión de medios.

## Características

- 🔐 **Autenticación JWT** - Registro y login de usuarios
- 📁 **Subida de archivos** - Integración con Cloudinary
- 🗄️ **Base de datos** - MongoDB con Mongoose
- 🌐 **CORS configurado** - Para desarrollo y producción
- 📊 **Dashboard** - Endpoint de estado del servidor
- 🔒 **Middleware de autenticación** - Protección de rutas

## Instalación

1. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

2. Configurar variables de entorno (ya incluidas en .env):
- `MONGODB_URI` - URL de conexión a MongoDB
- `JWT_SECRET` - Clave secreta para JWT
- `CLOUDINARY_*` - Credenciales de Cloudinary
- `NEXT_PUBLIC_API_URL` - URL del frontend

3. Ejecutar en desarrollo:
\`\`\`bash
npm run dev
\`\`\`

4. Ejecutar en producción:
\`\`\`bash
npm start
\`\`\`

## Endpoints API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Medios
- `POST /api/media` - Subir archivo (requiere autenticación)
- `GET /api/media/trending` - Obtener medios trending
- `GET /api/media/:id` - Obtener medio por ID

### Usuarios
- `GET /api/users/profile` - Obtener perfil (requiere autenticación)

### Sistema
- `GET /api/status` - Estado del servidor y estadísticas
- `GET /dashboard` - Dashboard web estático

## Estructura del proyecto

\`\`\`
├── models/
│   ├── User.js          # Modelo de usuario
│   └── Media.js         # Modelo de medios
├── index.js             # Servidor principal
├── package.json         # Dependencias
├── .env                 # Variables de entorno
└── README.md           # Documentación
\`\`\`

## Tecnologías utilizadas

- **Express.js** - Framework web
- **MongoDB + Mongoose** - Base de datos
- **Cloudinary** - Almacenamiento de archivos
- **JWT** - Autenticación
- **Multer** - Manejo de archivos
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Configuración de origen cruzado

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

   ```bash
   npm install
   ```

2. Configurar variables de entorno (ya incluidas en .env):

   - `MONGODB_URI` - URL de conexión a MongoDB
   - `JWT_SECRET` - Clave secreta para JWT
   - `CLOUDINARY_*` - Credenciales de Cloudinary
   - `NEXT_PUBLIC_API_URL` - URL del frontend

3. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

4. Ejecutar en producción:

   ```bash
   npm start
   ```

## Endpoints API

### Autenticación

- `POST /api/auth/register` - Registrar usuario. Body: `{ username, email, password }`. Responde con mensaje de éxito o error.
- `POST /api/auth/login` - Iniciar sesión. Body: `{ email, password }`. Responde con token JWT y datos del usuario.

### Medios

- `POST /api/media` - Subir archivo (requiere autenticación JWT). Body: `{ title, description, hashtags, type }` y archivo en campo `file`. Responde con datos del medio subido.
- `GET /api/media/trending` - Obtener medios trending. Query: `orderBy`, `limit`. Responde con `{ success, data }` o error.
- `GET /api/media/:id` - Obtener medio por ID. Responde con datos del medio o error.

### Usuarios

- `GET /api/users/profile` - Obtener perfil del usuario autenticado. Requiere JWT. Responde con datos del usuario.

### Sistema

- `GET /api/status` - Estado del backend y estadísticas. Responde con estado de MongoDB, Cloudinary y estadísticas.
- `GET /dashboard` - Dashboard web protegido por JWT. Devuelve el archivo `index.html` si el usuario está autenticado.

### Errores y rutas inválidas

- Todas las rutas devuelven JSON consistente con `success: false` y mensaje de error en español si ocurre algún problema.
- Las rutas no encontradas devuelven `{ success: false, error: "Ruta no encontrada" }` con status 404.

## Ejemplo para crear un usuario válido

Desde el backend (puedes usar Postman, Insomnia o fetch), haz lo siguiente:

1. **Registrar un nuevo usuario**:
   - **Endpoint**: `POST /api/auth/register`
   - **Body JSON**:

   ```json
   {
     "username": "admin",
     "email": "admin@admin.com",
     "password": "admin123"
   }
   ```

   Esto creará un usuario con esos datos.

2. **Iniciar sesión**:
   - Haz login en `POST /api/auth/login` con el email y password del usuario registrado.
   - Recibirás el token JWT necesario para acceder al dashboard. Guarda ese token en `localStorage` automáticamente desde el frontend login.

Si necesitas cambiar la lógica de generación del token, revisa la ruta `/api/auth/login` en `index.js`:

```javascript
app.post("/api/auth/login", async (req, res) => {
  ...
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
});
```

El token es válido si el `JWT_SECRET` es el mismo en backend y no ha expirado.

## Estructura del proyecto

```
├── api/
│   ├── auth/           # Rutas de autenticación
│   ├── media/          # Rutas de medios
│   └── _utils.js       # Utilidades API
├── app/
│   ├── dashboard/
│   │   ├── login.tsx   # Componente de login
│   │   └── page.tsx    # Página principal del dashboard
├── models/
│   ├── User.js         # Modelo de usuario
│   └── Media.js        # Modelo de medios
├── index.js            # Servidor principal Express
├── package.json        # Dependencias
├── .env                # Variables de entorno
└── README.md           # Documentación
```

## Tecnologías utilizadas

- **Express.js** - Framework web
- **MongoDB + Mongoose** - Base de datos
- **Cloudinary** - Almacenamiento de archivos
- **JWT** - Autenticación
- **Multer** - Manejo de archivos
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Configuración de origen cruzado

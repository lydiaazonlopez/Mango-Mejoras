# MANGO - Sistema Seguro de Autenticación

## ✅ Arquitectura de Seguridad

El backend (Express.js) **protege las credenciales sensibles**:
- ✅ **RESEND_API_KEY**: En servidor, nunca en cliente
- ✅ **ADMIN_PASSWORD**: Verificado en backend
- ✅ **SUPABASE_ANON_KEY**: Pública por diseño (solo lectura)

---

## 🚀 Instalación Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear `.env.local`
```bash
# Supabase
SUPABASE_URL=https://cgybesgscexysgehxafj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (SENSIBLE)
RESEND_API_KEY=re_...

# Admin
ADMIN_PASSWORD=Admin@2024
ADMIN_EMAIL=rtorreci@nttdata.com

# Server
PORT=3001
NODE_ENV=development
```

### 3. Correr en desarrollo
```bash
npm run dev
```

Esto inicia:
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001

---

## 📋 URLs de las aplicaciones

- **Login**: http://localhost:5173/login.html
- **App Principal**: http://localhost:5173/index.html
- **Admin Panel**: http://localhost:5173/admin.html (contraseña: Admin@2024)

---

## 🔐 Endpoints Backend

### POST `/api/health`
Verificar que el servidor esté funcionando.

### POST `/api/auth/verify-admin`
Verificar contraseña admin.
```json
{
  "adminPassword": "Admin@2024"
}
```
Respuesta: `{ "valid": true/false }`

### POST `/api/auth/send-registration-email`
Enviar email de notificación al admin (llamado desde login.html).
```json
{
  "name": "John Doe",
  "email": "user@example.com"
}
```

### POST `/api/auth/approve-registration`
Aprobar registro (crear usuario + enviar email).
```json
{
  "registrationId": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "passwordHash": "bcrypt_hash",
  "adminPassword": "Admin@2024"
}
```

### POST `/api/auth/reject-registration`
Rechazar registro (eliminar solicitud + enviar email).
```json
{
  "registrationId": "uuid",
  "email": "user@example.com",
  "adminPassword": "Admin@2024"
}
```

---

## 📤 Despliegue en Vercel (Próximamente)

### Backend en Vercel Functions
La estructura para Functions se vería así:
```
/api
  /auth/
    verify-admin.js
    send-registration-email.js
    approve-registration.js
    reject-registration.js
```

### Frontend en Vercel (Static)
El frontend Vite se despliega como sitio estático.

**Cambios necesarios para producción:**

#### 1. En `login.html`, cambiar:
```javascript
const API_URL = 'http://localhost:3001';
// → en producción:
const API_URL = 'https://tu-proyecto.vercel.app/api';
```

#### 2. En `admin.html`, cambiar:
```javascript
const API_URL = 'http://localhost:3001';
// → en producción:
const API_URL = 'https://tu-proyecto.vercel.app/api';
```

#### 3. En `server/index.js`, actualizar CORS:
```javascript
origin: process.env.NODE_ENV === 'production'
  ? 'https://tu-proyecto.vercel.app'
  : ['http://localhost:5173', 'http://localhost:3000'],
```

---

## 🔄 Flujo de Autenticación

### Registro (Con aprobación)
1. Usuario se registra en `login.html`
2. Contraseña hasheada con bcryptjs (salt 10)
3. Guardado en `pending_registrations` (pendiente)
4. Email de notificación → admin (`rtorreci@nttdata.com`)
5. Admin verifica en `admin.html`
6. Si **Aprueba**:
   - Crear usuario en tabla `users`
   - Eliminar de `pending_registrations`
   - Enviar email de bienvenida

### Login
1. Usuario ingresa email + contraseña
2. Buscar en tabla `users`
3. Verificar contraseña con bcryptjs.compare()
4. Crear sesión en localStorage (24h)
5. Redirigir a `index.html`

### Logout
- Eliminar sesión del localStorage
- Redirigir a `login.html`

---

## 📊 Estructura de Base de Datos

### Tabla: `users`
```sql
id (UUID, PK)
email (TEXT UNIQUE)
name (TEXT)
password_hash (TEXT)
created_at (TIMESTAMP)
```

### Tabla: `pending_registrations`
```sql
id (UUID, PK)
email (TEXT UNIQUE)
name (TEXT)
password_hash (TEXT)
created_at (TIMESTAMP)
```

---

## ⚙️ Configuración de Producción

### 1. Cambiar contraseña admin
Por seguridad, editar `ADMIN_PASSWORD` en `.env.local`:
```bash
ADMIN_PASSWORD=NuevaContraseña@2024
```

### 2. Variables de entorno en Vercel
En dashboard de Vercel, agregar:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
RESEND_API_KEY=re_...
ADMIN_PASSWORD=...
ADMIN_EMAIL=...
NODE_ENV=production
```

### 3. Restricciones de CORS
El servidor solo acepta requests desde tu dominio Vercel.

---

## 🐛 Troubleshooting

### "Sistema no inicializado"
- Revisar consola (F12)
- Verificar que servidor backend está corriendo en port 3001
- Para desarrollo: `npm run dev` inicia ambos

### Error de CORS
- Agregar dominio a whitelist en `server/index.js`
- En localhost: automáticamente permitido

### Email no se envía
- Verificar `RESEND_API_KEY` en `.env.local`
- Verificar `ADMIN_EMAIL` es correcto
- Ver logs del servidor: `npm run dev:backend`

---

## 📝 Notas de Seguridad

⚠️ **NO HACER**:
- ❌ Comitear `.env.local` a Git
- ❌ Exponer `RESEND_API_KEY` en el cliente
- ❌ Guardar contraseñas en texto plano

✅ **HACER**:
- ✅ Usar variables de entorno
- ✅ Todas las operaciones sensibles en backend
- ✅ Cambiar `ADMIN_PASSWORD` en producción
- ✅ Usar HTTPS en producción

---

## 🚀 Scripts

```bash
npm run dev           # Corre frontend + backend
npm run dev:frontend  # Solo Vite (frontend)
npm run dev:backend   # Solo Express (backend)
npm run build         # Build Vite para producción
npm run preview       # Preview de build
```

# 🚀 Despliegue en Vercel - Guía Completa

## Estructura Final

```
proyecto/
├── index.html, login.html, admin.html     ← Frontend (Vite)
├── index.tsx                               ← App React
├── vite.config.ts
├── package.json
├── vercel.json                             ← Configuración Vercel
├── .env.local                              ← Variables locales (NO comitear)
└── api/
    └── auth/
        ├── verify-admin.js                 ← Función serverless
        ├── send-registration-email.js      ← Función serverless
        ├── approve-registration.js         ← Función serverless
        └── reject-registration.js          ← Función serverless
```

---

## 📋 Paso a Paso: Deploy en Vercel

### **Paso 1: Preparar el repositorio Git**

```bash
# Si aún no has iniciado Git
git init
git add .
git commit -m "Initial commit with Vercel Functions"

# Si usas GitHub
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

**⚠️ Asegúrate que `.gitignore` incluya:**

```
.env.local
.env
node_modules/
dist/
.vercel/
```

---

### **Paso 2: Conectar a Vercel**

#### Opción A: Usando Vercel CLI

```bash
npm install -g vercel      # Instalar CLI (una sola vez)
vercel                     # En la carpeta del proyecto
```

#### Opción B: Usando Dashboard Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Importa el proyecto

---

### **Paso 3: Configurar Variables de Entorno**

En el dashboard de Vercel (Project Settings → Environment Variables), agrega:

| Variable            | Valor                                      |
| ------------------- | ------------------------------------------ |
| `SUPABASE_URL`      | `https://cgybesgscexysgehxafj.supabase.co` |
| `SUPABASE_ANON_KEY` | Tu clave ANON                              |
| `RESEND_API_KEY`    | `re_...` (tu API key de Resend)            |
| `ADMIN_PASSWORD`    | Nueva contraseña segura                    |
| `ADMIN_EMAIL`       | `rtorreci@nttdata.com`                     |

**⚠️ Cambiar `ADMIN_PASSWORD` a algo seguro:**

```bash
# Genera una contraseña fuerte
echo $(openssl rand -base64 12)
```

---

### **Paso 4: Deploy**

Si usas **Vercel CLI**:

```bash
vercel --prod
```

Si usas **GitHub**, Vercel despliega automáticamente en cada `git push` a main.

---

## ✅ Verificar que funciona

Después del deploy, verifica:

1. **Frontend carga correctamente**

   ```
   https://tu-proyecto.vercel.app/
   ```

2. **Login funciona**

   ```
   https://tu-proyecto.vercel.app/login.html
   ```

3. **Admin panel funciona**

   ```
   https://tu-proyecto.vercel.app/admin.html
   ```

4. **Endpoints están disponibles**
   ```bash
   curl https://tu-proyecto.vercel.app/api/auth/verify-admin \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"adminPassword": "tu-contraseña"}'
   ```
   Debería retornar: `{"valid": true}` o `{"valid": false}`

---

## 🔧 Desarrollo Local con Vercel CLI

Después de instalar `vercel`, corre:

```bash
npm run dev
```

Esto inicia:

- **Frontend (Vite)**: http://localhost:5173
- **API (Vercel Functions)**: http://localhost:3000/api/...

El frontend automáticamente se conecta a `http://localhost:3000` cuando está en puerto 5173.

---

## 🔐 Variables de Entorno en Desarrollo

Crear `.env.local` en la raíz del proyecto:

```bash
# .env.local
SUPABASE_URL=https://cgybesgscexysgehxafj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_74Tw8whB_41JqyAGyXS8gzhaEw4DnA6h3
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=rtorreci@nttdata.com
```

**No comitear este archivo** (añadido a `.gitignore`).

---

## 📊 How it Works

### Arquitectura de Vercel Functions

```
Request → Vercel → /api/auth/verify-admin.js → Response
```

Cada archivo en `/api/auth/` se convierte automáticamente en un endpoint:

- `api/auth/verify-admin.js` → `https://tu-proyecto.vercel.app/api/auth/verify-admin`
- `api/auth/send-registration-email.js` → `.../api/auth/send-registration-email`
- etc.

### Flujo en Producción

1. **Usuario se registra** en `login.html`
2. Frontend llama a `/api/auth/send-registration-email` (en Vercel)
3. Backend (Vercel Function) envía email con Resend
4. Admin recibe notificación en `rtorreci@nttdata.com`
5. Admin accede a `admin.html`
6. Presiona "Aprobar" → llama a `/api/auth/approve-registration`
7. Usuario recibe email de bienvenida

---

## 🐛 Troubleshooting

### Error: "No se encuentran las Funciones"

- Verifica que `/api/auth/` existe y tiene archivos `.js`
- En dashboard Vercel → Functions tab, deberías ver tus funciones listadas

### Error: CORS bloqueado

- Los CORS headers están configurados en `vercel.json`
- En desarrollo, Vercel CLI los emula automáticamente

### Email no se envía

- Verifica `RESEND_API_KEY` en production environment variables
- Revisa logs: Dashboard → Deployments → Function Logs

### Variables de entorno no cargan

- En Vercel: Settings → Environment Variables → Redeploy
- En local: reinicia `vercel dev`

---

## 📝 Monitoreo y Logs

En dashboard de Vercel:

1. **Ver logs de Functions**
   - Deployments → tu deployment → Functions logs
2. **Ver requests**
   - Analytics → Network tab

3. **Alertas**
   - Settings → Notifications → Error alerts

---

## 🎯 Próximos Pasos (Opcional)

### Agregar Analytics

```javascript
// En tus Funciones
import { analytics } from "@vercel/analytics";
```

### Rate Limiting

```javascript
// Evitar abuso (opcional)
import { Ratelimit } from "@vercel/kv";
```

### Custom Dominios

- Settings → Domains → Agregar tu dominio personalizado

---

## 📚 Referencias

- [Vercel Functions Docs](https://vercel.com/docs/functions/overview)
- [Resend Email API](https://resend.com/docs)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [Vercel CLI](https://vercel.com/docs/cli)

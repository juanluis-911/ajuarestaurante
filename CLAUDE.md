@AGENTS.md

# Ajúa Restaurantes — Web Admin

## Contexto del proyecto
SaaS multi-tenant para gestión de restaurantes/sucursales. El primer cliente es **Ajúa** (restaurante mexicano). No hay delivery — solo **dine-in** (comer en mesa) y **pickup** (ordenar y recoger). Hay una app móvil separada para clientes en `c:/- DESARROLLOS/ajua-restaurantes-mobile`.

## Stack
- Next.js 16.2.1 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (auth + DB + RLS)
- react-hook-form + zod
- recharts, sonner, lucide-react, date-fns

## Arquitectura multi-tenant

```
Organization (dueño de la cadena)
  └── Restaurant / Sucursal A (slug único por org)
  └── Restaurant / Sucursal B
```

### Rutas por rol
| Ruta | Quién accede |
|---|---|
| `/admin/dashboard` | super_admin |
| `/org/[orgSlug]/dashboard` | org_admin |
| `/r/[orgSlug]/[restaurantSlug]/pos` | cajera, gerente |
| `/r/[orgSlug]/[restaurantSlug]/kitchen` | cocina, gerente |
| `/r/[orgSlug]/[restaurantSlug]/menu` | gerente, org_admin |
| `/r/[orgSlug]/[restaurantSlug]/reports` | gerente, org_admin |
| `/r/[orgSlug]/[restaurantSlug]/tables` | gerente |
| `/menu/[orgSlug]/[restaurantSlug]` | público (clientes) |

### Roles
```
super_admin   → todo el sistema
org_admin     → su organización + todas las sucursales
gerente       → su restaurante completo
cajera        → POS + órdenes de su restaurante
cocina        → solo vista de cocina (sin editar nada)
```

## Archivos clave
- `types/database.ts` — todos los tipos TypeScript
- `lib/supabase/client.ts` — cliente browser
- `lib/supabase/server.ts` — cliente server (cookies)
- `lib/auth/get-user-context.ts` — obtiene user + roles, helpers de permisos
- `middleware.ts` — protección de rutas
- `supabase/schema.sql` — schema completo con RLS, enums, índices, triggers

## Variables de entorno necesarias (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Estado actual (inicio de proyecto)
- [x] Proyecto scaffoldeado con Next.js 16
- [x] Dependencias instaladas
- [x] Estructura de carpetas por rol creada
- [x] Types TypeScript definidos
- [x] Supabase client/server configurados
- [x] Middleware de auth
- [x] Helper `getUserContext()` con permisos
- [x] Schema SQL completo (organizations, restaurants, roles, categories, menu_items, restaurant_tables, orders, order_items)
- [x] RLS policies por rol
- [x] Página de login básica
- [x] Redirect `/dashboard` según rol
- [ ] Conectar Supabase real (correr schema.sql)
- [ ] Dashboard super_admin
- [ ] Dashboard org_admin
- [ ] POS (cajera)
- [ ] Vista cocina
- [ ] Gestión de menú (gerente)
- [ ] Gestión de mesas con QR
- [ ] Reportes

## Convenciones
- Server Components por defecto; `'use client'` solo cuando se necesita interactividad
- Auth siempre vía `getUserContext()` en server components — nunca confiar en cliente
- Permisos doble capa: middleware (redirección) + RLS Supabase (datos)
- Color primario de la marca: naranja (`orange-500`)

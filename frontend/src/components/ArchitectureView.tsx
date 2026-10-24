import React, { useState } from 'react';
import { Layers, ShieldCheck, Database, Server, Smartphone, Lock, RefreshCw, Key, ChevronRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedSubDiagram, setSelectedSubDiagram] = useState<'containers' | 'security' | 'fefo_sequence'>('containers');

  return (
    <div className="space-y-6">
      {/* Selector de Diagrama */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            Diagramas de Arquitectura de Software & Seguridad
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estandarizado con el Modelo C4 (Containers & Components) y especificación de seguridad multinivel.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setSelectedSubDiagram('containers')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSubDiagram === 'containers'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Diagrama C4 Contenedores
          </button>
          <button
            onClick={() => setSelectedSubDiagram('security')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSubDiagram === 'security'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Seguridad en 3 Capas (RBAC)
          </button>
          <button
            onClick={() => setSelectedSubDiagram('fefo_sequence')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSubDiagram === 'fefo_sequence'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Secuencia Transacción FEFO
          </button>
        </div>
      </div>

      {/* Contenido según selección */}
      {selectedSubDiagram === 'containers' && (
        <div className="space-y-6 animate-fadeIn">
          {/* C4 Containers visual card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Modelo C4 • Nivel 2: Diagrama de Contenedores
              </span>
              <span className="text-xs text-slate-500">Arquitectura Desacoplada Monorepo</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Frontend Container */}
              <div className="p-5 rounded-xl border-2 border-sky-400 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-sky-500 text-white shadow-sm">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cliente Web PWA</h3>
                    <p className="text-[11px] text-sky-700 dark:text-sky-300 font-mono">apps/web (Next.js 15)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Single Page & PWA instalable en tablets y terminales de caja. Renderiza la UI con Tailwind CSS y componentes shadcn/ui.
                </p>
                <div className="text-[11px] space-y-1.5 pt-2 border-t border-sky-200 dark:border-sky-800 text-slate-600 dark:text-slate-400">
                  <div><strong>Módulos:</strong> POS, Inventario, Clientes, Reportes, Usuarios.</div>
                  <div><strong>Estado Remoto:</strong> TanStack Query v5 con cache reactivo.</div>
                  <div><strong>Formularios:</strong> React Hook Form + Zod.</div>
                  <div><strong>Canal Realtime:</strong> Suscripción a Supabase Realtime (WebSocket).</div>
                </div>
              </div>

              {/* Backend Container */}
              <div className="p-5 rounded-xl border-2 border-emerald-500 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Backend API Core</h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">apps/api (NestJS 10+)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Servidor monolítico modular con Inyección de Dependencias. Maneja la lógica farmacéutica, FEFO y cron jobs programados.
                </p>
                <div className="text-[11px] space-y-1.5 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-400">
                  <div><strong>Arquitectura:</strong> Controllers → Services → Prisma Repositories.</div>
                  <div><strong>Validación:</strong> DTOs con class-validator & class-transformer.</div>
                  <div><strong>Seguridad:</strong> Guard de permisos Módulo × Acción dinámico.</div>
                  <div><strong>Cron Jobs:</strong> @nestjs/schedule (alertas a las 06:00 AM).</div>
                </div>
              </div>

              {/* Data & Services Container */}
              <div className="p-5 rounded-xl border-2 border-purple-400 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow-sm">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Persistencia & Auth</h3>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">Supabase (PostgreSQL 15)</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Motor relacional ACID con Row Level Security (RLS), Supabase Auth para emisión de tokens y motor Realtime por WebSockets.
                </p>
                <div className="text-[11px] space-y-1.5 pt-2 border-t border-purple-200 dark:border-purple-800 text-slate-600 dark:text-slate-400">
                  <div><strong>ORM:</strong> Prisma conectado vía Connection Pooler.</div>
                  <div><strong>Políticas RLS:</strong> Aislamiento de lectura/escritura por claims.</div>
                  <div><strong>Auditoría:</strong> Triggers PostgreSQL inmutables.</div>
                  <div><strong>Secretos:</strong> Service Role restringido estrictamente a NestJS.</div>
                </div>
              </div>
            </div>

            {/* Comunicación entre Contenedores */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Protocolos y Tuberías de Comunicación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>HTTPS / REST JSON:</strong> Web client consulta y muta datos a través de NestJS.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>WSS (WebSockets):</strong> Web client escucha alertas y cambios de stock vía Supabase Realtime.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>TCP / TLS (Prisma):</strong> NestJS ejecuta transacciones serializables en PostgreSQL con pooling.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSubDiagram === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Security 3-layers visualization */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Arquitectura de Defensa en Profundidad
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Seguridad de Permisos Dinámicos en Tres Capas (Zero Trust)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Incluso si un usuario altera el código del frontend en el navegador o salta la UI mediante Postman/Curl, las capas 2 y 3 impiden cualquier acceso no autorizado.
              </p>
            </div>

            <div className="space-y-4">
              {/* Capa 1 */}
              <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <span className="px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-[10px]">CAPA 1</span>
                    Frontend (Next.js Middleware & React Context)
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    • <strong>Menú dinámico:</strong> Oculta opciones sin permiso.<br />
                    • <strong>Rutas protegidas:</strong> Next.js Middleware redirige al dashboard si la URL está prohibida.<br />
                    • <strong>Zero Pills / Botones condicionales:</strong> Los botones de "Crear Producto", "Anular Venta" o "Eliminar" no se renderizan en el DOM.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 text-xs font-mono font-medium shrink-0">
                  UX & Bloqueo Visual
                </div>
              </div>

              {/* Capa 2 */}
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-[10px]">CAPA 2</span>
                    Backend (NestJS JwtAuthGuard + Dynamic PermissionsGuard)
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    • <strong>Decorador:</strong> <code>@RequirePermission('inventario', 'crear')</code> en el controlador.<br />
                    • <strong>Reflector & Matriz en memoria:</strong> Compara el UUID del usuario contra la tabla <code>user_permissions</code>.<br />
                    • <strong>Rate Limiting:</strong> <code>ThrottlerGuard</code> bloquea IPs que excedan 10 solicitudes de login por minuto.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-mono font-medium shrink-0">
                  HTTP 403 Forbidden
                </div>
              </div>

              {/* Capa 3 */}
              <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
                    <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-[10px]">CAPA 3</span>
                    Motor de Base de Datos (Supabase PostgreSQL RLS & Triggers)
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    • <strong>Row Level Security:</strong> Reglas SQL que garantizan que las consultas directas solo retornen registros autorizados.<br />
                    • <strong>Triggers de Auditoría Forense:</strong> Cualquier cambio en precios o lotes dispara un trigger inmutable a <code>system_audit_logs</code>.<br />
                    • <strong>service_role blindado:</strong> Solo NestJS posee la clave maestra en variable de entorno secreta.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-xs font-mono font-medium shrink-0">
                  PostgreSQL Kernel Level
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSubDiagram === 'fefo_sequence' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sequence diagram card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Lógica Transaccional de Alto Rendimiento
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Flujo de Secuencia: Transacción Atómica de Venta FEFO
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Garantiza consistencia ACID ante múltiples cajeros concurrentes y previene la dispensación de medicamentos caducados.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-200 p-5 rounded-xl font-mono text-xs overflow-x-auto space-y-3 leading-relaxed">
              <div className="text-emerald-400 font-bold">// SECUENCIA ATÓMICA DE VENTA EN NESTJS + PRISMA:</div>
              <div>[Cajero POS] --(1. POST /api/v1/sales/checkout &#123; items, paymentMethod &#125;)--&gt; [NestJS SalesController]</div>
              <div>&nbsp;&nbsp;│</div>
              <div>&nbsp;&nbsp;├──&gt; [PermissionsGuard] : Valida permiso ('ventas', 'crear')</div>
              <div>&nbsp;&nbsp;│</div>
              <div>&nbsp;&nbsp;└──&gt; [SalesService.processSale()] : Inicia prisma.$transaction(async (tx) =&gt; &#123;</div>
              <div className="text-amber-300">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1. Para cada producto solicitado:</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Query con bloqueo pesimista:</div>
              <div className="text-sky-300">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SELECT * FROM batches </div>
              <div className="text-sky-300">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WHERE product_id = :id AND expiration_date &gt; CURRENT_DATE AND stock &gt; 0</div>
              <div className="text-sky-300">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ORDER BY expiration_date ASC </div>
              <div className="text-amber-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FOR UPDATE; // Bloquea filas concurrentes de otros cajeros</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. Descuenta cantidad requerida de los lotes ordenados cronológicamente (FEFO).</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3. Si la suma de stock de los lotes válidos &lt; cantidad solicitada:</div>
              <div className="text-rose-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;THROW BadRequestException("Stock insuficiente en lotes vigentes"); // ROLLBACK</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4. Inserta registro maestro en `sales`.</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;5. Inserta detalles en `sale_items` y vínculos exactos en `sale_item_batches`.</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6. Genera movimiento de kárdex tipo `SALIDA_VENTA`.</div>
              <div className="text-emerald-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMIT TRANSACTION;</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;)</div>
              <div>&nbsp;&nbsp;│</div>
              <div>&nbsp;&nbsp;├──&gt; [Supabase Realtime] : Emite evento en canal 'stock_updates' con el nuevo inventario</div>
              <div>&nbsp;&nbsp;│</div>
              <div>[NestJS] --(2. Retorna 201 Created con Ticket & Código de Boleta)--&gt; [Cajero POS]</div>
              <div className="text-emerald-400">[Cajero POS] : Imprime ticket térmico y limpia carrito en &lt; 250ms total.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

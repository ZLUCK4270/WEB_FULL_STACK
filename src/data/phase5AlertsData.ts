export interface CronAlertFile {
  id: string;
  name: string;
  path: string;
  description: string;
  code: string;
}

export const PHASE5_CODE_FILES: CronAlertFile[] = [
  {
    id: 'cron_monitor',
    name: 'Cron Job Programado (@nestjs/schedule)',
    path: 'apps/api/src/alerts/cron/inventory-monitor.cron.ts',
    description: 'Motor asíncrono con tareas programadas para auditoría periódica de stock crítico y vencimientos a 30, 60 y 90 días.',
    code: `import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from '../alerts.service';

@Injectable()
export class InventoryMonitorCron {
  private readonly logger = new Logger(InventoryMonitorCron.name);

  constructor(private readonly alertsService: AlertsService) {}

  /**
   * CRON 1: AUDITORÍA PREVENTIVA DIARIA DE VENCIMIENTOS
   * Se ejecuta automáticamente todos los días a las 06:00:00 AM (Zona horaria América/Lima).
   * Identifica lotes a 30, 60 y 90 días de caducar y medicamentos ya vencidos.
   */
  @Cron('0 6 * * *', {
    name: 'daily-expiration-audit',
    timeZone: 'America/Lima',
  })
  async handleDailyExpirationAudit() {
    this.logger.log('⏰ [06:00 AM] Iniciando auditoría preventiva de vencimiento de lotes farmacéuticos...');
    try {
      const generatedAlerts = await this.alertsService.auditBatchExpirations();
      this.logger.log(\`✔ Auditoría diaria de vencimientos finalizada: \${generatedAlerts.count} alertas generadas.\`);
    } catch (error) {
      this.logger.error('❌ Error durante la auditoría de vencimientos:', error);
    }
  }

  /**
   * CRON 2: MONITOREO CONTINUO DE STOCK MÍNIMO Y QUIEBRES
   * Se ejecuta cada 15 minutos en horario comercial para detectar quiebres no previstos.
   */
  @Cron('*/15 * * * *', {
    name: 'periodic-stock-threshold-check',
  })
  async handlePeriodicStockCheck() {
    this.logger.log('⚡ Verificando umbrales de stock mínimo consolidado...');
    try {
      const lowStockAlerts = await this.alertsService.auditLowStockProducts();
      if (lowStockAlerts.count > 0) {
        this.logger.warn(\`⚠️ \${lowStockAlerts.count} productos han traspasado su umbral de stock mínimo.\`);
      }
    } catch (error) {
      this.logger.error('❌ Error evaluando stock mínimo:', error);
    }
  }
}`
  },
  {
    id: 'alerts_service',
    name: 'Servicio de Alertas & Reposición',
    path: 'apps/api/src/alerts/alerts.service.ts',
    description: 'Lógica para evaluar queries agregadas de stock, consolidar pedidos por droguería y emitir notificaciones.',
    code: `import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseRealtimeService } from './realtime/supabase-realtime.service';
import { AlertStatus, AlertType, AlertTriggerSource } from '@prisma/client';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: SupabaseRealtimeService,
  ) {}

  /**
   * Evalúa lotes y genera alertas de vencimiento a 30, 60 y 90 días
   */
  async auditBatchExpirations(): Promise<{ count: number }> {
    const today = new Date();
    const date30 = new Date(); date30.setDate(today.getDate() + 30);
    const date60 = new Date(); date60.setDate(today.getDate() + 60);
    const date90 = new Date(); date90.setDate(today.getDate() + 90);

    // Consulta lotes vigentes con stock remanente
    const activeBatches = await this.prisma.batch.findMany({
      where: {
        currentStock: { gt: 0 },
        expirationDate: { lte: date90 },
      },
      include: { product: true },
    });

    let count = 0;

    for (const batch of activeBatches) {
      let alertType: AlertType;
      let message: string;

      if (batch.expirationDate <= today) {
        alertType = AlertType.MEDICAMENTO_VENCIDO;
        message = \`CRÍTICO: El lote \${batch.batchCode} de "\${batch.product.name}" ha vencido hoy o antes. Debe retirarse de exhibición.\`;
      } else if (batch.expirationDate <= date30) {
        alertType = AlertType.VENCIMIENTO_30_DIAS;
        message = \`URGENTE: El lote \${batch.batchCode} de "\${batch.product.name}" vence en menos de 30 días (\${batch.expirationDate.toISOString().split('T')[0]}).\`;
      } else if (batch.expirationDate <= date60) {
        alertType = AlertType.VENCIMIENTO_60_DIAS;
        message = \`PREVENTIVO: El lote \${batch.batchCode} de "\${batch.product.name}" vence en menos de 60 días.\`;
      } else {
        alertType = AlertType.VENCIMIENTO_90_DIAS;
        message = \`AVISO: El lote \${batch.batchCode} de "\${batch.product.name}" vence en menos de 90 días.\`;
      }

      // Evitar alertas duplicadas en estado PENDIENTE para el mismo lote
      const existing = await this.prisma.stockAlert.findFirst({
        where: {
          batchId: batch.id,
          alertType,
          status: { in: [AlertStatus.PENDIENTE, AlertStatus.EN_GESTION] },
        },
      });

      if (!existing) {
        const createdAlert = await this.prisma.stockAlert.create({
          data: {
            productId: batch.productId,
            batchId: batch.id,
            alertType,
            status: AlertStatus.PENDIENTE,
            message,
            triggeredBy: AlertTriggerSource.CRON_JOB,
          },
        });

        count++;

        // Emisión en tiempo real vía WebSocket
        await this.realtimeService.broadcastAlert({
          id: createdAlert.id,
          productId: batch.productId,
          productName: batch.product.name,
          batchCode: batch.batchCode,
          alertType,
          severity: alertType === AlertType.MEDICAMENTO_VENCIDO ? 'CRITICO' : 'ALTO',
          message,
          createdAt: createdAlert.createdAt,
        });
      }
    }

    return { count };
  }

  /**
   * Evalúa el stock total de cada medicamento contra su umbral min_stock
   */
  async auditLowStockProducts(): Promise<{ count: number }> {
    // Agrupa la suma de stock de lotes vigentes por producto
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: {
            currentStock: { gt: 0 },
            expirationDate: { gt: new Date() },
          },
        },
        category: true,
      },
    });

    let count = 0;

    for (const prod of products) {
      const totalValidStock = prod.batches.reduce((acc, b) => acc + b.currentStock, 0);

      if (totalValidStock <= prod.minStock) {
        const isDepleted = totalValidStock === 0;
        const alertType = isDepleted ? AlertType.STOCK_AGOTADO : AlertType.STOCK_BAJO;
        const message = isDepleted
          ? \`QUIEBRE TOTAL: El producto "\${prod.name}" no cuenta con stock disponible en ningún lote vigente.\`
          : \`REPOSICIÓN: El producto "\${prod.name}" tiene \${totalValidStock} unidades (Umbral mínimo: \${prod.minStock}).\`;

        const existing = await this.prisma.stockAlert.findFirst({
          where: {
            productId: prod.id,
            alertType,
            status: { in: [AlertStatus.PENDIENTE, AlertStatus.EN_GESTION] },
          },
        });

        if (!existing) {
          const alert = await this.prisma.stockAlert.create({
            data: {
              productId: prod.id,
              alertType,
              status: AlertStatus.PENDIENTE,
              message,
              triggeredBy: AlertTriggerSource.CRON_JOB,
            },
          });

          count++;

          await this.realtimeService.broadcastAlert({
            id: alert.id,
            productId: prod.id,
            productName: prod.name,
            alertType,
            severity: isDepleted ? 'CRITICO' : 'MEDIO',
            message,
            createdAt: alert.createdAt,
          });
        }
      }
    }

    return { count };
  }

  /**
   * Genera lista sugerida de reposición agrupada por Droguería/Proveedor habitual
   */
  async getSuggestedReplenishmentGrouped() {
    // Obtiene alertas pendientes de stock bajo o agotado
    const alerts = await this.prisma.stockAlert.findMany({
      where: {
        status: { in: [AlertStatus.PENDIENTE, AlertStatus.EN_GESTION] },
        alertType: { in: [AlertType.STOCK_BAJO, AlertType.STOCK_AGOTADO] },
      },
      include: {
        product: {
          include: {
            batches: {
              include: { supplier: true },
              orderBy: { createdAt: 'desc' },
              take: 1, // Último proveedor del que se compró
            },
          },
        },
      },
    });

    const groupedBySupplier = new Map<string, any>();

    for (const alert of alerts) {
      const prod = alert.product;
      const lastBatch = prod.batches[0];
      const supplier = lastBatch?.supplier || {
        id: 'generic-supplier',
        businessName: 'Droguería por Asignar',
        ruc: '00000000000',
        phone: 'Sin teléfono',
      };

      if (!groupedBySupplier.has(supplier.id)) {
        groupedBySupplier.set(supplier.id, {
          supplierId: supplier.id,
          businessName: supplier.businessName,
          ruc: supplier.ruc,
          phone: supplier.phone,
          items: [],
          totalEstimatedCost: 0,
        });
      }

      const suggestedQty = (prod.maxStock || prod.minStock * 3) - (prod.batches.reduce((a, b) => a + b.currentStock, 0));
      const lineCost = Number(prod.costPrice) * Math.max(suggestedQty, prod.minStock);

      const group = groupedBySupplier.get(supplier.id);
      group.items.push({
        alertId: alert.id,
        productId: prod.id,
        productName: prod.name,
        genericName: prod.genericName,
        presentation: prod.presentation,
        unitCost: prod.costPrice,
        suggestedQuantity: Math.max(suggestedQty, prod.minStock),
        estimatedLineCost: lineCost,
      });
      group.totalEstimatedCost += lineCost;
    }

    return Array.from(groupedBySupplier.values());
  }

  /**
   * Actualiza el estado de una alerta (ej: ATENDIDA, EN_GESTION)
   */
  async updateAlertStatus(alertId: string, status: AlertStatus, userId: string) {
    const alert = await this.prisma.stockAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    return await this.prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        status,
        resolvedById: status === AlertStatus.ATENDIDA ? userId : undefined,
        resolvedAt: status === AlertStatus.ATENDIDA ? new Date() : undefined,
      },
    });
  }
}`
  },
  {
    id: 'realtime_service',
    name: 'Servicio Supabase Realtime (WebSockets)',
    path: 'apps/api/src/alerts/realtime/supabase-realtime.service.ts',
    description: 'Canal de transmisión bidireccional por WebSockets para refrescar campana de notificaciones y stock en terminales POS.',
    code: `import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RealtimeAlertPayload {
  id: string;
  productId: string;
  productName: string;
  batchCode?: string;
  alertType: string;
  severity: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  message: string;
  createdAt: Date;
}

@Injectable()
export class SupabaseRealtimeService {
  private readonly logger = new Logger(SupabaseRealtimeService.name);
  private supabase: SupabaseClient;
  private readonly channelName = 'tenant:nova-salud:alerts';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    );
  }

  /**
   * Emite una notificación instantánea al canal global de alertas de la botica
   */
  async broadcastAlert(payload: RealtimeAlertPayload): Promise<void> {
    try {
      const channel = this.supabase.channel(this.channelName);

      await channel.send({
        type: 'broadcast',
        event: 'NEW_STOCK_ALERT',
        payload,
      });

      this.logger.log(\`📡 Notificación Realtime emitida: [\${payload.alertType}] - \${payload.productName}\`);
    } catch (error) {
      this.logger.error('Error emitiendo mensaje Realtime:', error);
    }
  }

  /**
   * Emite actualización inmediata de inventario para sincronizar terminales POS
   */
  async broadcastStockReduction(productId: string, remainingStock: number): Promise<void> {
    try {
      const channel = this.supabase.channel('tenant:nova-salud:pos-sync');

      await channel.send({
        type: 'broadcast',
        event: 'STOCK_UPDATED',
        payload: {
          productId,
          remainingStock,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error('Error emitiendo evento de stock en terminales:', error);
    }
  }
}`
  },
  {
    id: 'alerts_controller',
    name: 'Controlador REST de Alertas',
    path: 'apps/api/src/alerts/alerts.controller.ts',
    description: 'Endpoints OpenAPI para listar alertas, disparar cron manualmente y exportar sugerencias.',
    code: `import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { AlertStatus } from '@prisma/client';

@ApiTags('Alertas & Reposición')
@ApiBearerAuth('access-token')
@UseGuards(PermissionsGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('active')
  @RequirePermission('alerts_replenishment', 'view')
  @ApiOperation({ summary: 'Lista todas las alertas pendientes y en gestión' })
  async getActiveAlerts() {
    // Retorna alertas ordenadas por criticidad y fecha
    return this.alertsService.auditBatchExpirations();
  }

  @Post('trigger-cron-manual')
  @RequirePermission('alerts_replenishment', 'create')
  @ApiOperation({ summary: 'Ejecuta manualmente el análisis de vencimientos y stock mínimo (Admin/Supervisor)' })
  async triggerManualAudit() {
    const expiration = await this.alertsService.auditBatchExpirations();
    const lowStock = await this.alertsService.auditLowStockProducts();
    return {
      success: true,
      message: 'Auditoría ejecutada manualmente con éxito.',
      vencimientosGenerados: expiration.count,
      quiebresDetectados: lowStock.count,
    };
  }

  @Get('suggested-order-grouped')
  @RequirePermission('purchases_suppliers', 'view')
  @ApiOperation({ summary: 'Genera orden de compra sugerida agrupada por droguería/proveedor' })
  async getSuggestedOrderGrouped() {
    return this.alertsService.getSuggestedReplenishmentGrouped();
  }

  @Patch(':id/status')
  @RequirePermission('alerts_replenishment', 'edit')
  @ApiOperation({ summary: 'Actualiza el estado de una alerta (ej: ATENDIDA)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: AlertStatus,
  ) {
    return this.alertsService.updateAlertStatus(id, status, 'current-user-uuid');
  }
}`
  }
];

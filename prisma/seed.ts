// ==============================================================================
// BOTICA NOVA SALUD - SCRIPT SEED DE DATOS DE EJEMPLO
// Archivo: prisma/seed.ts
// ==============================================================================

import { PrismaClient, PresentationType, BatchStatus, MovementType, DocType, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos semilla (Seed) para Botica Nova Salud...');

  // 1. LIMPIEZA PREVIA ORDENADA
  await prisma.systemAuditLog.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.saleItemBatch.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.laboratory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.module.deleteMany();
  await prisma.userProfile.deleteMany();

  // 2. CREACIÓN DE MÓDULOS DEL SISTEMA
  const modulesData = [
    { id: 'dashboard', name: 'Dashboard Resumen', sortOrder: 1, icon: 'LayoutDashboard' },
    { id: 'pos_sales', name: 'Punto de Venta (POS)', sortOrder: 2, icon: 'ShoppingCart' },
    { id: 'inventory_batches', name: 'Inventario & Lotes FEFO', sortOrder: 3, icon: 'Boxes' },
    { id: 'customers_loyalty', name: 'Atención al Cliente', sortOrder: 4, icon: 'Users' },
    { id: 'purchases_suppliers', name: 'Compras & Droguerías', sortOrder: 5, icon: 'Truck' },
    { id: 'alerts_replenishment', name: 'Centro de Alertas', sortOrder: 6, icon: 'BellRing' },
    { id: 'reports_bi', name: 'Reportes & Curva ABC', sortOrder: 7, icon: 'BarChart3' },
    { id: 'auth_rbac', name: 'Usuarios & Matriz RBAC', sortOrder: 8, icon: 'ShieldCheck' },
    { id: 'audit_forensics', name: 'Auditoría Forense', sortOrder: 9, icon: 'FileText' },
  ];

  for (const mod of modulesData) {
    await prisma.module.create({ data: mod });
  }

  // 3. ADMINISTRADOR PROPIETARIO (Inmutable)
  const adminId = 'a0000000-0000-0000-0000-000000000001';
  const rootAdmin = await prisma.userProfile.create({
    data: {
      id: adminId,
      dni: '10203040',
      firstName: 'Carlos Alberto',
      lastName: 'Mendoza Vera',
      email: 'admin@novasalud.pe',
      phone: '987654321',
      roleTitle: 'Administrador Propietario',
      isRootAdmin: true,
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Cajero y Almacenero de prueba
  const cashierId = 'b0000000-0000-0000-0000-000000000002';
  const cashier = await prisma.userProfile.create({
    data: {
      id: cashierId,
      dni: '71829304',
      firstName: 'Juan Manuel',
      lastName: 'Pérez García',
      email: 'cajero@novasalud.pe',
      phone: '912345678',
      roleTitle: 'Cajero / Atención Mostrador',
      isRootAdmin: false,
      isActive: true,
      mustChangePassword: true,
    },
  });

  // Permisos para el Cajero (Solo POS, Clientes e Inventario lectura)
  await prisma.userPermission.createMany({
    data: [
      { userId: cashierId, moduleId: 'pos_sales', canView: true, canCreate: true, canEdit: false, canDelete: false, grantedById: adminId },
      { userId: cashierId, moduleId: 'customers_loyalty', canView: true, canCreate: true, canEdit: false, canDelete: false, grantedById: adminId },
      { userId: cashierId, moduleId: 'inventory_batches', canView: true, canCreate: false, canEdit: false, canDelete: false, grantedById: adminId },
    ],
  });

  // 4. CATEGORÍAS TERAPÉUTICAS
  const catAntibioticos = await prisma.category.create({
    data: { name: 'Antibióticos & Antimicrobianos', slug: 'antibioticos', description: 'Tratamiento de infecciones bacterianas' },
  });
  const catAnalgesicos = await prisma.category.create({
    data: { name: 'Analgésicos & Antipiréticos', slug: 'analgesicos', description: 'Control de dolor y fiebre' },
  });
  const catGastro = await prisma.category.create({
    data: { name: 'Gastroenterología & Antiácidos', slug: 'gastro', description: 'Inhibidores de bomba y protectores gástricos' },
  });

  // 5. LABORATORIOS Y PROVEEDORES
  const labFarmaindustria = await prisma.laboratory.create({
    data: { name: 'Farmaindustria S.A.', country: 'Perú' },
  });
  const labBago = await prisma.laboratory.create({
    data: { name: 'Laboratorios Bagó del Perú S.A.', country: 'Argentina / Perú' },
  });

  const supplierDrogueria = await prisma.supplier.create({
    data: {
      ruc: '20100123456',
      businessName: 'Droguería Distribuidora Nova Farma S.A.C.',
      contactName: 'Lic. Miguel Falconí',
      phone: '(01) 513-8000',
      email: 'ventas@novafarma.pe',
      address: 'Av. Industrial 1420, Lima',
    },
  });

  // 6. MEDICAMENTOS DE ALTA ROTACIÓN
  const prodAmoxicilina = await prisma.product.create({
    data: {
      barcode: '7750123456789',
      name: 'Amoxicilina 500mg Cápsulas',
      genericName: 'Amoxicilina',
      brandName: 'Amoxil',
      concentration: '500 mg',
      presentation: PresentationType.CAJA,
      sanitaryRegistration: 'EE-04521-DIGEMID',
      categoryId: catAntibioticos.id,
      laboratoryId: labFarmaindustria.id,
      costPrice: 0.35,
      salePrice: 0.80,
      minStock: 30,
      maxStock: 150,
      requiresPrescription: true,
    },
  });

  const prodIbuprofeno = await prisma.product.create({
    data: {
      barcode: '7750987654321',
      name: 'Ibuprofeno 400mg Tabletas',
      genericName: 'Ibuprofeno',
      brandName: 'Doloral',
      concentration: '400 mg',
      presentation: PresentationType.BLISTER,
      sanitaryRegistration: 'EE-01298-DIGEMID',
      categoryId: catAnalgesicos.id,
      laboratoryId: labBago.id,
      costPrice: 0.20,
      salePrice: 0.50,
      minStock: 50,
      maxStock: 200,
    },
  });

  // 7. LOTES PARA DEMOSTRACIÓN FEFO (Un lote vence pronto, otro después, y uno vencido bloqueado)
  const today = new Date();
  
  // Lote 1: Próximo a vencer (en 30 días) -> ¡Debe salir PRIMERO por FEFO!
  const exp30Days = new Date();
  exp30Days.setDate(today.getDate() + 30);
  await prisma.batch.create({
    data: {
      productId: prodAmoxicilina.id,
      batchCode: 'LOTE-AMX-2026-PRIORIDAD-1',
      expirationDate: exp30Days,
      currentStock: 25,
      initialStock: 50,
      supplierId: supplierDrogueria.id,
      status: BatchStatus.PROXIMO_VENCER,
    },
  });

  // Lote 2: Vence en 12 meses -> Sale SEGUNDO si el lote 1 se agota
  const exp1Year = new Date();
  exp1Year.setFullYear(today.getFullYear() + 1);
  await prisma.batch.create({
    data: {
      productId: prodAmoxicilina.id,
      batchCode: 'LOTE-AMX-2027-RESERVA-2',
      expirationDate: exp1Year,
      currentStock: 100,
      initialStock: 100,
      supplierId: supplierDrogueria.id,
      status: BatchStatus.VIGENTE,
    },
  });

  // Lote 3: VENCIDO (Fecha anterior a hoy) -> ¡El motor FEFO debe BLOQUEARLO con 0 unidades vendibles!
  const expExpired = new Date();
  expExpired.setDate(today.getDate() - 15);
  await prisma.batch.create({
    data: {
      productId: prodAmoxicilina.id,
      batchCode: 'LOTE-AMX-VENCIDO-BLOQUEADO',
      expirationDate: expExpired,
      currentStock: 10,
      initialStock: 50,
      supplierId: supplierDrogueria.id,
      status: BatchStatus.VENCIDO,
    },
  });

  // 8. CLIENTE DE EJEMPLO
  await prisma.customer.create({
    data: {
      docType: DocType.DNI,
      docNumber: '45892134',
      fullName: 'Rosa María Chávez Ortiz',
      phone: '984512367',
      email: 'rosa.chavez@gmail.com',
      address: 'Jr. Los Álamos 340, Breña',
    },
  });

  console.log('✔ Seed completado con éxito: Administrador, Cajero, Catálogo, Lotes FEFO y Proveedor listos.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

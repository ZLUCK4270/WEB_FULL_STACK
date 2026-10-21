import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Batch,
  Sale,
  CartItem,
  CashRegister,
  CashMovement,
  Supplier,
  PurchaseOrder,
  Customer,
  StaffUser,
  SystemAlert,
  ReceiptType,
  PaymentMethod,
  BackupScheduleConfig,
  BackupRecord,
  BackupScope,
  ActivityLogEntry,
  ActivityActionCategory,
  ActivitySeverity
} from '../types/pharmacy';
import { useWebPush } from './WebPushContext';
import {
  createBackupPayload,
  downloadBackupFile,
  computeNextRunTimestamp,
  BackupDataPayload
} from '../utils/backupService';

// --- INITIAL SEED DATA ---
const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'usr-1',
    username: 'cmendoza',
    password: 'regente2026',
    name: 'Dr. Carlos Mendoza Flores',
    role: 'regente',
    roleTitle: 'Farmacéutico Regente Titular',
    dni: '43928172',
    email: 'cmendoza@novasalud.pe',
    colegiatura: 'CQFP N° 18492',
    activeShift: 'mañana',
    avatarInitials: 'CM',
    allowedTabs: [
      'dashboard',
      'pos',
      'inventory',
      'cash',
      'purchases',
      'alerts',
      'customers',
      'staff',
      'reports',
      'backups',
      'audit',
      'sql'
    ],
    permissions: {
      canSell: true,
      canReceiveBatches: true,
      canAdjustStock: true,
      canOpenCloseCash: true,
      canViewFinancials: true,
      canManageStaff: true,
      canSignDigemidReports: true,
    }
  },
  {
    id: 'usr-2',
    username: 'amorales',
    password: 'caja2026',
    name: 'Ana Morales Quispe',
    role: 'cajero',
    roleTitle: 'Técnica en Farmacia / Cajera POS',
    dni: '71829341',
    email: 'amorales@novasalud.pe',
    activeShift: 'mañana',
    avatarInitials: 'AM',
    allowedTabs: [
      'dashboard',
      'pos',
      'cash',
      'customers',
      'alerts'
    ],
    permissions: {
      canSell: true,
      canReceiveBatches: false,
      canAdjustStock: false,
      canOpenCloseCash: true,
      canViewFinancials: false,
      canManageStaff: false,
      canSignDigemidReports: false,
    }
  },
  {
    id: 'usr-3',
    username: 'rdiaz',
    password: 'admin2026',
    name: 'Lic. Roberto Díaz Salazar',
    role: 'admin',
    roleTitle: 'Administrador General de Operaciones',
    dni: '10928374',
    email: 'rdiaz@novasalud.pe',
    activeShift: 'mañana',
    avatarInitials: 'RD',
    allowedTabs: [
      'dashboard',
      'pos',
      'inventory',
      'cash',
      'purchases',
      'alerts',
      'customers',
      'staff',
      'reports',
      'backups',
      'audit',
      'sql'
    ],
    permissions: {
      canSell: true,
      canReceiveBatches: true,
      canAdjustStock: true,
      canOpenCloseCash: true,
      canViewFinancials: true,
      canManageStaff: true,
      canSignDigemidReports: false,
    }
  },
  {
    id: 'usr-4',
    username: 'ltorres',
    password: 'almacen2026',
    name: 'Luis Torres Valdivia',
    role: 'almacen',
    roleTitle: 'Asistente de Almacén y Logística',
    dni: '76543210',
    email: 'ltorres@novasalud.pe',
    activeShift: 'mañana',
    avatarInitials: 'LT',
    allowedTabs: [
      'dashboard',
      'inventory',
      'purchases',
      'alerts'
    ],
    permissions: {
      canSell: false,
      canReceiveBatches: true,
      canAdjustStock: true,
      canOpenCloseCash: false,
      canViewFinancials: false,
      canManageStaff: false,
      canSignDigemidReports: false,
    }
  }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    ruc: '20100123456',
    name: 'Droguería Suiza Lab S.A.C.',
    phone: '(01) 419-5000',
    email: 'pedidos@suizalab.com.pe',
    address: 'Av. Elmer Faucett 1920, Callao',
    contactPerson: 'Ing. Martín Solari',
    paymentTerms: 'Crédito 30 días',
    rating: 4.9
  },
  {
    id: 'sup-2',
    ruc: '20100234567',
    name: 'Medifarma Perú S.A.',
    phone: '(01) 619-2000',
    email: 'ventas@medifarma.com.pe',
    address: 'Jr. Ecuador 787, Lima',
    contactPerson: 'Lic. Patricia Vega',
    paymentTerms: 'Crédito 15 días',
    rating: 4.8
  },
  {
    id: 'sup-3',
    ruc: '20251239871',
    name: 'Alfaro Distribuciones Farmacéuticas',
    phone: '(01) 326-1144',
    email: 'atencion@alfarodist.com.pe',
    address: 'Av. Nicolás Arriola 1420, San Luis, Lima',
    contactPerson: 'Carlos Alfaro',
    paymentTerms: 'Contado contra entrega',
    rating: 4.6
  },
  {
    id: 'sup-4',
    ruc: '20100876543',
    name: 'Farmaindustria S.A.',
    phone: '(01) 513-8600',
    email: 'contacto@farmaindustria.com.pe',
    address: 'Av. Mariscal Miller 2151, Lince, Lima',
    contactPerson: 'Dra. Elena Ruiz',
    paymentTerms: 'Crédito 30 días',
    rating: 4.7
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'MED-001',
    name: 'Amoxicilina 500mg',
    genericName: 'Amoxicilina Trihidrato',
    category: 'Antibióticos y Antimicrobianos',
    concentration: '500 mg',
    presentation: 'Caja x 100 cápsulas',
    laboratory: 'Medifarma Perú',
    unitPrice: 1.20, // S/ por cápsula / pastilla
    minStock: 80,
    requiresPrescription: true,
    isControlled: false,
    location: 'Estante A-01 (Antibióticos)'
  },
  {
    id: 'prod-2',
    code: 'MED-002',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol (Acetaminofén)',
    category: 'Analgésicos y Antipiréticos',
    concentration: '500 mg',
    presentation: 'Caja x 100 tabletas',
    laboratory: 'AC Farma',
    unitPrice: 0.50,
    minStock: 150,
    requiresPrescription: false,
    isControlled: false,
    location: 'Estante A-03 (Mostrador Rápido)'
  },
  {
    id: 'prod-3',
    code: 'MED-003',
    name: 'Ibuprofeno 400mg',
    genericName: 'Ibuprofeno',
    category: 'Analgésicos y Antipiréticos',
    concentration: '400 mg',
    presentation: 'Caja x 100 tabletas recubiertas',
    laboratory: 'Farmaindustria S.A.',
    unitPrice: 0.80,
    minStock: 100,
    requiresPrescription: false,
    isControlled: false,
    location: 'Estante A-04 (Analgésicos)'
  },
  {
    id: 'prod-4',
    code: 'MED-004',
    name: 'Losartán Potásico 50mg',
    genericName: 'Losartán Potásico',
    category: 'Antihipertensivos y Cardiológicos',
    concentration: '50 mg',
    presentation: 'Caja x 30 tabletas',
    laboratory: 'Bagó del Perú',
    unitPrice: 1.50,
    minStock: 60,
    requiresPrescription: true,
    isControlled: false,
    location: 'Estante B-02 (Cardiovasculares)'
  },
  {
    id: 'prod-5',
    code: 'MED-005',
    name: 'Omeprazol 20mg',
    genericName: 'Omeprazol',
    category: 'Gastrointestinales',
    concentration: '20 mg',
    presentation: 'Caja x 30 cápsulas con microgránulos',
    laboratory: 'Medifarma Perú',
    unitPrice: 1.10,
    minStock: 70,
    requiresPrescription: false,
    isControlled: false,
    location: 'Estante C-01 (Gastro)'
  },
  {
    id: 'prod-6',
    code: 'MED-006',
    name: 'Cetirizina 10mg',
    genericName: 'Cetirizina Diclorhidrato',
    category: 'Antihistamínicos y Respiratorios',
    concentration: '10 mg',
    presentation: 'Caja x 20 tabletas',
    laboratory: 'Roemmers',
    unitPrice: 1.00,
    minStock: 50,
    requiresPrescription: false,
    isControlled: false,
    location: 'Estante C-03 (Alergias)'
  },
  {
    id: 'prod-7',
    code: 'MED-007',
    name: 'Azitromicina 500mg',
    genericName: 'Azitromicina Dihidrato',
    category: 'Antibióticos y Antimicrobianos',
    concentration: '500 mg',
    presentation: 'Caja x 3 tabletas',
    laboratory: 'Medifarma Perú',
    unitPrice: 6.50,
    minStock: 30,
    requiresPrescription: true,
    isControlled: false,
    location: 'Estante A-02 (Antibióticos)'
  },
  {
    id: 'prod-8',
    code: 'MED-008',
    name: 'Clonazepam 2mg',
    genericName: 'Clonazepam',
    category: 'Analgésicos y Antipiréticos',
    concentration: '2 mg',
    presentation: 'Caja x 30 comprimidos ranurados',
    laboratory: 'Roche Farma',
    unitPrice: 2.80,
    minStock: 25,
    requiresPrescription: true,
    isControlled: true, // Controlled prescription DIGEMID
    location: 'Vitrina de Seguridad (Controlados Lista IV)'
  },
  {
    id: 'prod-9',
    code: 'MED-009',
    name: 'Complejo B Forte',
    genericName: 'Tiamina + Piridoxina + Cianocobalamina',
    category: 'Vitaminas y Suplementos',
    concentration: '100mg + 100mg + 1000mcg',
    presentation: 'Caja x 3 ampollas inyectables',
    laboratory: 'Bagó del Perú',
    unitPrice: 12.00,
    minStock: 20,
    requiresPrescription: false,
    isControlled: false,
    location: 'Estante D-01 (Inyectables)'
  },
  {
    id: 'prod-10',
    code: 'MED-010',
    name: 'Alcohol Medicinal 70° (1 Litro)',
    genericName: 'Alcohol Etílico 70° GL',
    category: 'Cuidado Personal y Primeros Auxilios',
    concentration: '70%',
    presentation: 'Frasco x 1000 ml',
    laboratory: 'Laboratorios Alkofarma',
    unitPrice: 9.50,
    minStock: 15,
    requiresPrescription: false,
    isControlled: false,
    location: 'Almacén Central / Primeros Auxilios'
  }
];

// Batches with realistic FEFO status
const INITIAL_BATCHES: Batch[] = [
  // Amoxicilina 500mg (Prod 1): Multiple lots for FEFO demo
  {
    id: 'bat-101',
    productId: 'prod-1',
    batchCode: 'LOT-AMX-2026-11',
    expirationDate: '2026-11-20', // ~1.5 months away (Warning)
    stock: 24,
    initialStock: 100,
    unitCost: 0.65,
    supplierName: 'Medifarma Perú S.A.',
    status: 'active',
    receivedDate: '2025-11-10'
  },
  {
    id: 'bat-102',
    productId: 'prod-1',
    batchCode: 'LOT-AMX-2027-04',
    expirationDate: '2027-04-15', // ~6 months away
    stock: 90,
    initialStock: 120,
    unitCost: 0.68,
    supplierName: 'Medifarma Perú S.A.',
    status: 'active',
    receivedDate: '2026-04-02'
  },
  {
    id: 'bat-103',
    productId: 'prod-1',
    batchCode: 'LOT-AMX-2025-05',
    expirationDate: '2025-05-15', // Expired lot in quarantine
    stock: 12,
    initialStock: 100,
    unitCost: 0.60,
    supplierName: 'Medifarma Perú S.A.',
    status: 'expired',
    quarantineReason: 'Fecha de caducidad vencida según auditoría DIGEMID',
    receivedDate: '2024-05-01'
  },

  // Paracetamol 500mg (Prod 2)
  {
    id: 'bat-201',
    productId: 'prod-2',
    batchCode: 'LOT-PAR-2026-12',
    expirationDate: '2026-12-10',
    stock: 85,
    initialStock: 200,
    unitCost: 0.22,
    supplierName: 'Alfaro Distribuciones Farmacéuticas',
    status: 'active',
    receivedDate: '2025-12-05'
  },
  {
    id: 'bat-202',
    productId: 'prod-2',
    batchCode: 'LOT-PAR-2027-08',
    expirationDate: '2027-08-30',
    stock: 180,
    initialStock: 200,
    unitCost: 0.24,
    supplierName: 'Alfaro Distribuciones Farmacéuticas',
    status: 'active',
    receivedDate: '2026-08-12'
  },

  // Ibuprofeno 400mg (Prod 3)
  {
    id: 'bat-301',
    productId: 'prod-3',
    batchCode: 'LOT-IBU-2026-10',
    expirationDate: '2026-10-25', // CRITICAL: < 30 days
    stock: 22,
    initialStock: 150,
    unitCost: 0.38,
    supplierName: 'Farmaindustria S.A.',
    status: 'active',
    receivedDate: '2025-10-18'
  },
  {
    id: 'bat-302',
    productId: 'prod-3',
    batchCode: 'LOT-IBU-2027-11',
    expirationDate: '2027-11-15',
    stock: 130,
    initialStock: 150,
    unitCost: 0.40,
    supplierName: 'Farmaindustria S.A.',
    status: 'active',
    receivedDate: '2026-05-10'
  },

  // Losartán 50mg (Prod 4)
  {
    id: 'bat-401',
    productId: 'prod-4',
    batchCode: 'LOT-LOS-2027-06',
    expirationDate: '2027-06-30',
    stock: 75,
    initialStock: 100,
    unitCost: 0.72,
    supplierName: 'Droguería Suiza Lab S.A.C.',
    status: 'active',
    receivedDate: '2026-06-15'
  },

  // Omeprazol 20mg (Prod 5)
  {
    id: 'bat-501',
    productId: 'prod-5',
    batchCode: 'LOT-OME-2027-03',
    expirationDate: '2027-03-12',
    stock: 82,
    initialStock: 100,
    unitCost: 0.48,
    supplierName: 'Medifarma Perú S.A.',
    status: 'active',
    receivedDate: '2026-03-01'
  },

  // Cetirizina 10mg (Prod 6) - Stock bajo
  {
    id: 'bat-601',
    productId: 'prod-6',
    batchCode: 'LOT-CET-2027-05',
    expirationDate: '2027-05-20',
    stock: 18, // < minStock 50! Warning
    initialStock: 80,
    unitCost: 0.45,
    supplierName: 'Alfaro Distribuciones Farmacéuticas',
    status: 'active',
    receivedDate: '2026-02-15'
  },

  // Azitromicina 500mg (Prod 7)
  {
    id: 'bat-701',
    productId: 'prod-7',
    batchCode: 'LOT-AZI-2027-09',
    expirationDate: '2027-09-18',
    stock: 36,
    initialStock: 50,
    unitCost: 3.20,
    supplierName: 'Medifarma Perú S.A.',
    status: 'active',
    receivedDate: '2026-07-10'
  },

  // Clonazepam 2mg (Prod 8) - Controlado
  {
    id: 'bat-801',
    productId: 'prod-8',
    batchCode: 'LOT-CLO-2027-12',
    expirationDate: '2027-12-05',
    stock: 28,
    initialStock: 30,
    unitCost: 1.40,
    supplierName: 'Droguería Suiza Lab S.A.C.',
    status: 'active',
    receivedDate: '2026-01-20'
  },

  // Complejo B Forte (Prod 9)
  {
    id: 'bat-901',
    productId: 'prod-9',
    batchCode: 'LOT-CPB-2027-07',
    expirationDate: '2027-07-28',
    stock: 24,
    initialStock: 30,
    unitCost: 6.50,
    supplierName: 'Droguería Suiza Lab S.A.C.',
    status: 'active',
    receivedDate: '2026-04-12'
  },

  // Alcohol 70° (Prod 10)
  {
    id: 'bat-1001',
    productId: 'prod-10',
    batchCode: 'LOT-ALC-2028-02',
    expirationDate: '2028-02-28',
    stock: 19,
    initialStock: 25,
    unitCost: 5.20,
    supplierName: 'Alfaro Distribuciones Farmacéuticas',
    status: 'active',
    receivedDate: '2026-02-10'
  },
  // Lote Crítico próximo a vencer en las próximas 24 horas (Alerta Inmediata FEFO)
  {
    id: 'bat-urg-24h',
    productId: 'prod-5',
    batchCode: 'LOT-OME-24H-CRIT',
    expirationDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString().split('T')[0],
    stock: 8,
    initialStock: 40,
    unitCost: 0.48,
    supplierName: 'Medifarma Perú S.A.',
    status: 'active',
    receivedDate: '2025-10-09'
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    docType: 'DNI',
    docNumber: '41928374',
    fullName: 'María Elena Salazar Ponce',
    phone: '987 654 321',
    email: 'msalazar@gmail.com',
    address: 'Jr. Los Álamos 452, Breña, Lima',
    allergies: ['Penicilina', 'Sulfa'],
    chronicConditions: ['Hipertensión Arterial'],
    totalPurchases: 450.80,
    lastPurchaseDate: '2026-10-06'
  },
  {
    id: 'cust-2',
    docType: 'DNI',
    docNumber: '10293847',
    fullName: 'Jorge Luis Huamán Ramos',
    phone: '992 113 445',
    email: 'jhuaman@hotmail.com',
    address: 'Av. Brasil 1820, Jesús María',
    allergies: [],
    chronicConditions: ['Diabetes Tipo 2'],
    totalPurchases: 620.00,
    lastPurchaseDate: '2026-10-07'
  },
  {
    id: 'cust-3',
    docType: 'RUC',
    docNumber: '20601928374',
    fullName: 'Clínica Dental San Juan E.I.R.L.',
    phone: '(01) 424-8899',
    email: 'compras@dentalsanjuan.pe',
    address: 'Av. Arica 650, Breña',
    allergies: [],
    chronicConditions: [],
    totalPurchases: 1850.50,
    lastPurchaseDate: '2026-10-05'
  }
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'oc-1',
    orderNumber: 'OC-2026-0041',
    supplierId: 'sup-3',
    supplierName: 'Alfaro Distribuciones Farmacéuticas',
    date: '2026-10-05',
    items: [
      { productId: 'prod-6', productName: 'Cetirizina 10mg', quantity: 100, unitCost: 0.45, subtotal: 45.00 },
      { productId: 'prod-2', productName: 'Paracetamol 500mg', quantity: 200, unitCost: 0.22, subtotal: 44.00 }
    ],
    total: 89.00,
    status: 'pendiente',
    notes: 'Reposición urgente por quiebre de stock de Cetirizina.'
  },
  {
    id: 'oc-2',
    orderNumber: 'OC-2026-0040',
    supplierId: 'sup-2',
    supplierName: 'Medifarma Perú S.A.',
    date: '2026-09-28',
    items: [
      { productId: 'prod-1', productName: 'Amoxicilina 500mg', quantity: 120, unitCost: 0.65, subtotal: 78.00 },
      { productId: 'prod-5', productName: 'Omeprazol 20mg', quantity: 80, unitCost: 0.48, subtotal: 38.40 }
    ],
    total: 116.40,
    status: 'recibido',
    receivedAt: '2026-10-01',
    notes: 'Pedido mensual habitual.'
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    receiptType: 'boleta',
    receiptNumber: 'B001-000481',
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    customerName: 'María Elena Salazar Ponce',
    customerDoc: '41928374',
    cashierName: 'Ana Morales Quispe',
    cashierId: 'usr-2',
    items: [
      {
        productId: 'prod-4',
        productName: 'Losartán Potásico 50mg',
        genericName: 'Losartán Potásico',
        batchCode: 'LOT-LOS-2027-06',
        expirationDate: '2027-06-30',
        quantity: 30,
        unitPrice: 1.50,
        subtotal: 45.00
      },
      {
        productId: 'prod-5',
        productName: 'Omeprazol 20mg',
        genericName: 'Omeprazol',
        batchCode: 'LOT-OME-2027-03',
        expirationDate: '2027-03-12',
        quantity: 10,
        unitPrice: 1.10,
        subtotal: 11.00
      }
    ],
    subtotal: 47.46,
    igv: 8.54,
    discountTotal: 0,
    total: 56.00,
    paymentMethod: 'yape',
    amountPaid: 56.00,
    change: 0,
    operationCode: 'OP-983141'
  },
  {
    id: 'sale-2',
    receiptType: 'boleta',
    receiptNumber: 'B001-000482',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    customerName: 'Público General',
    customerDoc: '00000000',
    cashierName: 'Ana Morales Quispe',
    cashierId: 'usr-2',
    items: [
      {
        productId: 'prod-2',
        productName: 'Paracetamol 500mg',
        genericName: 'Paracetamol (Acetaminofén)',
        batchCode: 'LOT-PAR-2026-12',
        expirationDate: '2026-12-10',
        quantity: 10,
        unitPrice: 0.50,
        subtotal: 5.00
      },
      {
        productId: 'prod-3',
        productName: 'Ibuprofeno 400mg',
        genericName: 'Ibuprofeno',
        batchCode: 'LOT-IBU-2026-10',
        expirationDate: '2026-10-25',
        quantity: 10,
        unitPrice: 0.80,
        subtotal: 8.00
      }
    ],
    subtotal: 11.02,
    igv: 1.98,
    discountTotal: 0,
    total: 13.00,
    paymentMethod: 'efectivo',
    amountPaid: 20.00,
    change: 7.00
  },
  {
    id: 'sale-3',
    receiptType: 'ticket',
    receiptNumber: 'T001-001209',
    date: new Date(Date.now() - 3600000 * 1).toISOString(),
    customerName: 'Jorge Luis Huamán Ramos',
    customerDoc: '10293847',
    cashierName: 'Ana Morales Quispe',
    cashierId: 'usr-2',
    items: [
      {
        productId: 'prod-10',
        productName: 'Alcohol Medicinal 70° (1 Litro)',
        genericName: 'Alcohol Etílico 70° GL',
        batchCode: 'LOT-ALC-2028-02',
        expirationDate: '2028-02-28',
        quantity: 2,
        unitPrice: 9.50,
        subtotal: 19.00
      }
    ],
    subtotal: 16.10,
    igv: 2.90,
    discountTotal: 0,
    total: 19.00,
    paymentMethod: 'tarjeta',
    amountPaid: 19.00,
    change: 0,
    operationCode: 'VISA-4421'
  }
];

const INITIAL_CASH_MOVEMENTS: CashMovement[] = [
  {
    id: 'mov-1',
    type: 'ingreso',
    concept: 'Fondo de Apertura de Caja (Sencillo)',
    amount: 250.00,
    category: 'fondo_inicial',
    timestamp: '2026-10-07T08:00:00.000Z',
    responsibleName: 'Ana Morales Quispe'
  },
  {
    id: 'mov-2',
    type: 'egreso',
    concept: 'Compra de rollos térmicos para ticketera POS',
    amount: 25.00,
    category: 'gasto_operativo',
    timestamp: '2026-10-07T10:30:00.000Z',
    responsibleName: 'Ana Morales Quispe',
    voucherNumber: 'B003-882'
  }
];

const INITIAL_CASH_REGISTER: CashRegister = {
  id: 'caja-01',
  isOpen: true,
  openedAt: '2026-10-07T08:00:00.000Z',
  cashierName: 'Ana Morales Quispe',
  shift: 'mañana',
  initialFund: 250.00,
  currentCash: 250.00 - 25.00 + 13.00, // Initial + cash sales - expenses = S/ 238.00
  totalSalesCash: 13.00,
  totalSalesYape: 56.00,
  totalSalesCard: 19.00,
  totalInflow: 250.00 + 13.00,
  totalOutflow: 25.00,
  movements: INITIAL_CASH_MOVEMENTS
};

// --- PHARMACY CONTEXT INTERFACE ---
interface PharmacyContextType {
  products: Product[];
  batches: Batch[];
  sales: Sale[];
  cashRegister: CashRegister;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  staffUsers: StaffUser[];
  currentUser: StaffUser;
  alerts: SystemAlert[];

  // User switcher
  switchCurrentUser: (userId: string) => void;

  // FEFO & Inventory Helpers
  getValidBatchesForProduct: (productId: string) => Batch[];
  getProductTotalStock: (productId: string) => number;
  getProductFefoEarliestBatch: (productId: string) => Batch | null;
  getDaysUntilExpiration: (expirationDate: string) => number;

  // Actions
  executeFefoSale: (params: {
    cartItems: { product: Product; quantity: number }[];
    receiptType: ReceiptType;
    customerName: string;
    customerDoc: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };

  receiveNewBatch: (newBatch: {
    productId: string;
    batchCode: string;
    expirationDate: string;
    stock: number;
    unitCost: number;
    supplierName: string;
  }) => void;

  adjustBatchStock: (batchId: string, quantityDelta: number, reason: string, sendToQuarantine?: boolean) => void;

  openCashRegister: (initialFund: number, shift: 'mañana' | 'tarde' | 'noche') => void;
  closeCashRegister: (countedCash: number) => { difference: number; summary: CashRegister };
  addCashMovement: (type: 'ingreso' | 'egreso', concept: string, amount: number, category: CashMovement['category'], voucher?: string) => void;

  createPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'date' | 'status'>) => void;
  receivePurchaseOrder: (orderId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases'>) => Customer;

  dismissAlert: (alertId: string) => void;
  resolveAlertAction: (alertId: string, actionType: string) => void;

  // Staff & Permissions Management (Administrator)
  updateStaffPermissions: (userId: string, allowedTabs: string[], permissions?: Partial<StaffUser['permissions']>) => void;
  addStaffUser: (user: Omit<StaffUser, 'id' | 'avatarInitials'>) => StaffUser;
  updateStaffUserPassword: (userId: string, newPassword: string) => boolean;
  deleteStaffUser: (userId: string) => { success: boolean; error?: string };

  // Operational Management Date (Rotative Dates: 08/10, 09/10, 10/10, etc.)
  systemDate: string;
  setSystemDate: (date: string) => void;
  advanceSystemDate: (days?: number) => void;
  addQuickSale: (options?: { amount?: number; date?: string; customerName?: string; paymentMethod?: PaymentMethod }) => Sale;

  // Database Backup & Automatic Scheduling
  backupConfig: BackupScheduleConfig;
  backupHistory: BackupRecord[];
  updateBackupConfig: (config: Partial<BackupScheduleConfig>) => void;
  executeManualBackup: (scope: BackupScope, downloadImmediately?: boolean) => BackupRecord;
  executeScheduledBackupNow: () => BackupRecord;
  downloadBackupRecord: (recordId: string) => void;
  deleteBackupRecord: (recordId: string) => void;
  restoreFromBackup: (payload: BackupDataPayload) => { success: boolean; message: string };

  // Activity Log & Audit Trail (Trazabilidad en Tiempo Real)
  activityLogs: ActivityLogEntry[];
  logActivity: (entry: {
    category: ActivityActionCategory;
    action: string;
    description: string;
    severity?: ActivitySeverity;
    userId?: string;
    userName?: string;
    userRoleTitle?: string;
    metadata?: ActivityLogEntry['metadata'];
  }) => ActivityLogEntry;
  clearActivityLogs: () => void;

  // Session & Authentication
  isLoggedIn: boolean;
  login: (usernameOrId: string, password?: string, shift?: 'mañana' | 'tarde' | 'noche') => { success: boolean; error?: string; user?: StaffUser };
  logout: () => void;
}

const INITIAL_BACKUP_CONFIG: BackupScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  scheduledTime: '23:00',
  selectedDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  includeInventory: true,
  includeSales: true,
  includeCashRegister: true,
  includeCustomers: true,
  autoDownload: false,
  retentionCopies: 14,
  destination: 'local_vault',
  notifyOnCompletion: true,
  lastRunTimestamp: '2026-10-07T23:00:15.000Z',
  nextRunTimestamp: 'Hoy, 23:00 hrs'
};

const INITIAL_BACKUP_HISTORY: BackupRecord[] = [
  {
    id: 'BKP-20261007-2300',
    filename: 'backup_novasalud_completo_auto_2026-10-07_2300.json',
    timestamp: '2026-10-07T23:00:15.000Z',
    type: 'automatic',
    scope: 'all',
    sizeBytes: 48520,
    formattedSize: '47.38 KB',
    recordCounts: {
      products: 12,
      batches: 15,
      sales: 18,
      cashMovements: 5,
      customers: 6
    },
    totalSalesAmount: 1845.50,
    checksum: 'SHA256-4F9A2B11CD89E012',
    createdBy: 'Cron Automatizado del Sistema',
    status: 'completado'
  },
  {
    id: 'BKP-20261006-2300',
    filename: 'backup_novasalud_completo_auto_2026-10-06_2300.json',
    timestamp: '2026-10-06T23:00:08.000Z',
    type: 'automatic',
    scope: 'all',
    sizeBytes: 44210,
    formattedSize: '43.17 KB',
    recordCounts: {
      products: 12,
      batches: 15,
      sales: 14,
      cashMovements: 4,
      customers: 5
    },
    totalSalesAmount: 1420.00,
    checksum: 'SHA256-8A33E7B99042FCA1',
    createdBy: 'Cron Automatizado del Sistema',
    status: 'verificado'
  }
];

const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'act-001',
    timestamp: '2026-10-08T10:45:12.000Z',
    timeFormatted: '10:45:12',
    dateFormatted: '2026-10-08',
    category: 'VENTA',
    action: 'Dispensación POS FEFO',
    description: 'Venta Boleta B001-000542 emitida por S/ 68.50 a Público General. Asignación automática de lote FEFO LOT-AMX-2024.',
    userId: 'usr-2',
    userName: 'Ana Morales Quispe',
    userRoleTitle: 'Técnica en Farmacia / Cajera POS',
    severity: 'success',
    metadata: {
      receiptNumber: 'B001-000542',
      totalAmount: 68.50,
      productName: 'Amoxicilina 500mg',
      batchCode: 'LOT-AMX-2024'
    }
  },
  {
    id: 'act-002',
    timestamp: '2026-10-08T10:15:30.000Z',
    timeFormatted: '10:15:30',
    dateFormatted: '2026-10-08',
    category: 'PERMISOS',
    action: 'Modificación de Privilegios RBAC',
    description: 'Actualización de matriz de permisos: Asignación de acceso al módulo de Inventario y recepción de lotes para Luis Torres.',
    userId: 'usr-3',
    userName: 'Lic. Roberto Díaz Salazar',
    userRoleTitle: 'Administrador General de Operaciones',
    severity: 'warning',
    metadata: {
      affectedUser: 'Luis Torres Valdivia',
      permissionsChanged: ['canReceiveBatches'],
      allowedTabsCount: 3
    }
  },
  {
    id: 'act-003',
    timestamp: '2026-10-08T09:30:20.000Z',
    timeFormatted: '09:30:20',
    dateFormatted: '2026-10-08',
    category: 'INVENTARIO',
    action: 'Recepción de Mercadería & Lote',
    description: 'Ingreso al almacén de lote LOT-P-2026-99 (50 unidades) de Paracetamol 500mg. Proveedor: Droguería Medifarma.',
    userId: 'usr-4',
    userName: 'Luis Torres Valdivia',
    userRoleTitle: 'Asistente de Almacén y Logística',
    severity: 'info',
    metadata: {
      batchCode: 'LOT-P-2026-99',
      productName: 'Paracetamol 500mg',
      stockDelta: 50
    }
  },
  {
    id: 'act-004',
    timestamp: '2026-10-08T08:50:11.000Z',
    timeFormatted: '08:50:11',
    dateFormatted: '2026-10-08',
    category: 'INVENTARIO',
    action: 'Ajuste Manual de Stock por Merma',
    description: 'Ajuste de stock en lote LOT-IBU-400 (-2 unidades) por rotura de blíster en exhibidor. Registrado bajo acta interna.',
    userId: 'usr-1',
    userName: 'Dr. Carlos Mendoza Flores',
    userRoleTitle: 'Farmacéutico Regente Titular',
    severity: 'warning',
    metadata: {
      batchCode: 'LOT-IBU-400',
      stockDelta: -2,
      reason: 'Rotura de blíster en exhibidor de mostrador'
    }
  },
  {
    id: 'act-005',
    timestamp: '2026-10-08T08:00:05.000Z',
    timeFormatted: '08:00:05',
    dateFormatted: '2026-10-08',
    category: 'CAJA',
    action: 'Apertura de Turno & Fondo Inicial',
    description: 'Apertura de turno Mañana con fondo inicial de S/ 250.00 en gaveta principal.',
    userId: 'usr-2',
    userName: 'Ana Morales Quispe',
    userRoleTitle: 'Técnica en Farmacia / Cajera POS',
    severity: 'info',
    metadata: {
      shift: 'mañana',
      totalAmount: 250.00
    }
  },
  {
    id: 'act-006',
    timestamp: '2026-10-07T23:00:15.000Z',
    timeFormatted: '23:00:15',
    dateFormatted: '2026-10-07',
    category: 'RESPALDO',
    action: 'Copia de Seguridad Automática',
    description: 'Ejecución exitosa del cron de respaldo: backup_novasalud_completo_auto_2026-10-07_2300.json verificado con SHA-256.',
    userId: 'system',
    userName: 'Cron Automatizado del Sistema',
    userRoleTitle: 'Servicio Programador de Tareas',
    severity: 'success',
    metadata: {
      reason: 'Cierre de ciclo diario programado'
    }
  }
];

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [cashRegister, setCashRegister] = useState<CashRegister>(INITIAL_CASH_REGISTER);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    try {
      const stored = localStorage.getItem('novasalud_staff_users');
      if (stored) {
        const parsed: StaffUser[] = JSON.parse(stored);
        // Ensure every role includes 'dashboard' for the welcome portal
        return parsed.map(u => ({
          ...u,
          allowedTabs: u.allowedTabs.includes('dashboard') ? u.allowedTabs : ['dashboard', ...u.allowedTabs]
        }));
      }
    } catch (e) {}
    return INITIAL_STAFF;
  });
  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    try {
      const activeId = localStorage.getItem('novasalud_active_user_id');
      const stored = localStorage.getItem('novasalud_staff_users');
      const users: StaffUser[] = stored ? JSON.parse(stored) : INITIAL_STAFF;
      const found = users.find(u => u.id === activeId);
      if (found) {
        return {
          ...found,
          allowedTabs: found.allowedTabs.includes('dashboard') ? found.allowedTabs : ['dashboard', ...found.allowedTabs]
        };
      }
      return users[0] || INITIAL_STAFF[0];
    } catch (e) {
      return INITIAL_STAFF[0];
    }
  });
  // The system starts with the Login screen as requested
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Active Management Date (Rotative: 2026-10-08, 2026-10-09, 2026-10-10, etc.)
  const [systemDate, setSystemDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const advanceSystemDate = (days: number = 1) => {
    setSystemDate(prev => {
      const parts = prev.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + days);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  // --- REAL-TIME ACTIVITY LOGS & AUDIT TRAIL ---
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('novasalud_activity_logs');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_ACTIVITY_LOGS;
  });

  const logActivity = (entry: {
    category: ActivityActionCategory;
    action: string;
    description: string;
    severity?: ActivitySeverity;
    userId?: string;
    userName?: string;
    userRoleTitle?: string;
    metadata?: ActivityLogEntry['metadata'];
  }): ActivityLogEntry => {
    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];
    const newEntry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      timeFormatted,
      dateFormatted: systemDate,
      category: entry.category,
      action: entry.action,
      description: entry.description,
      userId: entry.userId || currentUser.id,
      userName: entry.userName || currentUser.name,
      userRoleTitle: entry.userRoleTitle || currentUser.roleTitle,
      severity: entry.severity || 'info',
      metadata: entry.metadata
    };

    setActivityLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 300);
      try {
        localStorage.setItem('novasalud_activity_logs', JSON.stringify(updated.slice(0, 100)));
      } catch (e) {}
      return updated;
    });

    return newEntry;
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    try {
      localStorage.removeItem('novasalud_activity_logs');
    } catch (e) {}
  };

  const addQuickSale = (options?: { amount?: number; date?: string; customerName?: string; paymentMethod?: PaymentMethod }): Sale => {
    const saleDateStr = options?.date || systemDate;
    const timeStr = new Date().toTimeString().split(' ')[0];
    const fullDate = `${saleDateStr}T${timeStr}.000Z`;
    const paymentMethod: PaymentMethod = options?.paymentMethod || (['efectivo', 'yape', 'tarjeta'][Math.floor(Math.random() * 3)] as PaymentMethod);
    const targetAmount = options?.amount || +(Math.floor(28 + Math.random() * 80) + 0.50).toFixed(2);

    const prod = products[Math.floor(Math.random() * products.length)] || products[0];
    const validBatch = batches.find(b => b.productId === prod.id && b.status === 'active') || batches[0];
    const subtotalBase = +(targetAmount / 1.18).toFixed(2);
    const igvBase = +(targetAmount - subtotalBase).toFixed(2);
    const serialNumber = `B001-${String(sales.length + 500).padStart(6, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptType: 'boleta',
      receiptNumber: serialNumber,
      date: fullDate,
      customerName: options?.customerName || 'Cliente en Mostrador',
      customerDoc: '42918274',
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          genericName: prod.genericName,
          batchCode: validBatch?.batchCode || 'LOT-QUICK-01',
          expirationDate: validBatch?.expirationDate || '2027-08-15',
          quantity: 2,
          unitPrice: +(targetAmount / 2).toFixed(2),
          subtotal: targetAmount
        }
      ],
      subtotal: subtotalBase,
      igv: igvBase,
      discountTotal: 0,
      total: targetAmount,
      paymentMethod,
      amountPaid: targetAmount,
      change: 0,
      operationCode: paymentMethod !== 'efectivo' ? `OP-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      notes: `Venta rotativa registrada en fecha ${saleDateStr}`
    };

    setSales(prev => [newSale, ...prev]);

    setCashRegister(prev => {
      const next = { ...prev };
      if (paymentMethod === 'efectivo') {
        next.currentCash += targetAmount;
        next.totalSalesCash += targetAmount;
        next.totalInflow += targetAmount;
      } else if (paymentMethod === 'yape') {
        next.totalSalesYape += targetAmount;
      } else if (paymentMethod === 'tarjeta') {
        next.totalSalesCard += targetAmount;
      }
      return next;
    });

    logActivity({
      category: 'VENTA',
      action: 'Venta Registrada POS',
      description: `Venta rotativa ${serialNumber} registrada por S/ ${targetAmount.toFixed(2)} (${paymentMethod.toUpperCase()}). Medicamento: ${prod.name}.`,
      severity: 'success',
      metadata: {
        receiptNumber: serialNumber,
        totalAmount: targetAmount,
        productName: prod.name,
        batchCode: validBatch?.batchCode
      }
    });

    return newSale;
  };

  const { sendPushAlert } = useWebPush();

  // Helper: calculate days to expiration
  const getDaysUntilExpiration = (expirationDate: string): number => {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: get only active (non-expired, non-quarantined) batches sorted by expiration ASC (FEFO)
  const getValidBatchesForProduct = (productId: string): Batch[] => {
    return batches
      .filter(b => b.productId === productId && b.status === 'active' && b.stock > 0)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  // Helper: total available valid stock for a product
  const getProductTotalStock = (productId: string): number => {
    return getValidBatchesForProduct(productId).reduce((sum, b) => sum + b.stock, 0);
  };

  // Helper: get the immediate next batch that FEFO will dispatch
  const getProductFefoEarliestBatch = (productId: string): Batch | null => {
    const valid = getValidBatchesForProduct(productId);
    return valid.length > 0 ? valid[0] : null;
  };

  // Dynamic system alerts derived from real-time batches and products
  const alerts = useMemo<SystemAlert[]>(() => {
    const list: SystemAlert[] = [];

    // 1. FEFO critical expiration alerts (< 30 days or already near)
    batches.forEach(b => {
      if (b.status === 'active' && b.stock > 0) {
        const days = getDaysUntilExpiration(b.expirationDate);
        const prod = products.find(p => p.id === b.productId);
        if (days <= 30 && days > 0) {
          list.push({
            id: `alert-fefo-${b.id}`,
            type: 'fefo_warning',
            severity: 'alta',
            title: `Vencimiento Próximo: ${prod?.name || 'Medicamento'}`,
            message: `El lote ${b.batchCode} tiene ${b.stock} unidades que vencen en ${days} días (${b.expirationDate}). Priorizar despacho inmediato o liquidación.`,
            productId: b.productId,
            batchId: b.id,
            date: new Date().toISOString(),
            resolved: false,
            actionLabel: 'Aplicar 25% Descuento',
            actionType: 'apply_discount'
          });
        }
      }
    });

    // 2. Stock low alerts (< minStock)
    products.forEach(p => {
      const stock = getProductTotalStock(p.id);
      if (stock <= p.minStock) {
        list.push({
          id: `alert-stock-${p.id}`,
          type: 'stock_low',
          severity: stock === 0 ? 'alta' : 'media',
          title: `Stock Bajo: ${p.name}`,
          message: `Stock actual: ${stock} unidades (Mínimo requerido: ${p.minStock}). Riesgo de quiebre de mostrador.`,
          productId: p.id,
          date: new Date().toISOString(),
          resolved: false,
          actionLabel: 'Emitir Orden de Compra',
          actionType: 'reorder'
        });
      }
    });

    // 3. Controlled medicines alert
    const controlled = products.filter(p => p.isControlled);
    if (controlled.length > 0) {
      list.push({
        id: 'alert-controlled-digemid',
        type: 'controlled_rx',
        severity: 'media',
        title: 'Auditoría DIGEMID: Psicotrópicos Lista IV',
        message: 'Clonazepam 2mg requiere retención obligatoria de receta médica firmada y registro en Libro Oficial.',
        date: new Date().toISOString(),
        resolved: false,
        actionLabel: 'Ver Libro DIGEMID',
        actionType: 'review'
      });
    }

    return list;
  }, [batches, products]);

  // Switch active user
  const switchCurrentUser = (userId: string) => {
    const found = staffUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      sendPushAlert({
        title: `Cambio de Rol: ${found.name}`,
        body: `Perfil activo: ${found.roleTitle}. Permisos de navegación actualizados (${found.allowedTabs.length} módulos habilitados).`,
        category: 'INFO'
      });
    }
  };

  // Execute FEFO Sale
  const executeFefoSale = (params: {
    cartItems: { product: Product; quantity: number }[];
    receiptType: ReceiptType;
    customerName: string;
    customerDoc: string;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => {
    const { cartItems, receiptType, customerName, customerDoc, paymentMethod, amountPaid, notes } = params;

    // Validate that all items have sufficient valid stock
    for (const item of cartItems) {
      const validStock = getProductTotalStock(item.product.id);
      if (item.quantity > validStock) {
        return {
          success: false,
          error: `Stock insuficiente para "${item.product.name}". Solicitado: ${item.quantity}, Disponible en lotes vigentes: ${validStock}.`
        };
      }
    }

    // Process each item deducting stock following FEFO
    const saleItemsDetail: Sale['items'] = [];
    const updatedBatches = [...batches];

    let totalAmount = 0;

    cartItems.forEach(item => {
      let needed = item.quantity;
      const validBatches = updatedBatches
        .filter(b => b.productId === item.product.id && b.status === 'active' && b.stock > 0)
        .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

      for (const b of validBatches) {
        if (needed <= 0) break;
        const take = Math.min(b.stock, needed);
        b.stock -= take;
        needed -= take;

        const subtotal = take * item.product.unitPrice;
        totalAmount += subtotal;

        saleItemsDetail.push({
          productId: item.product.id,
          productName: item.product.name,
          genericName: item.product.genericName,
          batchCode: b.batchCode,
          expirationDate: b.expirationDate,
          quantity: take,
          unitPrice: item.product.unitPrice,
          subtotal
        });
      }
    });

    setBatches(updatedBatches);

    // Calculate IGV & Totals (Perú IGV 18% included)
    const subtotalBase = +(totalAmount / 1.18).toFixed(2);
    const igvBase = +(totalAmount - subtotalBase).toFixed(2);
    const change = paymentMethod === 'efectivo' ? Math.max(0, amountPaid - totalAmount) : 0;

    // Generate electronic receipt serial
    const prefix = receiptType === 'factura' ? 'F001' : receiptType === 'boleta' ? 'B001' : 'T001';
    const serialNumber = `${prefix}-${String(sales.length + 483).padStart(6, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptType,
      receiptNumber: serialNumber,
      date: `${systemDate}T${new Date().toTimeString().split(' ')[0]}.000Z`,
      customerName: customerName || 'Público General',
      customerDoc: customerDoc || '00000000',
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      items: saleItemsDetail,
      subtotal: subtotalBase,
      igv: igvBase,
      discountTotal: 0,
      total: +totalAmount.toFixed(2),
      paymentMethod,
      amountPaid,
      change: +change.toFixed(2),
      operationCode: paymentMethod !== 'efectivo' ? `OP-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      notes
    };

    setSales(prev => [newSale, ...prev]);

    // Update Cash Register
    setCashRegister(prev => {
      const next = { ...prev };
      if (paymentMethod === 'efectivo') {
        next.currentCash += totalAmount;
        next.totalSalesCash += totalAmount;
        next.totalInflow += totalAmount;
      } else if (paymentMethod === 'yape') {
        next.totalSalesYape += totalAmount;
      } else if (paymentMethod === 'tarjeta') {
        next.totalSalesCard += totalAmount;
      }
      return next;
    });

    // Send Browser Push Notification on high value or important sale
    if (totalAmount > 50) {
      sendPushAlert({
        title: `Venta Confirmada: S/ ${totalAmount.toFixed(2)}`,
        body: `Comprobante ${serialNumber} emitido por ${currentUser.name}. Lotes FEFO descontados correctamente.`,
        category: 'INFO'
      });
    }

    logActivity({
      category: 'VENTA',
      action: 'Dispensación POS FEFO',
      description: `Comprobante ${receiptType.toUpperCase()} ${serialNumber} emitido por S/ ${totalAmount.toFixed(2)} (${newSale.items.length} productos). Cliente: ${customerName || 'Público General'}.`,
      severity: 'success',
      metadata: {
        receiptNumber: serialNumber,
        totalAmount,
        productName: newSale.items.map(i => i.productName).join(', ')
      }
    });

    return { success: true, sale: newSale };
  };

  // Receive New Batch (Purchases / Stock In)
  const receiveNewBatch = (newBatchData: {
    productId: string;
    batchCode: string;
    expirationDate: string;
    stock: number;
    unitCost: number;
    supplierName: string;
  }) => {
    const newBatch: Batch = {
      id: `bat-${Date.now()}`,
      productId: newBatchData.productId,
      batchCode: newBatchData.batchCode,
      expirationDate: newBatchData.expirationDate,
      stock: newBatchData.stock,
      initialStock: newBatchData.stock,
      unitCost: newBatchData.unitCost,
      supplierName: newBatchData.supplierName,
      status: 'active',
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setBatches(prev => [newBatch, ...prev]);

    // Push notification for warehouse entry
    const prod = products.find(p => p.id === newBatchData.productId);
    sendPushAlert({
      title: `Lote Ingresado: ${newBatchData.batchCode}`,
      body: `Se recibieron ${newBatchData.stock} uds de ${prod?.name || 'Medicamento'} con vencimiento ${newBatchData.expirationDate}.`,
      category: 'INFO',
      batchCode: newBatchData.batchCode
    });

    logActivity({
      category: 'INVENTARIO',
      action: 'Recepción de Lote en Almacén',
      description: `Recepción de lote ${newBatchData.batchCode} (${newBatchData.stock} unidades) de ${prod?.name || 'Medicamento'}. Proveedor: ${newBatchData.supplierName}. Vence: ${newBatchData.expirationDate}.`,
      severity: 'info',
      metadata: {
        productId: newBatchData.productId,
        productName: prod?.name,
        batchCode: newBatchData.batchCode,
        stockDelta: newBatchData.stock
      }
    });
  };

  // Adjust Batch Stock (damage, return, quarantine)
  const adjustBatchStock = (
    batchId: string,
    quantityDelta: number,
    reason: string,
    sendToQuarantine: boolean = false
  ) => {
    const targetBatch = batches.find(b => b.id === batchId);
    const prodTarget = targetBatch ? products.find(p => p.id === targetBatch.productId) : undefined;

    setBatches(prev =>
      prev.map(b => {
        if (b.id === batchId) {
          const newStock = Math.max(0, b.stock + quantityDelta);
          return {
            ...b,
            stock: newStock,
            status: sendToQuarantine ? 'quarantine' : newStock === 0 ? 'expired' : b.status,
            quarantineReason: sendToQuarantine ? reason : b.quarantineReason
          };
        }
        return b;
      })
    );

    logActivity({
      category: 'INVENTARIO',
      action: sendToQuarantine ? 'Envío a Cuarentena Sanitaria' : 'Ajuste Manual de Stock',
      description: `Ajuste en lote ${targetBatch?.batchCode || batchId}: ${quantityDelta > 0 ? '+' : ''}${quantityDelta} unidades de ${prodTarget?.name || 'Medicamento'}. Motivo: ${reason}.`,
      severity: sendToQuarantine ? 'critical' : 'warning',
      metadata: {
        batchCode: targetBatch?.batchCode,
        productName: prodTarget?.name,
        stockDelta: quantityDelta,
        reason
      }
    });
  };

  // Cash Register Operations
  const openCashRegister = (initialFund: number, shift: 'mañana' | 'tarde' | 'noche') => {
    const initialMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: 'ingreso',
      concept: `Apertura de turno ${shift.toUpperCase()} con fondo inicial`,
      amount: initialFund,
      category: 'fondo_inicial',
      timestamp: new Date().toISOString(),
      responsibleName: currentUser.name
    };

    setCashRegister({
      id: `caja-${Date.now()}`,
      isOpen: true,
      openedAt: new Date().toISOString(),
      cashierName: currentUser.name,
      shift,
      initialFund,
      currentCash: initialFund,
      totalSalesCash: 0,
      totalSalesYape: 0,
      totalSalesCard: 0,
      totalInflow: initialFund,
      totalOutflow: 0,
      movements: [initialMovement]
    });

    logActivity({
      category: 'CAJA',
      action: 'Apertura de Caja & Turno',
      description: `Apertura de caja en turno ${shift.toUpperCase()} con fondo inicial de S/ ${initialFund.toFixed(2)}. Responsable: ${currentUser.name}.`,
      severity: 'info',
      metadata: {
        shift,
        totalAmount: initialFund
      }
    });
  };

  const closeCashRegister = (countedCash: number) => {
    const expectedCash = cashRegister.currentCash;
    const difference = +(countedCash - expectedCash).toFixed(2);

    const closed = {
      ...cashRegister,
      isOpen: false,
      closedAt: new Date().toISOString(),
      currentCash: countedCash
    };

    setCashRegister(closed);

    sendPushAlert({
      title: 'Cierre de Caja Registrado',
      body: `Turno ${closed.shift}. Esperado S/ ${expectedCash.toFixed(2)}, Contado S/ ${countedCash.toFixed(2)}. Diferencia: S/ ${difference.toFixed(2)}.`,
      category: 'ALTO'
    });

    logActivity({
      category: 'CAJA',
      action: 'Arqueo & Cierre de Caja',
      description: `Cierre de turno ${closed.shift}. Efectivo contado: S/ ${countedCash.toFixed(2)}, Esperado: S/ ${expectedCash.toFixed(2)} (Diferencia: S/ ${difference.toFixed(2)}).`,
      severity: Math.abs(difference) > 5 ? 'warning' : 'success',
      metadata: {
        shift: closed.shift,
        totalAmount: countedCash
      }
    });

    return { difference, summary: closed };
  };

  const addCashMovement = (
    type: 'ingreso' | 'egreso',
    concept: string,
    amount: number,
    category: CashMovement['category'],
    voucher?: string
  ) => {
    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type,
      concept,
      amount,
      category,
      timestamp: new Date().toISOString(),
      responsibleName: currentUser.name,
      voucherNumber: voucher
    };

    setCashRegister(prev => ({
      ...prev,
      currentCash: type === 'ingreso' ? prev.currentCash + amount : prev.currentCash - amount,
      totalInflow: type === 'ingreso' ? prev.totalInflow + amount : prev.totalInflow,
      totalOutflow: type === 'egreso' ? prev.totalOutflow + amount : prev.totalOutflow,
      movements: [newMovement, ...prev.movements]
    }));

    logActivity({
      category: 'CAJA',
      action: `Movimiento de Caja: ${type === 'ingreso' ? 'Ingreso' : 'Egreso'}`,
      description: `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} de S/ ${amount.toFixed(2)} por "${concept}" (${category}).`,
      severity: type === 'egreso' ? 'warning' : 'info',
      metadata: {
        totalAmount: amount,
        reason: concept,
        voucherNumber: voucher
      }
    });
  };

  // Purchase Orders
  const createPurchaseOrder = (orderData: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'date' | 'status'>) => {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `oc-${Date.now()}`,
      orderNumber: `OC-2026-${String(purchaseOrders.length + 42).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pendiente'
    };

    setPurchaseOrders(prev => [newOrder, ...prev]);
  };

  const receivePurchaseOrder = (orderId: string) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    // Mark as received
    setPurchaseOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'recibido', receivedAt: new Date().toISOString().split('T')[0] } : o))
    );

    // Auto-generate batches for each item in the order
    order.items.forEach(item => {
      const year = new Date().getFullYear() + 2;
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const expDate = `${year}-${month}-28`;
      const code = `LOT-${item.productName.substring(0, 3).toUpperCase()}-${year}-${month}`;

      receiveNewBatch({
        productId: item.productId,
        batchCode: code,
        expirationDate: expDate,
        stock: item.quantity,
        unitCost: item.unitCost,
        supplierName: order.supplierName
      });
    });
  };

  // Customers
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalPurchases'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalPurchases: 0
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  // Dismiss / Resolve alert
  const dismissAlert = (alertId: string) => {
    // Alert dismissed in UI
  };

  const resolveAlertAction = (alertId: string, actionType: string) => {
    if (actionType === 'apply_discount') {
      sendPushAlert({
        title: 'Descuento Aplicado a Lote Crítico',
        body: 'Se activó etiqueta de 25% de descuento en punto de venta para acelerar la rotación del lote antes de su caducidad.',
        category: 'ALTO'
      });
    }
  };

  const login = (
    usernameOrId: string,
    password?: string,
    shift?: 'mañana' | 'tarde' | 'noche'
  ): { success: boolean; error?: string; user?: StaffUser } => {
    if (!usernameOrId || !usernameOrId.trim()) {
      return {
        success: false,
        error: 'Por favor ingrese su usuario o DNI.'
      };
    }

    if (!password || !password.trim()) {
      return {
        success: false,
        error: 'Por favor ingrese su contraseña.'
      };
    }

    const cleanQuery = usernameOrId.trim().toLowerCase();
    const found = staffUsers.find(u =>
      u.id.toLowerCase() === cleanQuery ||
      u.username.toLowerCase() === cleanQuery ||
      u.dni.toLowerCase() === cleanQuery ||
      u.email.toLowerCase() === cleanQuery
    );

    if (!found) {
      return {
        success: false,
        error: 'Usuario o DNI no registrado en el sistema. Verifique sus credenciales o solicite su alta al administrador.'
      };
    }

    // Verify password strictly against assigned credential
    const validPass = found.password || '1234';
    if (password !== validPass) {
      return {
        success: false,
        error: 'Contraseña incorrecta. Verifique sus credenciales e intente nuevamente.'
      };
    }

    const updatedUser: StaffUser = {
      ...found,
      activeShift: shift || found.activeShift
    };

    setCurrentUser(updatedUser);
    setIsLoggedIn(true);

    try {
      localStorage.setItem('novasalud_logged_in', 'true');
      localStorage.setItem('novasalud_active_user_id', updatedUser.id);
    } catch (e) {}

    sendPushAlert({
      title: `Turno Iniciado: ${updatedUser.name}`,
      body: `Bienvenido/a. Rol: ${updatedUser.roleTitle}. Turno ${updatedUser.activeShift}. Módulos disponibles: ${updatedUser.allowedTabs.length}.`,
      category: 'INFO'
    });

    logActivity({
      category: 'SEGURIDAD',
      action: 'Inicio de Sesión / Turno',
      description: `El colaborador ${updatedUser.name} inició turno ${updatedUser.activeShift} (${updatedUser.roleTitle}).`,
      severity: 'info',
      userId: updatedUser.id,
      userName: updatedUser.name,
      userRoleTitle: updatedUser.roleTitle,
      metadata: {
        shift: updatedUser.activeShift,
        allowedTabsCount: updatedUser.allowedTabs.length
      }
    });

    return { success: true, user: updatedUser };
  };

  const addStaffUser = (userData: Omit<StaffUser, 'id' | 'avatarInitials'>): StaffUser => {
    const initials = userData.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || 'CO';

    const newUser: StaffUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      avatarInitials: initials
    };

    setStaffUsers(prev => {
      const updated = [newUser, ...prev];
      try {
        localStorage.setItem('novasalud_staff_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    logActivity({
      category: 'PERMISOS',
      action: 'Registro de Nuevo Colaborador',
      description: `El administrador registró al colaborador ${newUser.name} (@${newUser.username}) con rol ${newUser.roleTitle}.`,
      severity: 'success',
      metadata: {
        affectedUser: newUser.name,
        role: newUser.role
      }
    });

    sendPushAlert({
      title: 'Nuevo Colaborador Registrado',
      body: `${newUser.name} habilitado en el sistema con rol ${newUser.roleTitle}.`,
      category: 'INFO'
    });

    return newUser;
  };

  const updateStaffPermissions = (
    userId: string,
    allowedTabs: string[],
    permissions?: Partial<StaffUser['permissions']>
  ) => {
    const targetUser = staffUsers.find(u => u.id === userId);

    setStaffUsers(prev => {
      const nextUsers = prev.map(u => {
        if (u.id === userId) {
          const updated: StaffUser = {
            ...u,
            allowedTabs,
            permissions: permissions ? { ...u.permissions, ...permissions } : u.permissions
          };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      });

      try {
        localStorage.setItem('novasalud_staff_users', JSON.stringify(nextUsers));
      } catch (e) {}

      return nextUsers;
    });

    sendPushAlert({
      title: 'Permisos de Colaborador Actualizados',
      body: `Se reconfiguraron los módulos autorizados para el personal en tiempo real.`,
      category: 'INFO'
    });

    logActivity({
      category: 'PERMISOS',
      action: 'Modificación de Permisos & Módulos',
      description: `Reconfiguración de módulos autorizados (${allowedTabs.length} asignados) y privilegios para colaborador ${targetUser?.name || userId}.`,
      severity: 'warning',
      metadata: {
        affectedUser: targetUser?.name || userId,
        permissionsChanged: permissions ? Object.keys(permissions) : [],
        allowedTabsCount: allowedTabs.length
      }
    });
  };

  const updateStaffUserPassword = (userId: string, newPassword: string): boolean => {
    if (!newPassword || newPassword.trim().length < 3) return false;
    const target = staffUsers.find(u => u.id === userId);
    if (!target) return false;

    setStaffUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          const uUpdated = { ...u, password: newPassword.trim() };
          if (currentUser.id === userId) {
            setCurrentUser(uUpdated);
          }
          return uUpdated;
        }
        return u;
      });
      try {
        localStorage.setItem('novasalud_staff_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    logActivity({
      category: 'PERMISOS',
      action: 'Actualización de Credenciales de Acceso',
      description: `El administrador actualizó la contraseña de acceso para ${target.name} (@${target.username}).`,
      severity: 'warning',
      metadata: {
        affectedUser: target.name
      }
    });

    return true;
  };

  const deleteStaffUser = (userId: string): { success: boolean; error?: string } => {
    if (staffUsers.length <= 1) {
      return { success: false, error: 'No se puede eliminar el único colaborador registrado en el sistema.' };
    }
    if (currentUser.id === userId) {
      return { success: false, error: 'No puede eliminar al colaborador que tiene la sesión activa actualmente.' };
    }

    const target = staffUsers.find(u => u.id === userId);
    if (!target) {
      return { success: false, error: 'Colaborador no encontrado.' };
    }

    setStaffUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      try {
        localStorage.setItem('novasalud_staff_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    logActivity({
      category: 'PERMISOS',
      action: 'Baja de Colaborador del Sistema',
      description: `El administrador dio de baja al colaborador ${target.name} (@${target.username}) del sistema.`,
      severity: 'critical',
      metadata: {
        affectedUser: target.name
      }
    });

    return { success: true };
  };

  const logout = () => {
    logActivity({
      category: 'SEGURIDAD',
      action: 'Cierre de Sesión',
      description: `El colaborador ${currentUser.name} cerró su sesión de turno.`,
      severity: 'info'
    });

    try {
      localStorage.removeItem('novasalud_logged_in');
    } catch (e) {}

    setIsLoggedIn(false);
    sendPushAlert({
      title: 'Sesión Finalizada',
      body: `El colaborador ${currentUser.name} ha cerrado sesión. Por favor identifíquese para iniciar un nuevo turno.`,
      category: 'INFO'
    });
  };

  // --- DATABASE BACKUPS & AUTOMATIC SCHEDULING ---
  const [backupConfig, setBackupConfig] = useState<BackupScheduleConfig>(() => {
    try {
      const stored = localStorage.getItem('novasalud_backup_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_BACKUP_CONFIG;
  });

  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(() => {
    try {
      const stored = localStorage.getItem('novasalud_backup_history');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_BACKUP_HISTORY;
  });

  const updateBackupConfig = (newConfig: Partial<BackupScheduleConfig>) => {
    setBackupConfig(prev => {
      const updated = { ...prev, ...newConfig };
      updated.nextRunTimestamp = computeNextRunTimestamp(updated.frequency, updated.scheduledTime, systemDate);
      try {
        localStorage.setItem('novasalud_backup_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    sendPushAlert({
      title: 'Programación de Respaldos Actualizada',
      body: `Configuración guardada: Frecuencia ${newConfig.frequency || backupConfig.frequency}, hora ${newConfig.scheduledTime || backupConfig.scheduledTime}.`,
      category: 'INFO'
    });
  };

  const executeManualBackup = (scope: BackupScope, downloadImmediately: boolean = true): BackupRecord => {
    const { jsonString, record } = createBackupPayload({
      products,
      batches,
      sales,
      cashRegister,
      customers,
      suppliers,
      scope,
      type: 'manual',
      systemDate,
      creatorName: currentUser.name,
      config: backupConfig
    });

    if (downloadImmediately) {
      downloadBackupFile(record.filename, jsonString);
    }

    setBackupHistory(prev => {
      const updated = [record, ...prev].slice(0, backupConfig.retentionCopies || 20);
      try {
        localStorage.setItem('novasalud_backup_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    sendPushAlert({
      title: 'Respaldo Manual Generado',
      body: `Se generó la copia ${record.filename} (${record.formattedSize}) con ${record.recordCounts.products} productos y ${record.recordCounts.sales} ventas.`,
      category: 'INFO'
    });

    logActivity({
      category: 'RESPALDO',
      action: 'Generación de Respaldo Manual',
      description: `Generación y descarga de respaldo manual ${record.filename} (${record.formattedSize}). Integridad SHA-256 generada.`,
      severity: 'info',
      metadata: {
        totalAmount: record.totalSalesAmount
      }
    });

    return record;
  };

  const executeScheduledBackupNow = (): BackupRecord => {
    const scope: BackupScope = backupConfig.includeInventory && backupConfig.includeSales ? 'all' : backupConfig.includeInventory ? 'inventory_only' : 'sales_only';
    const { jsonString, record } = createBackupPayload({
      products,
      batches,
      sales,
      cashRegister,
      customers,
      suppliers,
      scope,
      type: 'automatic',
      systemDate,
      creatorName: 'Cron Automatizado del Sistema',
      config: backupConfig
    });

    if (backupConfig.autoDownload) {
      downloadBackupFile(record.filename, jsonString);
    }

    setBackupHistory(prev => {
      const updated = [record, ...prev].slice(0, backupConfig.retentionCopies || 20);
      try {
        localStorage.setItem('novasalud_backup_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setBackupConfig(prev => {
      const updated = {
        ...prev,
        lastRunTimestamp: record.timestamp,
        nextRunTimestamp: computeNextRunTimestamp(prev.frequency, prev.scheduledTime, systemDate)
      };
      try {
        localStorage.setItem('novasalud_backup_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (backupConfig.notifyOnCompletion) {
      sendPushAlert({
        title: 'Copia Automática Ejecutada',
        body: `Copia programada completada: ${record.formattedSize} respaldados exitosamente.`,
        category: 'INFO'
      });
    }

    logActivity({
      category: 'RESPALDO',
      action: 'Copia Programada Automatizada',
      description: `Ejecución de cron de respaldo ${record.filename} (${record.formattedSize}). Estado: Verificado.`,
      severity: 'success',
      userName: 'Cron Automatizado del Sistema',
      userRoleTitle: 'Servicio Programador de Tareas'
    });

    return record;
  };

  const downloadBackupRecord = (recordId: string) => {
    const found = backupHistory.find(r => r.id === recordId);
    if (!found) return;
    if (found.payloadJson) {
      downloadBackupFile(found.filename, found.payloadJson);
    } else {
      const { jsonString } = createBackupPayload({
        products,
        batches,
        sales,
        cashRegister,
        customers,
        suppliers,
        scope: found.scope,
        type: found.type,
        systemDate,
        creatorName: found.createdBy
      });
      downloadBackupFile(found.filename, jsonString);
    }
  };

  const deleteBackupRecord = (recordId: string) => {
    setBackupHistory(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      try {
        localStorage.setItem('novasalud_backup_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const restoreFromBackup = (payload: BackupDataPayload): { success: boolean; message: string } => {
    try {
      if (payload.database.products && Array.isArray(payload.database.products)) {
        setProducts(payload.database.products);
      }
      if (payload.database.batches && Array.isArray(payload.database.batches)) {
        setBatches(payload.database.batches);
      }
      if (payload.database.sales && Array.isArray(payload.database.sales)) {
        setSales(payload.database.sales);
      }
      if (payload.database.cashRegister) {
        setCashRegister(payload.database.cashRegister);
      }
      if (payload.database.customers && Array.isArray(payload.database.customers)) {
        setCustomers(payload.database.customers);
      }
      if (payload.database.suppliers && Array.isArray(payload.database.suppliers)) {
        setSuppliers(payload.database.suppliers);
      }

      sendPushAlert({
        title: 'Base de Datos Restaurada',
        body: `Se restauró la copia de seguridad de ${payload.metadata.operationalDate || payload.metadata.timestamp}. Integridad verificada.`,
        category: 'INFO'
      });

      logActivity({
        category: 'RESPALDO',
        action: 'Restauración de Base de Datos',
        description: `Base de datos restaurada desde ${payload.metadata.operationalDate || payload.metadata.timestamp}. Productos y ventas reestablecidos.`,
        severity: 'critical'
      });

      return { success: true, message: 'Base de datos restaurada correctamente.' };
    } catch (err: any) {
      return { success: false, message: `Error al restaurar base de datos: ${err.message}` };
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        products,
        batches,
        sales,
        cashRegister,
        suppliers,
        purchaseOrders,
        customers,
        staffUsers,
        currentUser,
        alerts,
        switchCurrentUser,
        getValidBatchesForProduct,
        getProductTotalStock,
        getProductFefoEarliestBatch,
        getDaysUntilExpiration,
        executeFefoSale,
        receiveNewBatch,
        adjustBatchStock,
        openCashRegister,
        closeCashRegister,
        addCashMovement,
        createPurchaseOrder,
        receivePurchaseOrder,
        addCustomer,
        dismissAlert,
        resolveAlertAction,
        updateStaffPermissions,
        addStaffUser,
        updateStaffUserPassword,
        deleteStaffUser,
        systemDate,
        setSystemDate,
        advanceSystemDate,
        addQuickSale,
        backupConfig,
        backupHistory,
        updateBackupConfig,
        executeManualBackup,
        executeScheduledBackupNow,
        downloadBackupRecord,
        deleteBackupRecord,
        restoreFromBackup,
        activityLogs,
        logActivity,
        clearActivityLogs
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};

import { DataTypes, Op, Sequelize } from "sequelize";
import { readClientConfig } from "./clientConfigService.js";
import User from "../Models/userModel.js";

const tenantCache = new Map();

const dropStaleTenantOwnerUserForeignKeys = async (sequelize) => {
  const statements = [
    `ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_userId_fkey";`,
    `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_userId_fkey";`,
    `ALTER TABLE "stocks" DROP CONSTRAINT IF EXISTS "stocks_userId_fkey";`,
    `ALTER TABLE "sells" DROP CONSTRAINT IF EXISTS "sells_userId_fkey";`,
    `ALTER TABLE "sell_items" DROP CONSTRAINT IF EXISTS "sell_items_userId_fkey";`,
    `ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_userId_fkey";`,
    `ALTER TABLE "purchase_parties" DROP CONSTRAINT IF EXISTS "purchase_parties_userId_fkey";`,
    `ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_userId_fkey";`,
    `ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "purchase_items_userId_fkey";`,
    `ALTER TABLE "purchase_receipts" DROP CONSTRAINT IF EXISTS "purchase_receipts_userId_fkey";`,
    `ALTER TABLE "ledgers" DROP CONSTRAINT IF EXISTS "ledgers_userId_fkey";`,
    `ALTER TABLE "advance_settlements" DROP CONSTRAINT IF EXISTS "advance_settlements_userId_fkey";`,
    `ALTER TABLE "advance_settlement_allocations" DROP CONSTRAINT IF EXISTS "advance_settlement_allocations_userId_fkey";`,
    `ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_userId_fkey";`,
    `ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_userId_fkey";`,
    `ALTER TABLE "returns" DROP CONSTRAINT IF EXISTS "returns_userId_fkey";`,
    `ALTER TABLE "return_items" DROP CONSTRAINT IF EXISTS "return_items_userId_fkey";`,
    `ALTER TABLE "exchanges" DROP CONSTRAINT IF EXISTS "exchanges_userId_fkey";`,
    `ALTER TABLE "exchange_return_items" DROP CONSTRAINT IF EXISTS "exchange_return_items_userId_fkey";`,
    `ALTER TABLE "exchange_given_items" DROP CONSTRAINT IF EXISTS "exchange_given_items_userId_fkey";`,
    `ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_userId_fkey";`,
    `ALTER TABLE "reasons" DROP CONSTRAINT IF EXISTS "reasons_userId_fkey";`,
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
  }
};

const removeTenantClientOwnerShadowUser = async (context, clientUserId) => {
  const tenantClientUser = await context.TenantUser.findOne({
    where: { id: clientUserId, role: "client" },
  });

  if (tenantClientUser) {
    await tenantClientUser.destroy();
  }
};

const relaxTenantPurchasePartySchema = async (sequelize) => {
  const statements = [
    `ALTER TABLE "purchase_parties" ALTER COLUMN "email" DROP NOT NULL;`,
    `ALTER TABLE "purchase_parties" ALTER COLUMN "address" DROP NOT NULL;`,
    `ALTER TABLE "purchase_parties" ALTER COLUMN "gstNumber" DROP NOT NULL;`,
    `ALTER TABLE "purchase_parties" ALTER COLUMN "companyName" DROP NOT NULL;`,
    `ALTER TABLE "purchase_parties" ALTER COLUMN "state" DROP NOT NULL;`,
    `ALTER TABLE "purchase_parties" ALTER COLUMN "city" DROP NOT NULL;`,
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
  }
};

const ensureTenantProductPurchaseSchema = async (sequelize) => {
  const statements = [
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gst" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "igst" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
    `ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "offerPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;`,
  ];

  for (const sql of statements) {
    await sequelize.query(sql);
  }
};

const buildTenantModels = (sequelize) => {
  const TenantUser = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      visiblePassword: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: "admin" },
      clientName: { type: DataTypes.STRING, allowNull: true },
      contact: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      clientLogo: { type: DataTypes.STRING, allowNull: true },
      expiresAt: { type: DataTypes.DATEONLY, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "users",
      timestamps: true,
    },
  );

  const TenantFirm = sequelize.define(
    "Firm",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firmName: { type: DataTypes.STRING, allowNull: false },
      contact: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      gstNumber: { type: DataTypes.STRING },
      panNumber: { type: DataTypes.STRING },
      deliveryChallanInitial: { type: DataTypes.STRING },
      saleEntryInitialGST: { type: DataTypes.STRING },
      saleEntryInitialNoGST: { type: DataTypes.STRING },
      saleReceiptInitial: { type: DataTypes.STRING },
      saleQuotationInitial: { type: DataTypes.STRING },
      purchaseRefInitial: { type: DataTypes.STRING },
      proformaInitialGST: { type: DataTypes.STRING },
      proformaInitialNoGST: { type: DataTypes.STRING },
      accountName: { type: DataTypes.STRING },
      bankName: { type: DataTypes.STRING },
      ifscCode: { type: DataTypes.STRING },
      accountNumber: { type: DataTypes.STRING },
      firmLogo: { type: DataTypes.STRING },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "firms",
      timestamps: true,
    },
  );

  const TenantCustomer = sequelize.define(
    "Customer",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      mobile: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.INTEGER, allowNull: true },
      city: { type: DataTypes.INTEGER, allowNull: true },
      gstNumber: { type: DataTypes.STRING, allowNull: true },
      accountName: { type: DataTypes.STRING, allowNull: true },
      bankName: { type: DataTypes.STRING, allowNull: true },
      accountNumber: { type: DataTypes.STRING, allowNull: true },
      ifscCode: { type: DataTypes.STRING, allowNull: true },
      customerImg: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "customers",
      timestamps: true,
    },
  );

  const TenantProduct = sequelize.define(
    "Product",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category: { type: DataTypes.INTEGER, allowNull: true },
      subCat: { type: DataTypes.INTEGER, allowNull: true },
      productName: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      barcode: { type: DataTypes.STRING, allowNull: false, unique: true },
      company: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
      hsnCode: { type: DataTypes.STRING, allowNull: false },
      unit: { type: DataTypes.STRING, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: false },
      productCommission: { type: DataTypes.FLOAT, allowNull: false },
      gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      cgst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      sgst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      igst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      totalQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "products",
      timestamps: true,
    },
  );

  const TenantStock = sequelize.define(
    "Stock",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      stockDate: { type: DataTypes.DATEONLY, allowNull: false },
      refNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      employeeName: { type: DataTypes.STRING, allowNull: false },
      purchasePartyName: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "stocks",
      timestamps: true,
    },
  );

  const TenantStockItem = sequelize.define(
    "StockItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      stockId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      previousStockQty: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 0 },
      totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "stock_items",
      timestamps: true,
    },
  );

  const TenantSell = sequelize.define(
    "Sell",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceNumber: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      totalDiscount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      billDiscountType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Rs" },
      totalGST: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      cgst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      sgst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      igst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      finalAmount: { type: DataTypes.FLOAT, allowNull: false },
      paymentMethod: { type: DataTypes.STRING, allowNull: false },
      paymentDetails: { type: DataTypes.JSONB, allowNull: true },
      payingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      balanceAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      transactionId: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
      onlinePaymentMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
      chequeNumber: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
      chequeBankName: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
      chequeDate: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
    },
    {
      tableName: "sells",
      timestamps: true,
      indexes: [{ unique: true, fields: ["invoiceNumber", "userId"] }],
    },
  );

  const TenantSellItem = sequelize.define(
    "SellItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sellId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: true },
      price: { type: DataTypes.FLOAT, allowNull: false },
      offerPrice: { type: DataTypes.FLOAT, allowNull: false },
      discount: { type: DataTypes.FLOAT, allowNull: false },
      discountType: { type: DataTypes.STRING, allowNull: true, defaultValue: "Rs" },
      gstRate: { type: DataTypes.FLOAT, defaultValue: 0 },
      gstAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      totalPrice: { type: DataTypes.FLOAT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "sell_items",
      timestamps: true,
    },
  );

  const TenantReceipt = sequelize.define(
    "Receipt",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATE, allowNull: false },
      receiptNumber: { type: DataTypes.STRING, unique: true },
      billNumber: { type: DataTypes.INTEGER, allowNull: true },
      settlementId: { type: DataTypes.INTEGER, allowNull: true },
      firmId: { type: DataTypes.INTEGER, allowNull: true },
      customerId: { type: DataTypes.INTEGER, allowNull: true },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      paidAmount: { type: DataTypes.FLOAT, allowNull: false },
      netBalance: { type: DataTypes.FLOAT, allowNull: false },
      narration: { type: DataTypes.TEXT, allowNull: true },
      paymentMode: { type: DataTypes.STRING, allowNull: false },
      payingAmount: { type: DataTypes.FLOAT, allowNull: false },
      balanceAmount: { type: DataTypes.FLOAT, allowNull: false },
      transactionId: { type: DataTypes.STRING, allowNull: true },
      bankName: { type: DataTypes.STRING, allowNull: true },
      chequeNumber: { type: DataTypes.STRING, allowNull: true },
      chequeDate: { type: DataTypes.DATE, allowNull: true },
      onlinePaymentType: { type: DataTypes.STRING, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "receipts",
      timestamps: true,
    },
  );

  const TenantPurchaseParty = sequelize.define(
    "PurchaseParty",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: true, unique: true },
      mobile: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.INTEGER, allowNull: true },
      city: { type: DataTypes.INTEGER, allowNull: true },
      gstNumber: { type: DataTypes.STRING, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      stateType: {
        type: DataTypes.ENUM("in_state", "out_of_state"),
        allowNull: false,
        defaultValue: "in_state",
      },
    },
    {
      tableName: "purchase_parties",
      timestamps: true,
    },
  );

  const TenantPurchase = sequelize.define(
    "Purchase",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      purchasePartyId: { type: DataTypes.INTEGER, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      totalDiscount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      totalGST: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      payingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      balanceAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      paymentStatus: { type: DataTypes.STRING, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "purchases",
      timestamps: true,
      indexes: [{ unique: true, fields: ["invoiceNumber", "userId"] }],
    },
  );

  const TenantPurchaseItem = sequelize.define(
    "PurchaseItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      purchaseId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false },
      offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.FLOAT, allowNull: true },
      gst: { type: DataTypes.FLOAT, allowNull: true },
      cgst: { type: DataTypes.FLOAT, allowNull: true },
      sgst: { type: DataTypes.FLOAT, allowNull: true },
      igst: { type: DataTypes.FLOAT, allowNull: true },
      totalPrice: { type: DataTypes.FLOAT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "purchase_items",
      timestamps: true,
    },
  );

  const TenantPurchaseReceipt = sequelize.define(
    "PurchaseReceipt",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      receiptNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      billNumber: { type: DataTypes.INTEGER, allowNull: true },
      settlementId: { type: DataTypes.INTEGER, allowNull: true },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      netBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
      narration: { type: DataTypes.STRING, allowNull: true },
      paymentMode: { type: DataTypes.STRING, allowNull: true },
      payingAmount: { type: DataTypes.FLOAT, allowNull: false },
      balanceAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      transactionId: { type: DataTypes.STRING, allowNull: true },
      bankName: { type: DataTypes.STRING, allowNull: true },
      chequeNumber: { type: DataTypes.STRING, allowNull: true },
      chequeDate: { type: DataTypes.DATE, allowNull: true },
      onlinePaymentType: { type: DataTypes.STRING, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "purchase_receipts",
      timestamps: true,
    },
  );

  const TenantLedger = sequelize.define(
    "Ledger",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      entryDate: { type: DataTypes.DATEONLY, allowNull: false },
      entryType: { type: DataTypes.STRING, allowNull: false },
      entryTypeLabel: { type: DataTypes.STRING, allowNull: true },
      voucherNumber: { type: DataTypes.STRING, allowNull: true },
      sourceType: { type: DataTypes.STRING, allowNull: true },
      sourceId: { type: DataTypes.INTEGER, allowNull: true },
      referenceType: { type: DataTypes.STRING, allowNull: true },
      referenceId: { type: DataTypes.STRING, allowNull: true },
      firmId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      partyType: { type: DataTypes.STRING, allowNull: true },
      partyId: { type: DataTypes.INTEGER, allowNull: true },
      partyName: { type: DataTypes.STRING, allowNull: true },
      amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      debitAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      creditAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      paymentMode: { type: DataTypes.STRING, allowNull: true },
      paymentStatus: { type: DataTypes.STRING, allowNull: true },
      narration: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    },
    {
      tableName: "ledgers",
      timestamps: true,
    },
  );

  const TenantAdvanceSettlement = sequelize.define(
    "AdvanceSettlement",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      settlementNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      partyType: {
        type: DataTypes.ENUM("customer", "purchase_party"),
        allowNull: false,
      },
      partyId: { type: DataTypes.INTEGER, allowNull: false },
      advanceAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      appliedAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unappliedAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      settlementStatus: {
        type: DataTypes.ENUM("unapplied", "partial", "applied"),
        allowNull: false,
        defaultValue: "unapplied",
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "advance_settlements",
      timestamps: true,
    },
  );

  const TenantAdvanceSettlementAllocation = sequelize.define(
    "AdvanceSettlementAllocation",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      settlementId: { type: DataTypes.INTEGER, allowNull: false },
      billType: {
        type: DataTypes.ENUM("sale", "purchase"),
        allowNull: false,
      },
      billId: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "advance_settlement_allocations",
      timestamps: true,
    },
  );

  const TenantEmployee = sequelize.define(
    "Employee",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      contact: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      image: { type: DataTypes.STRING, allowNull: true },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      userName: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      viewPages: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
    },
    {
      tableName: "employees",
      timestamps: true,
    },
  );

  const TenantAuditLog = sequelize.define(
    "AuditLog",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      module: { type: DataTypes.STRING, allowNull: false },
      entityId: { type: DataTypes.STRING, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      oldValue: { type: DataTypes.JSONB, allowNull: true },
      newValue: { type: DataTypes.JSONB, allowNull: true },
      userId: { type: DataTypes.STRING, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    },
    {
      tableName: "audit_logs",
      timestamps: true,
      updatedAt: false,
    },
  );

  const TenantExpense = sequelize.define(
    "Expense",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      toWhom: { type: DataTypes.STRING, allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: false },
      expenseType: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.FLOAT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "expenses",
      timestamps: true,
    },
  );

  const TenantReturn = sequelize.define(
    "Return",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceNumber: { type: DataTypes.STRING, allowNull: false },
      returnBillNo: { type: DataTypes.STRING, allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      employeeName: { type: DataTypes.STRING, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      subtotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      grandTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      totalReturnAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentStatus: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "returns",
      timestamps: true,
    },
  );

  const TenantReturnItem = sequelize.define(
    "ReturnItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      returnId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: true },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "return_items",
      timestamps: true,
    },
  );

  const TenantExchange = sequelize.define(
    "Exchange",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      invoiceNumber: { type: DataTypes.STRING, allowNull: false },
      exchangeBillNo: { type: DataTypes.STRING, allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      firmId: { type: DataTypes.INTEGER, allowNull: false },
      employeeName: { type: DataTypes.STRING, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      difference: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      differenceType: { type: DataTypes.STRING, allowNull: true },
      subtotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      billDiscount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      billDiscountType: { type: DataTypes.STRING, allowNull: true, defaultValue: "Rs" },
      returnTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      grandTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      payingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentStatus: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "exchanges",
      timestamps: true,
    },
  );

  const TenantExchangeReturnItem = sequelize.define(
    "ExchangeReturnItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      exchangeId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: false },
      discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "exchange_return_items",
      timestamps: true,
    },
  );

  const TenantExchangeGivenItem = sequelize.define(
    "ExchangeGivenItem",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      exchangeId: { type: DataTypes.INTEGER, allowNull: false },
      productId: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      discountType: { type: DataTypes.STRING, allowNull: true, defaultValue: "Rs" },
      total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "exchange_given_items",
      timestamps: true,
    },
  );

  const TenantCategory = sequelize.define(
    "Category",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      catNm: { type: DataTypes.STRING, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "categories",
      timestamps: true,
      indexes: [{ unique: true, fields: ["catNm", "userId"] }],
    },
  );

  const TenantSubcategory = sequelize.define(
    "Subcategory",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subCatNm: { type: DataTypes.STRING, allowNull: false },
      categoryId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "subcategories",
      timestamps: true,
      indexes: [{ unique: true, fields: ["subCatNm", "categoryId"] }],
    },
  );

  const TenantReason = sequelize.define(
    "Reason",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      reason: { type: DataTypes.STRING, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "reasons",
      timestamps: true,
      indexes: [{ unique: true, fields: ["reason", "userId"] }],
    },
  );

  TenantUser.hasMany(TenantFirm, { foreignKey: "userId" });
  TenantFirm.belongsTo(TenantUser, {
    foreignKey: "userId",
    as: "user",
  });
  TenantFirm.hasMany(TenantCustomer, { foreignKey: "firmId" });
  TenantStock.hasMany(TenantStockItem, { foreignKey: "stockId" });
  TenantStockItem.belongsTo(TenantStock, { foreignKey: "stockId" });
  TenantProduct.hasMany(TenantStockItem, { foreignKey: "productId" });
  TenantStockItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantSell.hasMany(TenantSellItem, { foreignKey: "sellId", as: "items" });
  TenantSellItem.belongsTo(TenantSell, { foreignKey: "sellId" });
  TenantProduct.hasMany(TenantSellItem, { foreignKey: "productId" });
  TenantSellItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantCustomer.hasMany(TenantSell, { foreignKey: "customerId" });
  TenantSell.belongsTo(TenantCustomer, { foreignKey: "customerId" });
  TenantPurchaseParty.hasMany(TenantPurchase, { foreignKey: "purchasePartyId", as: "purchases" });
  TenantPurchase.belongsTo(TenantPurchaseParty, { foreignKey: "purchasePartyId", as: "purchaseParty" });
  TenantPurchase.hasMany(TenantPurchaseItem, { foreignKey: "purchaseId", as: "PurchaseItems" });
  TenantPurchaseItem.belongsTo(TenantPurchase, { foreignKey: "purchaseId" });
  TenantProduct.hasMany(TenantPurchaseItem, { foreignKey: "productId" });
  TenantPurchaseItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantAdvanceSettlement.hasMany(TenantAdvanceSettlementAllocation, {
    foreignKey: "settlementId",
    as: "allocations",
    onDelete: "CASCADE",
  });
  TenantAdvanceSettlementAllocation.belongsTo(TenantAdvanceSettlement, {
    foreignKey: "settlementId",
  });
  TenantFirm.hasMany(TenantEmployee, { foreignKey: "firmId" });
  TenantEmployee.belongsTo(TenantFirm, { foreignKey: "firmId" });
  TenantReturn.hasMany(TenantReturnItem, { foreignKey: "returnId", as: "items", onDelete: "CASCADE" });
  TenantReturnItem.belongsTo(TenantReturn, { foreignKey: "returnId" });
  TenantProduct.hasMany(TenantReturnItem, { foreignKey: "productId" });
  TenantReturnItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantExchange.hasMany(TenantExchangeReturnItem, {
    foreignKey: "exchangeId",
    as: "returnedItems",
    onDelete: "CASCADE",
  });
  TenantExchange.hasMany(TenantExchangeGivenItem, {
    foreignKey: "exchangeId",
    as: "givenItems",
    onDelete: "CASCADE",
  });
  TenantExchangeReturnItem.belongsTo(TenantExchange, { foreignKey: "exchangeId" });
  TenantExchangeGivenItem.belongsTo(TenantExchange, { foreignKey: "exchangeId" });
  TenantProduct.hasMany(TenantExchangeReturnItem, { foreignKey: "productId" });
  TenantProduct.hasMany(TenantExchangeGivenItem, { foreignKey: "productId" });
  TenantExchangeReturnItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantExchangeGivenItem.belongsTo(TenantProduct, { foreignKey: "productId" });
  TenantCategory.hasMany(TenantSubcategory, { foreignKey: "categoryId" });
  TenantSubcategory.belongsTo(TenantCategory, { foreignKey: "categoryId" });

  return {
    TenantUser,
    TenantFirm,
    TenantCustomer,
    TenantProduct,
    TenantStock,
    TenantStockItem,
    TenantSell,
    TenantSellItem,
    TenantReceipt,
    TenantPurchaseParty,
    TenantPurchase,
    TenantPurchaseItem,
    TenantPurchaseReceipt,
    TenantLedger,
    TenantAdvanceSettlement,
    TenantAdvanceSettlementAllocation,
    TenantEmployee,
    TenantAuditLog,
    TenantExpense,
    TenantReturn,
    TenantReturnItem,
    TenantExchange,
    TenantExchangeReturnItem,
    TenantExchangeGivenItem,
    TenantCategory,
    TenantSubcategory,
    TenantReason,
  };
};

export const getTenantContext = async (userId) => {
  if (tenantCache.has(userId)) {
    const cachedContext = tenantCache.get(userId);
    if (cachedContext.readyPromise) {
      await cachedContext.readyPromise;
    }
    return cachedContext;
  }

  const config = await readClientConfig(userId);
  if (!config) {
    throw new Error("Client database configuration not found.");
  }

  const sequelize = new Sequelize(
    config.dbName,
    config.dbUser,
    config.dbPassword,
    {
      host: config.dbHost,
      dialect: "postgres",
      port: config.dbPort,
      logging: false,
    },
  );

  const models = buildTenantModels(sequelize);
  const context = {
    sequelize,
    ...models,
    readyPromise: (async () => {
      await sequelize.authenticate();
      // Avoid tenant startup failures from Sequelize alter-based constraint churn.
      // Plain sync is enough here because tenant schemas are created up front and
      // we are not relying on automatic destructive constraint reshaping at runtime.
      await sequelize.sync();
      await ensureTenantProductPurchaseSchema(sequelize);
      await relaxTenantPurchasePartySchema(sequelize);
      await dropStaleTenantOwnerUserForeignKeys(sequelize);
      await removeTenantClientOwnerShadowUser({ sequelize, ...models }, userId);
    })(),
  };
  tenantCache.set(userId, context);
  await context.readyPromise;
  return context;
};

export const initializeTenantDatabase = async (clientUser) => {
  const context = await getTenantContext(clientUser.id);
  await removeTenantClientOwnerShadowUser(context, clientUser.id);
  return context;
};

export const isClientWorkspaceUser = async (userId, role = null) => {
  if (role) {
    return role === "client" || role === "client_admin";
  }

  const { default: User } = await import("../Models/userModel.js");
  const user = await User.findByPk(userId, { attributes: ["id", "role"] });
  return user?.role === "client";
};

export const resolveTenantRequestContext = (req) => {
  const tokenUserId = req.user?.id || null;
  const tokenWorkspaceUserId = req.user?.workspaceUserId || null;
  const tokenTenantOwnerId = req.user?.tenantOwnerId || null;
  const fallbackUserId = req.body?.userId || req.query?.userId || null;

  return {
    role: req.user?.role || null,
    tenantOwnerId: tokenTenantOwnerId || tokenUserId || fallbackUserId,
    workspaceUserId: tokenWorkspaceUserId || tokenUserId || fallbackUserId,
    tokenUserId,
    tokenWorkspaceUserId,
    tokenTenantOwnerId,
    fallbackUserId,
  };
};

export const createTenantWorkspaceUser = async (clientUserId, userData) => {
  const context = await getTenantContext(clientUserId);
  return context.TenantUser.create(userData);
};

export const findTenantWorkspaceUserByUsername = async (
  clientUserId,
  username,
  role = null,
) => {
  const context = await getTenantContext(clientUserId);
  const where = { username };

  if (role) {
    where.role = role;
  }

  return context.TenantUser.findOne({ where });
};

export const findAnyTenantWorkspaceUserByUsername = async (
  username,
  role = "admin",
  options = {},
) => {
  const { activeClientsOnly = true } = options;
  const clients = await User.findAll({
    where: activeClientsOnly ? { role: "client", isActive: true } : { role: "client" },
    attributes: ["id", "expiresAt"],
  });

  for (const client of clients) {
    if (
      activeClientsOnly &&
      client.expiresAt &&
      client.expiresAt < new Date().toISOString().slice(0, 10)
    ) {
      continue;
    }

    try {
      const user = await findTenantWorkspaceUserByUsername(client.id, username, role);
      if (user) {
        return { user, tenantOwnerId: client.id };
      }
    } catch (error) {
      console.error(`Tenant user lookup failed for client ${client.id}:`, error);
    }
  }

  return null;
};

export const createTenantFirm = async (tenantOwnerId, firmData) => {
  const context = await getTenantContext(tenantOwnerId);
  return context.TenantFirm.create(firmData);
};

export const getTenantFirmsByUserId = async (tenantOwnerId, scopeUserId = null) => {
  const context = await getTenantContext(tenantOwnerId);
  const where = scopeUserId ? { userId: scopeUserId } : undefined;
  return context.TenantFirm.findAll({
    where,
    include: [
      {
        model: context.TenantUser,
        as: "user",
        attributes: ["id", "username", "visiblePassword"],
      },
    ],
    order: [["id", "DESC"]],
  });
};

export const getTenantFirmById = async (tenantOwnerId, firmId, scopeUserId = null) => {
  const context = await getTenantContext(tenantOwnerId);
  const where = { id: firmId };
  if (scopeUserId) {
    where.userId = scopeUserId;
  }

  return context.TenantFirm.findOne({
    where,
    include: [
      {
        model: context.TenantUser,
        as: "user",
        attributes: ["id", "username", "visiblePassword"],
      },
    ],
  });
};

export const updateTenantFirm = async (tenantOwnerId, firmId, updateData, scopeUserId = null) => {
  const firm = await getTenantFirmById(tenantOwnerId, firmId, scopeUserId);
  if (!firm) return null;
  return firm.update(updateData);
};

export const deleteTenantFirm = async (tenantOwnerId, firmId, scopeUserId = null) => {
  const firm = await getTenantFirmById(tenantOwnerId, firmId, scopeUserId);
  if (!firm) return null;
  await firm.destroy();
  return firm;
};

export const createTenantCustomer = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.TenantCustomer.create(data);
};

export const getTenantCustomers = async (userId, firmId = null) => {
  const context = await getTenantContext(userId);
  const where = { userId };
  if (firmId) where.firmId = firmId;
  return context.TenantCustomer.findAll({ where, order: [["id", "DESC"]] });
};

export const updateTenantCustomer = async (userId, id, data) => {
  const context = await getTenantContext(userId);
  const customer = await context.TenantCustomer.findOne({ where: { id, userId } });
  if (!customer) return null;
  return customer.update(data);
};

export const deleteTenantCustomer = async (userId, id) => {
  const context = await getTenantContext(userId);
  const customer = await context.TenantCustomer.findOne({ where: { id, userId } });
  if (!customer) return null;
  await customer.destroy();
  return customer;
};

export const getNextTenantBarcode = async (userId) => {
  const context = await getTenantContext(userId);
  const lastProduct = await context.TenantProduct.findOne({ order: [["id", "DESC"]] });
  let nextNumber = 1;
  if (lastProduct?.barcode) {
    const match = lastProduct.barcode.match(/PRD-(\d+)/);
    if (match) nextNumber = Number(match[1]) + 1;
  }
  return `PRD-${String(nextNumber).padStart(4, "0")}`;
};

export const createTenantProduct = async (userId, data) => {
  const context = await getTenantContext(userId);
  const barcode = data.barcode || await getNextTenantBarcode(userId);
  return context.TenantProduct.create({ ...data, barcode });
};

export const getTenantProducts = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantProduct.findAll({ where: { userId }, order: [["id", "DESC"]] });
};

export const getTenantProductById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantProduct.findOne({ where: { id, userId } });
};

export const findTenantProductByNameAndSize = async (userId, productName, size) => {
  const context = await getTenantContext(userId);
  return context.TenantProduct.findOne({
    where: { userId, productName, size },
  });
};

export const updateTenantProduct = async (userId, id, data) => {
  const product = await getTenantProductById(userId, id);
  if (!product) return null;
  return product.update(data);
};

export const deleteTenantProduct = async (userId, id) => {
  const context = await getTenantContext(userId);
  const product = await getTenantProductById(userId, id);
  if (!product) return null;
  const sellItemCount = await context.TenantSellItem.count({ where: { productId: id } });
  if (sellItemCount > 0) {
    throw new Error("Cannot delete product because it exists in sale records");
  }
  const stockItemCount = await context.TenantStockItem.count({ where: { productId: id } });
  if (stockItemCount > 0) {
    throw new Error("Cannot delete product because it exists in stock records");
  }
  await product.destroy();
  return product;
};

const tenantConvertToBaseUnit = (quantity, unit) => {
  const qty = Number(quantity);
  switch (unit) {
    case "KG":
    case "LTR":
      return Math.round(qty * 1000);
    case "METER":
      return Math.round(qty * 100);
    case "INCH":
      return Math.round(qty * 25.4);
    default:
      return Math.round(qty);
  }
};

const tenantIncreaseStock = async (context, productId, quantity, transaction) => {
  const product = await context.TenantProduct.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);
  product.qty += tenantConvertToBaseUnit(quantity, product.unit);
  product.totalQuantity = product.qty;
  await product.save({ transaction });
  return product;
};

const tenantDecreaseStock = async (context, productId, quantity, transaction) => {
  const product = await context.TenantProduct.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);
  const baseQty = tenantConvertToBaseUnit(quantity, product.unit);
  if (product.qty < baseQty) {
    throw new Error(`Not enough stock for ${product.productName}`);
  }
  product.qty -= baseQty;
  product.totalQuantity = product.qty;
  await product.save({ transaction });
  return product;
};

const syncTenantPurchasedProductDetails = async (context, productId, item, transaction) => {
  const product = await context.TenantProduct.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);

  product.price = Number(item.price || 0);
  product.offerPrice = Number(item.offerPrice ?? item.price ?? 0);
  product.gst = Number(item.gst || 0);
  product.cgst = Number(item.cgst || 0);
  product.sgst = Number(item.sgst || 0);
  product.igst = Number(item.igst || 0);
  await product.save({ transaction });
};

export const getNextTenantStockRef = async (userId) => {
  const context = await getTenantContext(userId);
  const lastStock = await context.TenantStock.findOne({ order: [["id", "DESC"]] });
  let nextNumber = 1;
  if (lastStock?.refNumber) {
    const match = lastStock.refNumber.match(/STK-(\d+)/);
    if (match) nextNumber = Number(match[1]) + 1;
  }
  return `STK-${String(nextNumber).padStart(4, "0")}`;
};

export const createTenantStock = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const refNumber = await getNextTenantStockRef(userId);
    const stock = await context.TenantStock.create(
      {
        stockDate: data.stockDate,
        userId,
        employeeName: data.employeeName,
        purchasePartyName: data.purchasePartyName,
        refNumber,
      },
      { transaction },
    );

    const stockItems = (data.items || []).map((item) => ({
      stockId: stock.id,
      productId: Number(item.productId),
      previousStockQty: Math.round(Number(item.previousStockQty || 0)),
      quantity: Math.round(Number(item.quantity || 0)),
      totalPrice: Number(item.totalPrice || 0),
    }));

    await context.TenantStockItem.bulkCreate(stockItems, { transaction });

    for (const item of data.items || []) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }

    return stock;
  });
};

export const getTenantStocks = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantStock.findAll({
    where: { userId },
    include: [{ model: context.TenantStockItem, include: [context.TenantProduct] }],
    order: [["id", "DESC"]],
  });
};

export const getTenantStockById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantStock.findOne({
    where: { id, userId },
    include: [{ model: context.TenantStockItem, include: [context.TenantProduct] }],
  });
};

export const updateTenantStockById = async (userId, id, data) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const stock = await context.TenantStock.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!stock) throw new Error("Stock not found");

    const oldItems = await context.TenantStockItem.findAll({
      where: { stockId: id },
      transaction,
    });
    for (const item of oldItems) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }

    await context.TenantStockItem.destroy({ where: { stockId: id }, transaction });
    await stock.update(data, { transaction });

    const newItems = (data.items || []).map((item) => ({ ...item, stockId: id }));
    await context.TenantStockItem.bulkCreate(newItems, { transaction });
    for (const item of data.items || []) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }
    return stock;
  });
};

export const deleteTenantStockById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const stock = await context.TenantStock.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!stock) throw new Error("Stock not found");
    const items = await context.TenantStockItem.findAll({ where: { stockId: id }, transaction });
    for (const item of items) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }
    await context.TenantStockItem.destroy({ where: { stockId: id }, transaction });
    await stock.destroy({ transaction });
    return { message: "Stock deleted and inventory adjusted." };
  });
};

const getTenantSellItemKey = (item) => `${item.productId}::${item.size ?? ""}`;

const toTenantSellItem = (item, sellId, userId) => ({
  ...item,
  sellId,
  userId,
  offerPrice: item.offerPrice ?? item.price,
  discount: item.discount ?? 0,
  discountType: item.discountType ?? "Rs",
  gstRate: item.gstRate ?? 0,
  gstAmount: item.gstAmount ?? 0,
  totalPrice:
    item.totalPrice ??
    (item.offerPrice ?? item.price) * item.quantity + (item.gstAmount ?? 0),
});

export const findTenantSellByInvoice = async (userId, invoiceNumber) => {
  const context = await getTenantContext(userId);
  return context.TenantSell.findOne({
    where: { invoiceNumber, userId },
    include: { model: context.TenantSellItem, as: "items" },
  });
};

export const createTenantSell = async (userId, sellData, items) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const sell = await context.TenantSell.create(sellData, { transaction });
    const safeItems = (items || []).map((item) => toTenantSellItem(item, sell.id, userId));
    for (const item of safeItems) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
      await context.TenantSellItem.create(item, { transaction });
    }
    return context.TenantSell.findByPk(sell.id, {
      include: { model: context.TenantSellItem, as: "items" },
      transaction,
    });
  });
};

export const getTenantSells = async (userId, filters = {}) => {
  const context = await getTenantContext(userId);
  const where = { userId };
  if (filters.firmId) where.firmId = filters.firmId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.pendingOnly) where.balanceAmount = { [Op.gt]: 0 };
  return context.TenantSell.findAll({
    where,
    include: { model: context.TenantSellItem, as: "items" },
    order: [["id", "DESC"]],
  });
};

const formatEligibleTenantSellBill = (sell, memoPrefix) => ({
  id: sell.id,
  invoiceNumber: sell.invoiceNumber,
  billDate: sell.date,
  memoNumber: `${memoPrefix}-${sell.invoiceNumber}`,
  firmId: sell.firmId,
  firmName: sell.firmName || "",
  customerId: sell.customerId,
  customerName: sell.Customer?.name || sell.TenantCustomer?.name || "",
  subtotal: Number(sell.totalAmount || 0),
  originalBillDiscount: Number(sell.totalDiscount || 0),
  originalBillDiscountType: sell.billDiscountType || "Rs",
  gst: Number(sell.totalGST || 0),
  cgst: Number(sell.cgst || 0),
  sgst: Number(sell.sgst || 0),
  igst: Number(sell.igst || 0),
  grandTotal: Number(sell.finalAmount || 0),
  payingAmount: Number(sell.payingAmount || 0),
  balanceAmount: Number(sell.balanceAmount || 0),
  paymentMethod: sell.paymentMethod || "",
  items: (sell.items || []).map((item, index) => ({
    id: item.id,
    srNo: index + 1,
    productId: item.productId,
    productName: item.Product?.productName || item.TenantProduct?.productName || "",
    size: item.size || item.Product?.size || item.TenantProduct?.size || "",
    totalQty: Number(item.quantity || 0),
    qtyReturn: Number(item.quantity || 0),
    qtyExchange: Number(item.quantity || 0),
    price: Number(item.price || 0),
    offerPrice: Number(item.offerPrice || 0),
    discount: Number(item.discount || 0),
    discountType: item.discountType || "Rs",
    gst: Number(item.gstRate || 0),
    gstRate: Number(item.gstRate || 0),
    gstAmount: Number(item.gstAmount || 0),
    total: Number(item.totalPrice || 0),
  })),
});

const getTenantEligibleSellBills = async (userId, firmId, exclusionModelName, memoPrefix) => {
  const context = await getTenantContext(userId);
  const excludedInvoices = await context[exclusionModelName].findAll({
    where: { userId, firmId },
    attributes: ["invoiceNumber"],
  });

  const excludedInvoiceSet = new Set(
    excludedInvoices.map((entry) => String(entry.invoiceNumber || "")),
  );

  const sells = await context.TenantSell.findAll({
    where: {
      userId,
      firmId,
      balanceAmount: { [Op.lte]: 0 },
    },
    include: [
      {
        model: context.TenantSellItem,
        as: "items",
        include: [{ model: context.TenantProduct, attributes: ["id", "productName", "size"] }],
      },
      {
        model: context.TenantCustomer,
        attributes: ["id", "name"],
      },
    ],
    order: [["date", "DESC"], ["id", "DESC"]],
  });

  const firm = await context.TenantFirm.findByPk(firmId, {
    attributes: ["id", "firmName"],
  });
  const firmName = firm?.firmName || "";

  return sells
    .filter((sell) => !excludedInvoiceSet.has(String(sell.invoiceNumber || "")))
    .map((sell) =>
      formatEligibleTenantSellBill(
        {
          ...sell.toJSON(),
          firmName,
        },
        memoPrefix,
      ),
    );
};

export const getNextTenantInvoiceNumber = async (userId, prefix) => {
  const context = await getTenantContext(userId);
  const latestInvoice = await context.TenantSell.findOne({
    where: { invoiceNumber: { [Op.like]: `${prefix}%` }, userId },
    order: [["id", "DESC"]],
  });
  if (!latestInvoice) return `${prefix}-001`;
  const match = latestInvoice.invoiceNumber.match(/\d+$/);
  const lastNumber = match ? Number(match[0]) : 0;
  return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
};

export const getTenantEligibleReturnSellBills = async (userId, firmId) => {
  return getTenantEligibleSellBills(userId, firmId, "TenantReturn", "RET");
};

export const getTenantEligibleExchangeSellBills = async (userId, firmId) => {
  return getTenantEligibleSellBills(userId, firmId, "TenantExchange", "EXC");
};

export const getTenantSellById = async (userId, id) => {
  const context = await getTenantContext(userId);
  const sell = await context.TenantSell.findOne({
    where: { id, userId },
    include: { model: context.TenantSellItem, as: "items" },
  });
  if (!sell) return null;
  const receipts = await context.TenantReceipt.findAll({
    where: { billNumber: sell.id, userId },
    order: [["date", "DESC"], ["createdAt", "DESC"], ["id", "DESC"]],
  });
  sell.setDataValue("receipts", receipts);
  return sell;
};

export const updateTenantSellById = async (userId, id, sellData, items) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const sell = await context.TenantSell.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!sell) return null;
    if (Array.isArray(items)) {
      const existingItems = await context.TenantSellItem.findAll({
        where: { sellId: id },
        transaction,
      });
      const previousItemsByKey = new Map(existingItems.map((item) => [getTenantSellItemKey(item), item]));
      const nextItemsByKey = new Map(items.map((item) => [getTenantSellItemKey(item), item]));
      for (const removedItem of existingItems.filter((item) => !nextItemsByKey.has(getTenantSellItemKey(item)))) {
        await tenantIncreaseStock(context, removedItem.productId, removedItem.quantity, transaction);
        await context.TenantSellItem.destroy({ where: { id: removedItem.id }, transaction });
      }
      for (const incomingItem of items.filter((item) => previousItemsByKey.has(getTenantSellItemKey(item)))) {
        const existingItem = previousItemsByKey.get(getTenantSellItemKey(incomingItem));
        const safeItem = toTenantSellItem(incomingItem, id, userId);
        const quantityDiff = Number(safeItem.quantity || 0) - Number(existingItem.quantity || 0);
        if (quantityDiff > 0) await tenantDecreaseStock(context, existingItem.productId, quantityDiff, transaction);
        else if (quantityDiff < 0) await tenantIncreaseStock(context, existingItem.productId, Math.abs(quantityDiff), transaction);
        await existingItem.update(safeItem, { transaction });
      }
      for (const addedItem of items.filter((item) => !previousItemsByKey.has(getTenantSellItemKey(item)))) {
        const safeItem = toTenantSellItem(addedItem, id, userId);
        await tenantDecreaseStock(context, safeItem.productId, safeItem.quantity, transaction);
        await context.TenantSellItem.create(safeItem, { transaction });
      }
    }
    await sell.update(sellData, { transaction });
    return context.TenantSell.findByPk(id, {
      include: { model: context.TenantSellItem, as: "items" },
      transaction,
    });
  });
};

export const deleteTenantSellById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const sell = await context.TenantSell.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!sell) return null;
    const items = await context.TenantSellItem.findAll({ where: { sellId: id }, transaction });
    for (const item of items) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }
    await context.TenantSellItem.destroy({ where: { sellId: id }, transaction });
    await sell.destroy({ transaction });
    return sell;
  });
};

export const createTenantPurchaseParty = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.TenantPurchaseParty.create(data);
};

export const getTenantPurchaseParties = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantPurchaseParty.findAll({
    where: { userId },
    order: [["id", "DESC"]],
  });
};

export const getTenantPurchasePartyById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantPurchaseParty.findOne({ where: { id, userId } });
};

export const updateTenantPurchaseParty = async (userId, id, data) => {
  const context = await getTenantContext(userId);
  const party = await context.TenantPurchaseParty.findOne({ where: { id, userId } });
  if (!party) return null;
  return party.update(data);
};

export const deleteTenantPurchaseParty = async (userId, id) => {
  const context = await getTenantContext(userId);
  const party = await context.TenantPurchaseParty.findOne({ where: { id, userId } });
  if (!party) return null;
  await party.destroy();
  return party;
};

export const findTenantPurchaseByInvoice = async (userId, invoiceNumber) => {
  const context = await getTenantContext(userId);
  return context.TenantPurchase.findOne({
    where: { invoiceNumber, userId },
    include: [
      { model: context.TenantPurchaseItem, as: "PurchaseItems" },
      { model: context.TenantPurchaseParty, as: "purchaseParty", attributes: ["id", "name"] },
    ],
  });
};

export const createTenantPurchase = async (userId, purchaseData, items) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const purchase = await context.TenantPurchase.create(purchaseData, { transaction });
    const purchaseItems = (items || []).map((item) => ({
      ...item,
      offerPrice: item.offerPrice ?? item.price ?? 0,
      purchaseId: purchase.id,
      userId,
    }));

    await context.TenantPurchaseItem.bulkCreate(purchaseItems, { transaction });

    for (const item of items || []) {
      await syncTenantPurchasedProductDetails(context, item.productId, item, transaction);
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }

    return context.TenantPurchase.findByPk(purchase.id, {
      include: [
        { model: context.TenantPurchaseItem, as: "PurchaseItems" },
        { model: context.TenantPurchaseParty, as: "purchaseParty", attributes: ["id", "name"] },
      ],
      transaction,
    });
  });
};

export const getTenantPurchases = async (userId, filters = {}) => {
  const context = await getTenantContext(userId);
  const where = { userId };
  if (filters.firmId) where.firmId = filters.firmId;
  if (filters.purchasePartyId) where.purchasePartyId = filters.purchasePartyId;
  if (filters.pendingOnly) where.balanceAmount = { [Op.gt]: 0 };
  return context.TenantPurchase.findAll({
    where,
    include: [
      { model: context.TenantPurchaseItem, as: "PurchaseItems" },
      { model: context.TenantPurchaseParty, as: "purchaseParty", attributes: ["id", "name"] },
    ],
    order: [["id", "DESC"]],
  });
};

export const getTenantPurchaseById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantPurchase.findOne({
    where: { id, userId },
    include: [
      { model: context.TenantPurchaseItem, as: "PurchaseItems" },
      { model: context.TenantPurchaseParty, as: "purchaseParty", attributes: ["id", "name"] },
    ],
  });
};

export const updateTenantPurchaseById = async (userId, id, purchaseData, items) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const purchase = await context.TenantPurchase.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!purchase) return null;

    const oldItems = await context.TenantPurchaseItem.findAll({
      where: { purchaseId: id },
      transaction,
    });

    for (const item of oldItems) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }

    await context.TenantPurchaseItem.destroy({ where: { purchaseId: id }, transaction });
    await purchase.update(purchaseData, { transaction });

    const newItems = (items || []).map((item) => ({
      ...item,
      offerPrice: item.offerPrice ?? item.price ?? 0,
      purchaseId: id,
      userId,
    }));

    await context.TenantPurchaseItem.bulkCreate(newItems, { transaction });

    for (const item of items || []) {
      await syncTenantPurchasedProductDetails(context, item.productId, item, transaction);
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }

    return context.TenantPurchase.findByPk(id, {
      include: [
        { model: context.TenantPurchaseItem, as: "PurchaseItems" },
        { model: context.TenantPurchaseParty, as: "purchaseParty", attributes: ["id", "name"] },
      ],
      transaction,
    });
  });
};

export const deleteTenantPurchaseById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const purchase = await context.TenantPurchase.findOne({
      where: { id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!purchase) return null;

    const items = await context.TenantPurchaseItem.findAll({
      where: { purchaseId: id },
      transaction,
    });

    for (const item of items) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }

    await context.TenantPurchaseItem.destroy({ where: { purchaseId: id }, transaction });
    await purchase.destroy({ transaction });
    return purchase;
  });
};

export const getTenantLedgerModel = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantLedger;
};

export const getTenantPartyModels = async (userId) => {
  const context = await getTenantContext(userId);
  return {
    TenantCustomer: context.TenantCustomer,
    TenantPurchaseParty: context.TenantPurchaseParty,
  };
};

export const addTenantAdvanceSettlement = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.TenantAdvanceSettlement.create({
    ...data,
    appliedAmount: Number(data.appliedAmount || 0),
    unappliedAmount:
      data.unappliedAmount !== undefined && data.unappliedAmount !== null
        ? Number(data.unappliedAmount)
        : Number(data.advanceAmount || 0),
    settlementStatus: data.settlementStatus || "unapplied",
  });
};

export const getTenantAdvanceSettlements = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantAdvanceSettlement.findAll({
    where: { userId },
    include: [{ model: context.TenantAdvanceSettlementAllocation, as: "allocations" }],
    order: [["date", "DESC"]],
  });
};

export const findTenantSettlementByNumber = async (userId, settlementNumber) => {
  const context = await getTenantContext(userId);
  return context.TenantAdvanceSettlement.findOne({
    where: { settlementNumber, userId },
  });
};

export const findTenantSettlementById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantAdvanceSettlement.findOne({
    where: { id, userId },
    include: [{ model: context.TenantAdvanceSettlementAllocation, as: "allocations" }],
  });
};

export const updateTenantAdvanceSettlementById = async (userId, id, updateData) => {
  const settlement = await findTenantSettlementById(userId, id);
  if (!settlement) return null;
  Object.assign(settlement, updateData);
  await settlement.save();
  return settlement;
};

export const deleteTenantAdvanceSettlementById = async (userId, id) => {
  const settlement = await findTenantSettlementById(userId, id);
  if (!settlement) return null;
  await settlement.destroy();
  return settlement;
};

export const generateNextTenantSettlementNumber = async (userId) => {
  const context = await getTenantContext(userId);
  const settlements = await context.TenantAdvanceSettlement.findAll({
    where: { userId },
    attributes: ["settlementNumber"],
  });

  const numbers = settlements.map((item) => {
    const match = String(item.settlementNumber || "").match(/SET-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  const maxNumber = numbers.length ? Math.max(...numbers) : 0;
  return `SET-${String(maxNumber + 1).padStart(3, "0")}`;
};

export const getTenantPendingBillsForParty = async ({ userId, firmId, partyType, partyId }) => {
  if (partyType === "customer") {
    const sells = await getTenantSells(userId, { firmId, customerId: partyId });
    return sells
      .filter((bill) => Number(bill.balanceAmount || 0) > 0)
      .map((bill) => ({
        id: bill.id,
        invoiceNumber: bill.invoiceNumber,
        date: bill.date,
        totalAmount: bill.finalAmount,
        payingAmount: bill.payingAmount,
        balanceAmount: bill.balanceAmount,
        paymentStatus: bill.paymentDetails,
        billType: "sale",
      }));
  }

  const purchases = await getTenantPurchases(userId, { firmId, purchasePartyId: partyId });
  return purchases
    .filter((bill) => Number(bill.balanceAmount || 0) > 0)
    .map((bill) => ({
      id: bill.id,
      invoiceNumber: bill.invoiceNumber,
      date: bill.date,
      totalAmount: bill.totalAmount,
      payingAmount: bill.payingAmount,
      balanceAmount: bill.balanceAmount,
      paymentStatus: bill.paymentStatus,
      billType: "purchase",
    }));
};

export const createTenantEmployee = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.TenantEmployee.create(data);
};

export const getTenantEmployeesByUser = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantEmployee.findAll({
    where: { userId },
    order: [["id", "DESC"]],
  });
};

export const getTenantEmployeeById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantEmployee.findOne({ where: { id, userId } });
};

export const updateTenantEmployee = async (userId, id, data) => {
  const employee = await getTenantEmployeeById(userId, id);
  if (!employee) return null;
  return employee.update(data);
};

export const deleteTenantEmployee = async (userId, id) => {
  const employee = await getTenantEmployeeById(userId, id);
  if (!employee) return null;
  await employee.destroy();
  return employee;
};

export const findTenantEmployeeByUsername = async (userId, username) => {
  const context = await getTenantContext(userId);
  return context.TenantEmployee.findOne({ where: { userName: username } });
};

export const createTenantExpense = async (userId, data) => {
  const context = await getTenantContext(userId);
  return context.TenantExpense.create(data);
};

export const getTenantExpenses = async (userId, firmId = null) => {
  const context = await getTenantContext(userId);
  const where = { userId };
  if (firmId) where.firmId = firmId;
  return context.TenantExpense.findAll({
    where,
    order: [["date", "DESC"]],
  });
};

export const getTenantExpenseById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantExpense.findOne({ where: { id, userId } });
};

export const updateTenantExpense = async (userId, id, data) => {
  const expense = await getTenantExpenseById(userId, id);
  if (!expense) return null;
  return expense.update(data);
};

export const deleteTenantExpense = async (userId, id) => {
  const expense = await getTenantExpenseById(userId, id);
  if (!expense) return null;
  await expense.destroy();
  return expense;
};

export const findTenantReturnByInvoice = async (userId, invoiceNumber) => {
  const context = await getTenantContext(userId);
  return context.TenantReturn.findOne({
    where: { invoiceNumber, userId },
    include: { model: context.TenantReturnItem, as: "items" },
  });
};

export const createTenantReturn = async (userId, returnData, items = []) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const returnBillNo = `RET-${returnData.invoiceNumber}`;
    const record = await context.TenantReturn.create(
      { ...returnData, returnBillNo },
      { transaction },
    );

    for (const item of items) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
      await context.TenantReturnItem.create(
        { ...item, returnId: record.id, userId },
        { transaction },
      );
    }

    return context.TenantReturn.findByPk(record.id, {
      include: { model: context.TenantReturnItem, as: "items" },
      transaction,
    });
  });
};

export const getTenantReturns = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantReturn.findAll({
    where: { userId },
    include: { model: context.TenantReturnItem, as: "items" },
    order: [["id", "DESC"]],
  });
};

export const deleteTenantReturn = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const record = await context.TenantReturn.findOne({
      where: { id, userId },
      include: [{ model: context.TenantReturnItem, as: "items" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) return null;

    for (const item of record.items || []) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }

    await context.TenantLedger.destroy({
      where: { sourceType: "return", sourceId: id },
      transaction,
    });

    await context.TenantReturnItem.destroy({
      where: { returnId: id },
      transaction,
    });

    await record.destroy({ transaction });
    return record;
  });
};

export const findTenantExchangeByInvoice = async (userId, invoiceNumber) => {
  const context = await getTenantContext(userId);
  return context.TenantExchange.findOne({
    where: { invoiceNumber, userId },
    include: [
      { model: context.TenantExchangeReturnItem, as: "returnedItems" },
      { model: context.TenantExchangeGivenItem, as: "givenItems" },
    ],
  });
};

export const createTenantExchange = async (
  userId,
  exchangeData,
  returnedItems = [],
  givenItems = [],
) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const exchangeBillNo = `EXC-${exchangeData.invoiceNumber}`;
    const returnTotal = returnedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0,
    );

    const record = await context.TenantExchange.create(
      { ...exchangeData, exchangeBillNo, returnTotal },
      { transaction },
    );

    for (const item of returnedItems) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
      await context.TenantExchangeReturnItem.create(
        { ...item, exchangeId: record.id, userId },
        { transaction },
      );
    }

    for (const item of givenItems) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
      await context.TenantExchangeGivenItem.create(
        {
          ...item,
          exchangeId: record.id,
          userId,
          discountType: item.discountType || "Rs",
        },
        { transaction },
      );
    }

    return context.TenantExchange.findByPk(record.id, {
      include: [
        { model: context.TenantExchangeReturnItem, as: "returnedItems" },
        { model: context.TenantExchangeGivenItem, as: "givenItems" },
      ],
      transaction,
    });
  });
};

export const getTenantExchanges = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantExchange.findAll({
    where: { userId },
    include: [
      { model: context.TenantExchangeReturnItem, as: "returnedItems" },
      { model: context.TenantExchangeGivenItem, as: "givenItems" },
    ],
    order: [["id", "DESC"]],
  });
};

export const getTenantExchangeById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantExchange.findOne({
    where: { id, userId },
    include: [
      { model: context.TenantExchangeReturnItem, as: "returnedItems" },
      { model: context.TenantExchangeGivenItem, as: "givenItems" },
    ],
  });
};

export const updateTenantExchangePayment = async (userId, id, payingAmount, paymentMethod) => {
  const context = await getTenantContext(userId);
  const exchange = await getTenantExchangeById(userId, id);
  if (!exchange) return null;

  const totalReturned = (exchange.returnedItems || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );
  const totalGiven = Number(exchange.grandTotal || 0);
  const difference = totalGiven - totalReturned;
  const totalPaid = Number(exchange.payingAmount || 0) + Number(payingAmount || 0);
  const status = totalPaid >= difference ? "Paid" : "Advance";

  exchange.payingAmount = totalPaid;
  exchange.paymentMethod = paymentMethod || exchange.paymentMethod || "N/A";
  exchange.paymentStatus = status;
  await exchange.save();

  return getTenantExchangeById(userId, id);
};

export const deleteTenantExchange = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.sequelize.transaction(async (transaction) => {
    const record = await context.TenantExchange.findOne({
      where: { id, userId },
      include: [
        { model: context.TenantExchangeReturnItem, as: "returnedItems" },
        { model: context.TenantExchangeGivenItem, as: "givenItems" },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) return null;

    for (const item of record.returnedItems || []) {
      await tenantDecreaseStock(context, item.productId, item.quantity, transaction);
    }

    for (const item of record.givenItems || []) {
      await tenantIncreaseStock(context, item.productId, item.quantity, transaction);
    }

    await context.TenantLedger.destroy({
      where: { sourceType: "exchange", sourceId: id },
      transaction,
    });

    await context.TenantExchangeReturnItem.destroy({
      where: { exchangeId: id },
      transaction,
    });
    await context.TenantExchangeGivenItem.destroy({
      where: { exchangeId: id },
      transaction,
    });
    await record.destroy({ transaction });
    return record;
  });
};

export const createTenantCategory = async (userId, catNm) => {
  const context = await getTenantContext(userId);
  return context.TenantCategory.create({ catNm, userId });
};

export const getTenantCategories = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantCategory.findAll({
    where: { userId },
    order: [["id", "DESC"]],
  });
};

export const findTenantCategoryByName = async (userId, catNm) => {
  const context = await getTenantContext(userId);
  return context.TenantCategory.findOne({ where: { catNm, userId } });
};

export const getTenantCategoryById = async (userId, id) => {
  const context = await getTenantContext(userId);
  return context.TenantCategory.findOne({ where: { id, userId } });
};

export const updateTenantCategory = async (userId, id, catNm) => {
  const category = await getTenantCategoryById(userId, id);
  if (!category) return null;
  category.catNm = catNm;
  await category.save();
  return category;
};

export const deleteTenantCategory = async (userId, id) => {
  const context = await getTenantContext(userId);
  const category = await getTenantCategoryById(userId, id);
  if (!category) return null;
  await context.TenantSubcategory.destroy({ where: { categoryId: id } });
  await category.destroy();
  return category;
};

export const createTenantSubcategory = async (userId, subCatNm, categoryId) => {
  const context = await getTenantContext(userId);
  return context.TenantSubcategory.create({ subCatNm, categoryId });
};

export const getTenantSubcategories = async (userId, categoryId) => {
  const context = await getTenantContext(userId);
  const category = await getTenantCategoryById(userId, categoryId);
  if (!category) return [];
  return context.TenantSubcategory.findAll({
    where: { categoryId },
    order: [["id", "DESC"]],
  });
};

export const findTenantSubcategoryByName = async (userId, subCatNm, categoryId) => {
  const context = await getTenantContext(userId);
  const category = await getTenantCategoryById(userId, categoryId);
  if (!category) return null;
  return context.TenantSubcategory.findOne({ where: { subCatNm, categoryId } });
};

export const getTenantSubcategoryById = async (userId, id) => {
  const context = await getTenantContext(userId);
  const subcategory = await context.TenantSubcategory.findByPk(id);
  if (!subcategory) return null;
  const category = await getTenantCategoryById(userId, subcategory.categoryId);
  return category ? subcategory : null;
};

export const updateTenantSubcategory = async (userId, id, subCatNm) => {
  const subcategory = await getTenantSubcategoryById(userId, id);
  if (!subcategory) return null;
  subcategory.subCatNm = subCatNm;
  await subcategory.save();
  return subcategory;
};

export const deleteTenantSubcategory = async (userId, id) => {
  const subcategory = await getTenantSubcategoryById(userId, id);
  if (!subcategory) return null;
  await subcategory.destroy();
  return subcategory;
};

export const createTenantReason = async (userId, reasonText) => {
  const context = await getTenantContext(userId);
  return context.TenantReason.create({ reason: reasonText, userId });
};

export const getTenantReasons = async (userId) => {
  const context = await getTenantContext(userId);
  return context.TenantReason.findAll({
    where: { userId },
    order: [["reason", "ASC"]],
  });
};

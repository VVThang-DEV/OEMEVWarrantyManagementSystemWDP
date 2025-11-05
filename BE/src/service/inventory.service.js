import { Transaction } from "sequelize";
import db from "../models/index.cjs";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";

class InventoryService {
  #inventoryRepository;
  #inventoryAdjustmentRepository;
  #warehouseRepository;
  #userRepository;
  #notificationService;
  #caselineRepository;
  #componentRepository;
  #stockReservationRepository;
  #stockTransferRequestItemRepository;

  constructor({
    inventoryRepository,
    inventoryAdjustmentRepository,
    warehouseRepository,
    userRepository,
    notificationService,
    caselineRepository,
    componentRepository,
    stockReservationRepository,
    stockTransferRequestItemRepository,
  }) {
    this.#inventoryRepository = inventoryRepository;
    this.#inventoryAdjustmentRepository = inventoryAdjustmentRepository;
    this.#warehouseRepository = warehouseRepository;
    this.#userRepository = userRepository;
    this.#notificationService = notificationService;
    this.#caselineRepository = caselineRepository;
    this.#componentRepository = componentRepository;
    this.#stockReservationRepository = stockReservationRepository;
    this.#stockTransferRequestItemRepository =
      stockTransferRequestItemRepository;
  }

  getInventorySummary = async ({
    serviceCenterId,
    roleName,
    companyId,
    filters = {},
  }) => {
    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      if (!serviceCenterId) {
        throw new Error("Service center context is required for this role");
      }
      warehouseWhere.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      if (!companyId) {
        throw new Error("Company context is required for this role");
      }
      warehouseWhere.vehicleCompanyId = companyId;
      if (filters?.serviceCenterId) {
        warehouseWhere.serviceCenterId = filters.serviceCenterId;
      }
    } else if (serviceCenterId) {
      warehouseWhere.serviceCenterId = serviceCenterId;
    }

    const summary = await this.#inventoryRepository.getInventorySummary({
      warehouseWhereClause: warehouseWhere,
    });

    return summary;
  };

  getInventoryTypeComponents = async ({
    serviceCenterId,
    roleName,
    companyId,
    filters = {},
  }) => {
    const { page, limit, typeComponentId } = filters;
    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      if (!serviceCenterId) {
        throw new Error("Service center context is required for this role");
      }
      warehouseWhere.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      if (!companyId) {
        throw new Error("Company context is required for this role");
      }
      warehouseWhere.vehicleCompanyId = companyId;
      if (filters?.serviceCenterId) {
        warehouseWhere.serviceCenterId = filters.serviceCenterId;
      }
    } else if (serviceCenterId) {
      warehouseWhere.serviceCenterId = serviceCenterId;
    }

    const limitParse = Number.parseInt(limit, 10) || 10;
    const pageParse = Number.parseInt(page, 10) || 1;
    const offset = (pageParse - 1) * limitParse;

    const { rows, count } =
      await this.#inventoryRepository.getInventoryTypeComponents({
        warehouseWhereClause: warehouseWhere,
        typeComponentId,
        limit: limitParse,
        offset,
      });

    const pages = Math.ceil(count / limitParse);
    const components = {
      typeComponents: rows,
      pagination: {
        total: count,
        pages: pageParse,
        limit: limitParse,
        totalPages: pages,
      },
    };

    return components;
  };

  createInventoryAdjustment = async (adjustmentData) => {
    const {
      stockId,
      adjustmentType,
      quantity: inputQuantity,
      components,
      reason,
      note,
      adjustedByUserId,
      roleName,
      companyId,
    } = adjustmentData;

    const result = await db.sequelize.transaction(async (transaction) => {
      const stock = await this.#warehouseRepository.findStockByStockId(
        stockId,
        transaction,
        Transaction.LOCK.UPDATE
      );
      if (!stock) throw new NotFoundError("Stock item not found");

      const existingUser = await this.#userRepository.findUserById(
        { userId: adjustedByUserId },
        transaction,
        Transaction.LOCK.SHARE
      );
      if (!existingUser) throw new NotFoundError("Adjusting user not found");

      let quantity = 0;
      if (adjustmentType === "IN") {
        if (!components || components.length === 0) {
          throw new BadRequestError(
            "Components list is required for IN adjustment"
          );
        }
        quantity = components.length;

        const serialNumbers = components.map((c) => c.serialNumber);
        const existingComponents =
          await this.#componentRepository.findBySerialNumbers(
            serialNumbers,
            transaction,
            Transaction.LOCK.UPDATE
          );
        if (existingComponents.length > 0) {
          throw new ConflictError(
            `Serial numbers already exist: ${existingComponents
              .map((c) => c.serialNumber)
              .join(", ")}`
          );
        }

        const componentsToCreate = components.map((c) => ({
          ...c,
          typeComponentId: stock.typeComponentId,
          warehouseId: stock.warehouseId,
          status: "IN_STOCK",
        }));
        await this.#componentRepository.bulkCreate(
          componentsToCreate,
          transaction
        );
      } else if (adjustmentType === "OUT") {
        quantity = inputQuantity;
        if (stock.quantityAvailable < quantity) {
          throw new ConflictError(
            `Insufficient available stock. Available: ${stock.quantityAvailable}, Requested: ${quantity}`
          );
        }
      }

      const newAdjustment =
        await this.#inventoryAdjustmentRepository.createInventoryAdjustment(
          { stockId, adjustmentType, quantity, reason, note, adjustedByUserId },
          transaction
        );

      const newQuantityInStock =
        adjustmentType === "IN"
          ? stock.quantityInStock + quantity
          : stock.quantityInStock - quantity;

      const updatedStock =
        await this.#warehouseRepository.updateStockQuantities(
          { stockId, quantityInStock: newQuantityInStock },
          transaction
        );

      return { adjustment: newAdjustment, updatedStock, stock, quantity };
    });

    const { adjustment, updatedStock, stock, quantity: TXQuantity } = result;

    if (roleName === "parts_coordinator_company" && companyId) {
      this.#notificationService.sendToRoom(
        `parts_coordinator_company_${companyId}`,
        "inventory_adjustment_created",
        {
          adjustment,
          updatedStock,
          adjustmentType,
          quantity: TXQuantity,
          reason,
        }
      );
    } else if (stock.warehouse?.serviceCenterId) {
      this.#notificationService.sendToRoom(
        `parts_coordinator_service_center_${stock.warehouse.serviceCenterId}`,
        "inventory_adjustment_created",
        {
          adjustment,
          updatedStock,
          adjustmentType,
          quantity: TXQuantity,
          reason,
        }
      );
    }

    return { adjustment, updatedStock };
  };

  getInventoryAdjustments = async ({
    companyId,
    serviceCenterId,
    roleName,
    page = 1,
    limit = 20,
    filters = {},
  }) => {
    const limitParse = parseInt(limit, 10);
    const pageParse = parseInt(page, 10);
    const offset = (pageParse - 1) * limitParse;

    const where = {};
    const stockWhere = {};
    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      warehouseWhere.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      warehouseWhere.vehicleCompanyId = companyId;
    }

    if (filters.warehouseId) {
      warehouseWhere.warehouseId = filters.warehouseId;
    }
    if (filters.typeComponentId) {
      stockWhere.typeComponentId = filters.typeComponentId;
    }
    if (filters.adjustmentType) {
      where.adjustmentType = filters.adjustmentType;
    }
    if (filters.reason) {
      where.reason = filters.reason;
    }
    if (filters.adjustedByUserId) {
      where.adjustedByUserId = filters.adjustedByUserId;
    }
    if (filters.startDate) {
      where.adjustedAt = {
        ...where.adjustedAt,
        [db.Sequelize.Op.gte]: filters.startDate,
      };
    }
    if (filters.endDate) {
      where.adjustedAt = {
        ...where.adjustedAt,
        [db.Sequelize.Op.lte]: filters.endDate,
      };
    }

    const { rows, count } =
      await this.#inventoryAdjustmentRepository.findAllAndCount({
        where,
        stockWhere,
        warehouseWhere,
        limit: limitParse,
        offset,
      });

    const totalPages = Math.ceil(count / limitParse);

    return {
      items: rows,
      pagination: {
        currentPage: pageParse,
        totalPages,
        totalItems: count,
        itemsPerPage: limitParse,
      },
    };
  };

  getInventoryAdjustmentById = async ({
    adjustmentId,
    companyId,
    serviceCenterId,
    roleName,
  }) => {
    const where = { adjustmentId };
    const stockWhere = {};
    const warehouseWhere = {};

    if (roleName === "parts_coordinator_service_center") {
      warehouseWhere.serviceCenterId = serviceCenterId;
    } else if (roleName === "parts_coordinator_company") {
      warehouseWhere.vehicleCompanyId = companyId;
    }

    const adjustment = await this.#inventoryAdjustmentRepository.findById({
      where,
      stockWhere,
      warehouseWhere,
    });

    return adjustment;
  };

  getStockHistory = async ({ stockId, page = 1, limit = 20 }) => {
    const stock = await this.#warehouseRepository.findStockByStockId(stockId);
    if (!stock) {
      throw new NotFoundError("Stock item not found");
    }

    const pageParse = parseInt(page, 10);
    const limitParse = parseInt(limit, 10);

    const [adjustments, reservations] = await Promise.all([
      this.#inventoryAdjustmentRepository.findAllAndCount({
        where: { stockId },
      }),

      this.#stockReservationRepository.findAll({ where: { stockId } }),
    ]);

    const normalizedAdjustments = adjustments.rows.map((adj) => ({
      eventType: `ADJUSTMENT_${adj.adjustmentType}`,
      quantityChange:
        adj.adjustmentType === "IN" ? adj.quantity : -adj.quantity,
      eventDate: adj.adjustedAt,
      details: adj,
    }));

    const reservationAdjustments = {
      RESERVED: -1,
      SHIPPED: -1,
      IN_TRANSIT: -1,
      INSTALLED: -1,
      PICKED_UP: -1,
      COMPLETED: -1,
      CANCELLED: 1,
      RELEASED: 1,
      RETURNED: 1,
    };

    const normalizedReservations = reservations.map((res) => {
      const multiplier = reservationAdjustments[res.status] ?? 0;

      return {
        eventType: `RESERVATION_${res.status}`,
        quantityChange: multiplier * res.quantityReserved,
        eventDate: res.updatedAt,
        details: res,
      };
    });

    const fullHistory = [...normalizedAdjustments, ...normalizedReservations];

    fullHistory.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    const offset = (pageParse - 1) * limitParse;
    const paginatedItems = fullHistory.slice(offset, offset + limitParse);
    const totalItems = fullHistory.length;
    const totalPages = Math.ceil(totalItems / limitParse);

    return {
      history: paginatedItems,
      pagination: {
        currentPage: pageParse,
        totalPages,
        totalItems,
        itemsPerPage: limitParse,
      },
    };
  };

  findMostUsedTypeComponentsInWarehouse = async ({
    serviceCenterId,
    companyId,
    filters = {},
  }) => {
    const { limit, page, startDate, endDate } = filters;
    const limitParse = Number.parseInt(limit, 10) || 10;
    const pageParse = Number.parseInt(page, 10) || 1;
    const offset = (pageParse - 1) * limitParse;

    const components =
      await this.#caselineRepository.findMostUsedTypeComponents({
        serviceCenterId,
        companyId,
        limit: limitParse,
        offset,
        startDate,
        endDate,
      });

    return components;
  };

  emitLowStockAlerts = async ({ stockIds }) => {
    if (!Array.isArray(stockIds) || stockIds.length === 0) {
      return [];
    }

    const stocks = await this.#warehouseRepository.findStocksByIds({
      stockIds,
    });

    const belowStockItems = stocks.filter(
      (stock) => stock.quantityAvailable <= stock.reorderPoint
    );

    if (belowStockItems.length === 0) {
      return [];
    }

    const stocksByServiceCenter = new Map();
    const stocksByCompany = new Map();

    for (const stock of belowStockItems) {
      const { warehouse } = stock;

      if (warehouse?.serviceCenterId) {
        const roomName = `parts_coordinator_service_center_${warehouse.serviceCenterId}`;
        if (!stocksByServiceCenter.has(roomName)) {
          stocksByServiceCenter.set(roomName, []);
        }
        stocksByServiceCenter.get(roomName).push(stock);
      }

      if (warehouse?.vehicleCompanyId) {
        const roomName = `parts_coordinator_company_${warehouse.vehicleCompanyId}`;
        if (!stocksByCompany.has(roomName)) {
          stocksByCompany.set(roomName, []);
        }
        stocksByCompany.get(roomName).push(stock);
      }
    }

    for (const [roomName, items] of stocksByServiceCenter.entries()) {
      this.#notificationService.sendToRoom(roomName, "low_stock_alert", {
        stocks: items,
      });
    }

    for (const [roomName, items] of stocksByCompany.entries()) {
      this.#notificationService.sendToRoom(roomName, "low_stock_alert", {
        stocks: items,
      });
    }

    return belowStockItems;
  };
}

export default InventoryService;

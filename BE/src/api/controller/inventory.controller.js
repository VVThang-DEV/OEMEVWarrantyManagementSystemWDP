class InventoryController {
  #inventoryService;
  constructor({ inventoryService }) {
    this.#inventoryService = inventoryService;
  }

  getInventorySummary = async (req, res, next) => {
    const { serviceCenterId, roleName } = req.user;
    const { companyId } = req;
    const { serviceCenterId: filterServiceCenterId } = req.query;

    const summary = await this.#inventoryService.getInventorySummary({
      serviceCenterId,
      roleName,
      companyId,
      filters: {
        serviceCenterId: filterServiceCenterId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        summary,
      },
    });
  };

  getInventoryTypeComponents = async (req, res, next) => {
    const { serviceCenterId, roleName } = req.user;

    const { companyId } = req;

    const {
      page,
      limit,
      typeComponentId,
      serviceCenterId: filterServiceCenterId,
    } = req.query;

    const components = await this.#inventoryService.getInventoryTypeComponents({
      serviceCenterId,
      roleName,
      companyId,
      filters: {
        serviceCenterId: filterServiceCenterId,
        typeComponentId,
        page,
        limit,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        components,
      },
    });
  };

  createInventoryAdjustment = async (req, res, next) => {
    const { userId: adjustedByUserId, roleName } = req.user;
    const { companyId } = req;
    const { stockId, adjustmentType, quantity, reason, note, components } = req.body;

    const result = await this.#inventoryService.createInventoryAdjustment({
      stockId,
      adjustmentType,
      quantity,
      reason,
      note,
      components,
      adjustedByUserId,
      roleName,
      companyId,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };

  getInventoryAdjustments = async (req, res, next) => {
    const { companyId } = req;
    const { serviceCenterId, roleName } = req.user;
    const { page, limit, ...filters } = req.query;

    const result = await this.#inventoryService.getInventoryAdjustments({
      companyId,
      serviceCenterId,
      roleName,
      page,
      limit,
      filters,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  };

  getInventoryAdjustmentById = async (req, res, next) => {
    const { adjustmentId } = req.params;
    const { companyId } = req;
    const { serviceCenterId, roleName } = req.user;

    const adjustment = await this.#inventoryService.getInventoryAdjustmentById({
      adjustmentId,
      companyId,
      serviceCenterId,
      roleName,
    });

    if (!adjustment) {
      return res.status(404).json({
        status: "fail",
        message: "Adjustment not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: adjustment,
    });
  };

  getStockHistory = async (req, res, next) => {
    const { stockId } = req.params;
    const { page, limit } = req.query;

    const history = await this.#inventoryService.getStockHistory({
      stockId,
      page,
      limit,
    });

    res.status(200).json({
      status: "success",
      data: history,
    });
  };

  findMostUsedTypeComponentsInWarehouse = async (req, res, next) => {
    const { serviceCenterId, roleName } = req.user;
    const { companyId } = req;
    const { limit, page, startDate, endDate } = req.query;

    const components =
      await this.#inventoryService.findMostUsedTypeComponentsInWarehouse({
        serviceCenterId,
        companyId,
        filters: {
          limit,
          page,
          startDate,
          endDate,
        },
      });

    res.status(200).json({
      status: "success",
      data: {
        components,
      },
    });
  };
}

export default InventoryController;

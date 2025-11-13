import xlsx from "xlsx";

class StockTransferRequestController {
  #stockTransferRequestService;
  constructor({ stockTransferRequestService }) {
    this.#stockTransferRequestService = stockTransferRequestService;
  }

  createWarehouseRestockRequest = async (req, res, next) => {
    const { requestingWarehouseId, items } = req.body;
    const { userId } = req.user;
    const { companyId } = req;

    const newStockTransferRequest =
      await this.#stockTransferRequestService.createWarehouseRestockRequest({
        requestingWarehouseId,
        items,
        requestedByUserId: userId,
        companyId,
      });

    res.status(201).json({
      status: "success",
      data: {
        stockTransferRequest: newStockTransferRequest,
      },
    });
  };

  dispatchWarehouseRestockRequestWithFile = async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { id } = req.params;
    const { userId: dispatchedByUserId, roleName } = req.user;
    const { companyId } = req;

    try {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, {
        header: 0,
        defval: null,
      });

      const componentsBySku = data.slice(1).reduce((acc, row) => {
        const sku = row[0];
        const serialNumber = row[1];
        if (sku && serialNumber) {
          if (!acc[sku]) {
            acc[sku] = [];
          }
          acc[sku].push({ serialNumber });
        }
        return acc;
      }, {});

      const result =
        await this.#stockTransferRequestService.dispatchWarehouseRestockRequestWithFile(
          {
            requestId: id,
            componentsBySku,
            dispatchedByUserId,
            roleName,
            companyId,
          }
        );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createStockTransferRequest = async (req, res, next) => {
    const { requestingWarehouseId, items, caselineIds } = req.body;
    const { serviceCenterId, userId } = req.user;

    const { companyId } = req;

    const newStockTransferRequest =
      await this.#stockTransferRequestService.createStockTransferRequest({
        requestingWarehouseId,
        items,
        requestedByUserId: userId,
        serviceCenterId,
        companyId,
      });

    res.status(201).json({
      status: "success",
      data: {
        stockTransferRequest: newStockTransferRequest,
      },
    });
  };

  getAllStockTransferRequests = async (req, res, next) => {
    const { userId, roleName, serviceCenterId } = req.user;
    const { companyId } = req;

    const { page = 1, limit = 10, status } = req.query;

    const stockTransferRequests =
      await this.#stockTransferRequestService.getAllStockTransferRequests({
        userId,
        roleName,
        serviceCenterId,
        companyId,
        page,
        limit,
        status,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequests,
      },
    });
  };

  getStockTransferRequestById = async (req, res, next) => {
    const { id } = req.params;

    const { userId, roleName, serviceCenterId } = req.user;
    const { companyId } = req;

    const stockTransferRequest =
      await this.#stockTransferRequestService.getStockTransferRequestById({
        id,
        userId,
        roleName,
        serviceCenterId,
        companyId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest,
      },
    });
  };

  approveWarehouseRestockRequest = async (req, res, next) => {
    const { id } = req.params;
    const { userId, roleName } = req.user;
    const { companyId } = req;

    const approvedStockTransferRequest =
      await this.#stockTransferRequestService.approveWarehouseRestockRequest({
        id,
        roleName,
        companyId,
        approvedByUserId: userId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: approvedStockTransferRequest,
      },
    });
  };

  approveStockTransferRequest = async (req, res, next) => {
    const { id } = req.params;

    const { userId, roleName } = req.user;

    const { companyId } = req;

    const approvedStockTransferRequest =
      await this.#stockTransferRequestService.approveStockTransferRequest({
        id,
        roleName,
        companyId,
        approvedByUserId: userId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: approvedStockTransferRequest,
      },
    });
  };

  shipStockTransferRequest = async (req, res, next) => {
    const { id } = req.params;

    const { roleName } = req.user;

    const { companyId } = req;

    const { estimatedDeliveryDate } = req.body;

    const shippedStockTransferRequest =
      await this.#stockTransferRequestService.shipStockTransferRequest({
        requestId: id,
        roleName,
        estimatedDeliveryDate,
        companyId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: shippedStockTransferRequest,
      },
    });
  };

  receiveStockTransferRequest = async (req, res, next) => {
    const { id } = req.params;

    const { userId, roleName, serviceCenterId } = req.user;

    const receivedStockTransferRequest =
      await this.#stockTransferRequestService.receiveStockTransferRequest({
        requestId: id,
        userId,
        roleName,
        serviceCenterId,
        receivedByUserId: userId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: receivedStockTransferRequest,
      },
    });
  };

  rejectStockTransferRequest = async (req, res, next) => {
    const { id } = req.params;
    const { userId, roleName } = req.user;
    const { rejectionReason } = req.body;

    const rejectedStockTransferRequest =
      await this.#stockTransferRequestService.rejectStockTransferRequest({
        requestId: id,
        rejectedByUserId: userId,
        rejectionReason,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: rejectedStockTransferRequest,
      },
    });
  };

  cancelStockTransferRequest = async (req, res, next) => {
    const { id } = req.params;
    const { userId, roleName } = req.user;
    const { cancellationReason } = req.body;
    const { companyId } = req;

    const cancelledStockTransferRequest =
      await this.#stockTransferRequestService.cancelStockTransferRequest({
        requestId: id,
        cancelledByUserId: userId,
        cancellationReason,
        roleName,
        companyId,
      });

    res.status(200).json({
      status: "success",
      data: {
        stockTransferRequest: cancelledStockTransferRequest,
      },
    });
  };
}

export default StockTransferRequestController;

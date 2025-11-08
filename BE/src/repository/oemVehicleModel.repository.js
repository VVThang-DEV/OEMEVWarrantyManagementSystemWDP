import db from "../models/index.cjs";

const { VehicleModel } = db;

class OemVehicleModelRepository {
  findBySku = async (sku, transaction = null, lock = null) => {
    const record = await VehicleModel.findOne({
      where: {
        sku: sku,
      },
      transaction: transaction,
      lock: lock,
    });

    return record ? record.toJSON() : null;
  };

  findByNameAndCompanyId = async (
    { vehicleModelName, companyId },
    transaction = null,
    lock = null
  ) => {
    const record = await VehicleModel.findOne({
      where: {
        vehicleModelName: vehicleModelName,
        vehicleCompanyId: companyId,
      },
      transaction: transaction,
    });

    return record ? record.toJSON() : null;
  };

  findByIdAndCompanyId = async ({ vehicleModelId, companyId }) => {
    const record = await VehicleModel.findOne({
      where: {
        vehicleModelId: vehicleModelId,
        vehicleCompanyId: companyId,
      },
    });

    return record ? record.toJSON() : null;
  };

  createVehicleModel = async (vehicleModelData, transaction = null) => {
    const record = await VehicleModel.create(vehicleModelData, {
      transaction: transaction,
    });

    return record.toJSON();
  };
}

export default OemVehicleModelRepository;

import db from "../models/index.cjs";
import { ConflictError, NotFoundError } from "../error/index.js";

class OemVehicleModelService {
  #oemVehicleModelRepository;
  #warrantyComponentRepository;
  #typeComponentRepository;

  constructor({
    oemVehicleModelRepository,
    warrantyComponentRepository,
    typeComponentRepository,
  }) {
    this.#oemVehicleModelRepository = oemVehicleModelRepository;
    this.#warrantyComponentRepository = warrantyComponentRepository;
    this.#typeComponentRepository = typeComponentRepository;
  }

  createVehicleModel = async ({
    vehicleModelName,
    yearOfLaunch,
    placeOfManufacture,
    generalWarrantyDuration,
    generalWarrantyMileage,
    companyId,
  }) => {
    return db.sequelize.transaction(async (transaction) => {
      const existingModel =
        await this.#oemVehicleModelRepository.findByNameAndCompanyId(
          vehicleModelName,
          companyId,
          transaction
        );

      if (existingModel) {
        throw new ConflictError("Vehicle model already exists");
      }

      const dataToCreatevehicleModel = {
        vehicleModelName,
        yearOfLaunch,
        placeOfManufacture,
        generalWarrantyDuration,
        generalWarrantyMileage,
        vehicleCompanyId: companyId,
      };

      const vehicleModel =
        await this.#oemVehicleModelRepository.createVehicleModel(
          dataToCreatevehicleModel,
          transaction
        );

      return vehicleModel;
    });
  };
}

export default OemVehicleModelService;

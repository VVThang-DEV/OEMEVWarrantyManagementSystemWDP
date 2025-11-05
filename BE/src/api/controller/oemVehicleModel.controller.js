class OemVehicleModelController {
  #oemVehicleModelService;
  constructor({ oemVehicleModelService }) {
    this.#oemVehicleModelService = oemVehicleModelService;
  }

  createVehicleModel = async (req, res) => {
    const {
      vehicleModelName,
      yearOfLaunch,
      placeOfManufacture,
      generalWarrantyDuration,
      generalWarrantyMileage,
    } = req.body;

    const { companyId } = req;

    const result = await this.#oemVehicleModelService.createVehicleModel({
      vehicleModelName,
      yearOfLaunch,
      placeOfManufacture,
      generalWarrantyDuration,
      generalWarrantyMileage,
      companyId,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };
}

export default OemVehicleModelController;

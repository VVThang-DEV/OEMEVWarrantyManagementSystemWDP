import Joi from "joi";

const warehouseRestockRequestItemSchema = Joi.object({
  sku: Joi.string().required(),
  quantityRequested: Joi.number().integer().min(1).required(),
});

export const createWarehouseRestockRequestSchema = Joi.object({
  requestingWarehouseId: Joi.string().uuid().required(),
  items: Joi.array().items(warehouseRestockRequestItemSchema).min(1).required(),
});

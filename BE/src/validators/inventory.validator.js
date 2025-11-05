import Joi from "joi";

export const createInventoryAdjustmentBodySchema = Joi.object({
  stockId: Joi.string().uuid().required(),
  adjustmentType: Joi.string().valid("IN", "OUT").required(),
  reason: Joi.string().required(),
  note: Joi.string().allow(null, "").optional(),
}).when(Joi.object({ adjustmentType: Joi.string().valid("IN") }).unknown(), {
  then: Joi.object({
    components: Joi.array()
      .items(
        Joi.object({
          serialNumber: Joi.string().required(),
        })
      )
      .min(1)
      .required(),
  }),
  otherwise: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),
});

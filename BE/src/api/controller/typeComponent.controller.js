class TypeComponentController {
  #typeComponentService;
  constructor({ typeComponentService }) {
    this.#typeComponentService = typeComponentService;
  }

  createTypeComponent = async (req, res) => {
    const { name, sku, category, price } = req.body;

    const result = await this.#typeComponentService.createTypeComponent({
      name,
      sku,
      category,
      price,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  };
}

export default TypeComponentController;

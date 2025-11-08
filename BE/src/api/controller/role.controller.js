class RoleController {
  #roleService;

  constructor({ roleService }) {
    this.#roleService = roleService;
  }

  getAllRoles = async (req, res, next) => {
    try {
      const roles = await this.#roleService.getAllRoles();
      res.status(200).json({
        status: "success",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  };

  getRoleById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const role = await this.#roleService.getRoleById(id);
      res.status(200).json({
        status: "success",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default RoleController;

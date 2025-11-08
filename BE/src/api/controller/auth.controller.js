class AuthController {
  #authService;
  constructor({ authService }) {
    this.#authService = authService;
  }

  login = async (req, res, next) => {
    const { username, password } = req.body;

    const result = await this.#authService.login({ username, password });

    res.status(200).json({
      status: "success",
      data: {
        token: result,
      },
    });
  };

  registerAccount = async (req, res, next) => {
    const {
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      employeeCode,
    } = req.body;

    const { serviceCenterId: tokenServiceCenterId } = req.user;

    const { companyId: companyTokenId } = req;

    const newUser = await this.#authService.registerAccount({
      username,
      password,
      email,
      phone,
      address,
      name,
      roleId,
      employeeCode,
      serviceCenterId: tokenServiceCenterId ?? null,
      vehicleCompanyId: companyTokenId ?? null,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  };
}

export default AuthController;

import { Transaction } from "sequelize";
import {
  AuthenticationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../error/index.js";
import db from "../models/index.cjs";

class AuthService {
  #userRepository;
  #hashService;
  #tokenService;
  #serviceCenterRepository;

  constructor({
    userRepository,
    hashService,
    tokenService,
    serviceCenterRepository,
  }) {
    this.#userRepository = userRepository;
    this.#hashService = hashService;
    this.#tokenService = tokenService;
    this.#serviceCenterRepository = serviceCenterRepository;
  }

  login = async ({ username, password }) => {
    const existingUser = await this.#userRepository.findByUsername({
      username: username,
    });

    if (!existingUser) {
      throw new AuthenticationError("Username or password is incorrect");
    }

    const isMatchedPassword = await this.#hashService.compare({
      string: password,
      hashed: existingUser.password,
    });

    if (!isMatchedPassword) {
      throw new AuthenticationError("Username or password is incorrect");
    }

    const token = this.#tokenService.generateToken({
      userId: existingUser.userId,
      roleName: existingUser.role.roleName,
      serviceCenterId: existingUser.serviceCenterId,
      companyId: existingUser.vehicleCompanyId,
    });

    return token;
  };

  registerAccount = async ({
    username,
    password,
    email,
    phone,
    address,
    name,
    roleId,
    employeeCode,
    serviceCenterId,
    vehicleCompanyId,
  }) => {
    const existingUser = await this.#userRepository.findByUsername({
      username: username,
    });

    if (existingUser) {
      throw new ConflictError("Username already exists");
    }

    if (!employeeCode || typeof employeeCode !== "string") {
      throw new BadRequestError("employeeCode is required");
    }

    const normalizedEmployeeCode = employeeCode.trim();

    if (!normalizedEmployeeCode) {
      throw new BadRequestError("employeeCode cannot be empty");
    }

    const newUser = await db.sequelize.transaction(async (transaction) => {
      const existingEmployeeCodes =
        await this.#userRepository.findUsersByEmployeeCodes(
          [normalizedEmployeeCode],
          transaction
        );

      if (existingEmployeeCodes && existingEmployeeCodes.length > 0) {
        throw new ConflictError("employeeCode already exists");
      }

      const hashedPassword = await this.#hashService.hash({ string: password });

      if (serviceCenterId && vehicleCompanyId) {
        throw new BadRequestError(
          "Provide either serviceCenterId or vehicleCompanyId, not both"
        );
      }

      if (!serviceCenterId && !vehicleCompanyId) {
        throw new BadRequestError(
          "serviceCenterId or vehicleCompanyId must be provided"
        );
      }

      if (serviceCenterId) {
        const serviceCenter =
          await this.#serviceCenterRepository.findServiceCenterById(
            {
              serviceCenterId,
            },
            transaction,
            Transaction.LOCK.SHARE
          );

        if (!serviceCenter) {
          throw new NotFoundError("Service Center not found");
        }

        return this.#userRepository.createUser(
          {
            username,
            password: hashedPassword,
            email,
            phone,
            address,
            name,
            roleId,
            employeeCode: normalizedEmployeeCode,
            serviceCenterId,
          },
          transaction
        );
      }

      return this.#userRepository.createUser(
        {
          username,
          password: hashedPassword,
          email,
          phone,
          address,
          name,
          roleId,
          employeeCode: normalizedEmployeeCode,
          vehicleCompanyId,
        },
        transaction
      );
    });

    const { password: _password, ...userWithoutPassword } = newUser
      ? newUser.get({ plain: true })
      : {};

    return userWithoutPassword;
  };
}

export default AuthService;

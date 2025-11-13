import dayjs from "dayjs";
import db from "../models/index.cjs";
const {
  User,
  Role,
  ServiceCenter,
  WorkSchedule,
  TaskAssignment,
  VehicleCompany,
} = db;

class UserRepository {
  async findByUsername({ username }) {
    const existingUser = await User.findOne({
      where: {
        username: username,
      },

      include: [
        {
          model: Role,
          as: "role",
          attributes: ["roleName"],
        },
      ],
    });

    if (!existingUser) {
      return null;
    }

    return existingUser.toJSON();
  }

  async findUsersByEmployeeCodes(employeeCodes, transaction = null) {
    const users = await User.findAll({
      where: {
        employeeCode: employeeCodes,
      },
      transaction,
    });
    return users.map((user) => user.toJSON());
  }

  async getAllTechnicians({ status, serviceCenterId }) {
    const today = dayjs().format("YYYY-MM-DD");

    const whereCondition = {
      workDate: today,
    };

    if (status) {
      whereCondition.status = status;
    }

    const userCondition = {
      roleId: await Role.findOne({
        where: { roleName: "service_center_technician" },
      }).then((role) => role?.roleId),
    };

    if (serviceCenterId) {
      userCondition.serviceCenterId = serviceCenterId;
    }

    const technicians = await User.findAll({
      where: userCondition,
      attributes: [
        "userId",
        "name",
        "employeeCode",
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM task_assignment
            WHERE task_assignment.technician_id = User.user_id
            AND task_assignment.is_active = true
          )`),
          "activeTaskCount",
        ],
      ],

      include: [
        {
          model: WorkSchedule,
          as: "workSchedule",
          where: whereCondition,
          attributes: ["workDate", "status"],
          required: false,
        },
      ],
    });

    return technicians.map((technician) => technician.toJSON());
  }

  async findUserById({ userId }, transaction = null, lock = null) {
    const user = await User.findOne({
      where: {
        userId: userId,
      },

      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: ServiceCenter,
          as: "serviceCenter",
          attributes: ["serviceCenterId", "name", "address"],

          include: [
            {
              model: VehicleCompany,
              as: "vehicleCompany",
              attributes: ["vehicleCompanyId", "name"],
              required: false,
            },
          ],
        },
      ],

      transaction,
      lock,
    });

    if (!user) {
      return null;
    }

    return user.toJSON();
  }

  findByPhone = async ({ phone }, transaction = null, lock = null) => {
    const user = await User.findOne({
      where: {
        phone: phone,
      },

      include: [
        {
          model: Role,
          as: "role",
          attributes: ["roleName"],
        },
      ],

      transaction,
      lock,
    });

    return user ? user.toJSON() : null;
  };

  createUser = async (
    {
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
    },
    transaction = null
  ) => {
    const newUser = await User.create(
      {
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
      },
      { transaction }
    );

    return newUser;
  };
}

export default UserRepository;

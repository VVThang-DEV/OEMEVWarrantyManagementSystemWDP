import db from "../models/index.cjs";
const { Role } = db;

class RoleRepository {
  async findAll() {
    const roles = await Role.findAll({
      attributes: ["roleId", "roleName", "description"],
    });
    return roles.map((role) => role.toJSON());
  }

  async findById(roleId) {
    const role = await Role.findByPk(roleId, {
      attributes: ["roleId", "roleName", "description"],
    });
    return role ? role.toJSON() : null;
  }
}

export default RoleRepository;

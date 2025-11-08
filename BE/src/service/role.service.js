import { NotFoundError } from "../error/index.js";

class RoleService {
  #roleRepository;

  constructor({ roleRepository }) {
    this.#roleRepository = roleRepository;
  }

  async getAllRoles() {
    return await this.#roleRepository.findAll();
  }

  async getRoleById(roleId) {
    const role = await this.#roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} not found.`);
    }
    return role;
  }
}

export default RoleService;

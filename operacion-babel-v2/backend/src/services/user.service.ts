import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getActiveUsers(onlyAdmins: boolean = false) {
    return await this.userRepo.getActiveUsers(onlyAdmins);
  }

  async getProfile(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario inválido.');
    const user = await this.userRepo.findById(idUsuario);
    if (!user) throw new Error('Expediente del soldado no encontrado.');
    return user;
  }

  async deleteUser(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario inválido.');
    const deleted = await this.userRepo.deleteUser(idUsuario);
    if (!deleted) throw new Error('No se pudo dar de baja al recluta.');
    return { mensaje: 'Baja del personal ejecutada con éxito.' };
  }

  async getConfig(idUsuario: number) {
    return await this.userRepo.getConfiguracion(idUsuario);
  }

  async updateConfig(idUsuario: number, daltonico: boolean, animacionesReducidas: boolean) {
    await this.userRepo.updateConfiguracion(idUsuario, daltonico, animacionesReducidas);
    return { mensaje: 'Configuración táctica actualizada.' };
  }

  async regenerateLives(idUsuario: number) {
    return await this.userRepo.regenerarVidas(idUsuario);
  }
}

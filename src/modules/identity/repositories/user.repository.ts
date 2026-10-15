import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { UserRole, AccountStatus } from '../interfaces/identity.interface.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async findByCommunityId(communityId: string): Promise<User[]> {
    return this.userRepository.find({ where: { communityId } });
  }

  async findByRoleAndCommunity(role: UserRole, communityId: string): Promise<User[]> {
    return this.userRepository.find({ where: { role, communityId } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findByIdOrFail(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async findPendingVerification(): Promise<User[]> {
    return this.userRepository.find({
      where: { accountStatus: AccountStatus.PENDING_VERIFICATION },
    });
  }

  async findActiveByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role, accountStatus: AccountStatus.ACTIVE },
    });
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.userRepository.count({ where: { role } });
  }

  async findWithRelations(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['locationPreference', 'responderProfiles', 'responderProfiles.community'],
    });
  }
}
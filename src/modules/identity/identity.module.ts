import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserLocationPreference } from './entities/user-location-preference.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserLocationPreference])],
  exports: [TypeOrmModule],
})
export class IdentityModule {}
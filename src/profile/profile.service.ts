import { Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  getProfile() {
    return this.profileRepository.findFirst();
  }
}

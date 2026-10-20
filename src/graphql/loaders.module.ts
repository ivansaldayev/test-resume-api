import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { LoadersFactory } from './loaders.factory.js';

@Module({
  imports: [ProfileModule],
  providers: [LoadersFactory],
  exports: [LoadersFactory],
})
export class LoadersModule {}

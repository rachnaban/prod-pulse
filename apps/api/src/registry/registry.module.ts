import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';

@Module({
  providers: [RegistryService],
  controllers: [RegistryController],
  exports: [RegistryService],
})
export class RegistryModule {}

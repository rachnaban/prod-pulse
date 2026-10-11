import { Controller, Get, Body, Post, Param, NotFoundException } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { AppRegistration } from '../metrics/types';

@Controller('api/apps')
export class RegistryController {
  constructor(private registry: RegistryService) {}

  @Get()
  list(): AppRegistration[] {
    return this.registry.list();
  }

  @Get(':id')
  get(@Param('id') id: string): AppRegistration {
    const app = this.registry.get(id);
    if (!app) throw new NotFoundException(`Unknown app ${id}`);
    return app;
  }

  @Post()
  upsert(@Body() body: Partial<AppRegistration>): AppRegistration {
    return this.registry.upsert(body);
  }
}

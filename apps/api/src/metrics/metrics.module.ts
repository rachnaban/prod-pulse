import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MetricsStore } from './metrics.store';
import { MemoryCache } from './memory-cache';
import { RedisCache } from './redis-cache';
import { METRICS_CACHE } from './metrics-cache.interface';
import { MetricsController } from './metrics.controller';
import { SplunkModule } from '../splunk/splunk.module';
import { AggregationService } from '../aggregation/aggregation.service';
import { RegistryModule } from '../registry/registry.module';

@Module({
  imports: [ConfigModule, SplunkModule, RegistryModule],
  providers: [
    MemoryCache,
    RedisCache,
    {
      provide: METRICS_CACHE,
      useFactory: (cfg: ConfigService) =>
        cfg.get<string>('redisUrl') ? new RedisCache(cfg) : new MemoryCache(),
      inject: [ConfigService],
    },
    MetricsStore,
    AggregationService,
  ],
  controllers: [MetricsController],
  exports: [MetricsStore],
})
export class MetricsModule {}

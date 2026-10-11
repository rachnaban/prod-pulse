import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MockSplunkAdapter } from './mock-splunk.adapter';
import { RealSplunkAdapter } from './real-splunk.adapter';

export const SPLUNK_ADAPTER = 'SPLUNK_ADAPTER';

@Module({
  imports: [ConfigModule],
  providers: [
    MockSplunkAdapter,
    RealSplunkAdapter,
    {
      provide: SPLUNK_ADAPTER,
      useFactory: (cfg: ConfigService) =>
        cfg.get<string>('splunk.mode') === 'real'
          ? new RealSplunkAdapter(cfg)
          : new MockSplunkAdapter(),
      inject: [ConfigService],
    },
  ],
  exports: [SPLUNK_ADAPTER],
})
export class SplunkModule {}

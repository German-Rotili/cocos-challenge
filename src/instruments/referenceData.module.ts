import { Module } from '@nestjs/common';
import { InstrumentsModule } from './instruments.module';
import { ReferenceDataController } from './referenceData.controller';

/** Import this module only when referenceDataEndpointsEnabled() is true. */
@Module({
  imports: [InstrumentsModule],
  controllers: [ReferenceDataController],
})
export class ReferenceDataModule {}

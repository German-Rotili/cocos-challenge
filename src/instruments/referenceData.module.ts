import { Module } from '@nestjs/common';
import { InstrumentsModule } from './instruments.module';
import { ReferenceDataController } from './referenceData.controller';

@Module({
  imports: [InstrumentsModule],
  controllers: [ReferenceDataController],
})
export class ReferenceDataModule {}

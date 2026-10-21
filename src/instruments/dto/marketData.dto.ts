import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import type { MarketData as MarketDataEntity } from '../../database/entities/marketData.entity';

// ---------- Request ----------

/** open, high and low default to close: tests and manual loads usually only know the close. */
export class AddMarketDataDto {
  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  close!: number;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  previousClose!: number;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  open?: number;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  high?: number;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  low?: number;
}

// ---------- Response ----------

export class MarketDataResponse {
  id!: number;
  instrumentId!: number;
  open!: number;
  high!: number;
  low!: number;
  close!: number;
  previousClose!: number;

  @ApiProperty({ format: 'date-time' })
  datetime!: string;
}

export function toMarketDataResponse(
  row: MarketDataEntity,
): MarketDataResponse {
  return {
    id: row.id,
    instrumentId: row.instrumentId,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    previousClose: row.previousClose,
    datetime: row.datetime.toISOString(),
  };
}

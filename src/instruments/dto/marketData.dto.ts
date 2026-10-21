import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import type { MarketData as MarketDataEntity } from '../../database/entities/marketData.entity';

// ---------- Request ----------

/** open, high and low default to close: tests and manual loads usually only know the close. */
export class AddMarketDataDto {
  @IsNumber()
  @IsPositive()
  close!: number;

  @IsNumber()
  @IsPositive()
  previousClose!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  open?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  high?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  low?: number;
}

// ---------- Response ----------

export interface MarketDataResponse {
  id: number;
  instrumentId: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  datetime: string;
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

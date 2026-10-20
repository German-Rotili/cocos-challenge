import { IsNumber, IsOptional, IsPositive } from 'class-validator';

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

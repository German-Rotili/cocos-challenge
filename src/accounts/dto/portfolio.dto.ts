import { ApiProperty } from '@nestjs/swagger';
import { toPercent } from '../../shared/http/percent';
import type { Portfolio } from '../domain/portfolio.valueObject';
import type { PositionValuation } from '../domain/position.valueObject';

// ---------- Response ----------

export class PositionResponse {
  instrumentId!: number;
  ticker!: string;
  name!: string;
  quantity!: number;
  averageCost!: number;

  @ApiProperty({ type: Number, nullable: true })
  marketValue!: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent' })
  totalReturn!: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent' })
  dailyReturn!: number | null;
}

export class PortfolioResponse {
  userId!: number;
  totalValue!: number;
  availableCash!: number;
  positions!: PositionResponse[];
}

/** The domain keeps returns as ratios; the API shows them as percentages, listed by ticker. */
export function toPortfolioResponse(portfolio: Portfolio): PortfolioResponse {
  return {
    userId: portfolio.userId,
    totalValue: portfolio.totalValue.toNumber(),
    availableCash: portfolio.availableCash.toNumber(),
    positions: [...portfolio.positions]
      .sort((a, b) => a.ticker.localeCompare(b.ticker))
      .map(toPositionResponse),
  };
}

function toPositionResponse(position: PositionValuation): PositionResponse {
  return {
    ...position,
    marketValue: position.marketValue?.toNumber() ?? null,
    totalReturn: toPercent(position.totalReturn),
    dailyReturn: toPercent(position.dailyReturn),
  };
}

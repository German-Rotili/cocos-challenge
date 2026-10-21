import { toPercent } from '../shared/http/percent';
import type { Portfolio } from './domain/account.aggregate';
import type { PositionValuation } from './domain/position.valueObject';

export interface PositionResponse {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  marketValue: number | null;
  totalReturn: number | null; // percent
  dailyReturn: number | null; // percent
}

export interface PortfolioResponse {
  userId: number;
  totalValue: number;
  availableCash: number;
  positions: PositionResponse[];
}

/** The domain keeps returns as ratios; the API shows them as percentages, listed by ticker. */
export function toPortfolioResponse(portfolio: Portfolio): PortfolioResponse {
  return {
    userId: portfolio.userId,
    totalValue: portfolio.totalValue,
    availableCash: portfolio.availableCash,
    positions: [...portfolio.positions]
      .sort((a, b) => a.ticker.localeCompare(b.ticker))
      .map(toPositionResponse),
  };
}

function toPositionResponse(position: PositionValuation): PositionResponse {
  return {
    ...position,
    totalReturn: toPercent(position.totalReturn),
    dailyReturn: toPercent(position.dailyReturn),
  };
}

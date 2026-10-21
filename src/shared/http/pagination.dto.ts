import { Type as ClassType } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

export interface PageRequest {
  limit: number;
  offset: number;
}

export interface Page<T> extends PageRequest {
  items: T[];
  total: number;
}

// ---------- Request ----------

export class PaginationQueryDto implements PageRequest {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_LIMIT,
    default: DEFAULT_PAGE_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

// ---------- Response ----------

/** Swagger needs a concrete class per item type: `class OrderPage extends PageOf(OrderResponse) {}`. */
export function PageOf<T>(item: ClassType<T>) {
  abstract class PageResponse implements Page<T> {
    @ApiProperty({ type: [item] })
    items!: T[];

    @ApiProperty({ description: 'Matching items across all pages' })
    total!: number;

    @ApiProperty()
    limit!: number;

    @ApiProperty()
    offset!: number;
  }
  return PageResponse;
}

export function mapPage<T, R>(page: Page<T>, map: (item: T) => R): Page<R> {
  return { ...page, items: page.items.map(map) };
}

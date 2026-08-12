import { IsOptional, IsEnum, IsString, IsNumber, Min, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { LoanStatus } from '../enums/loan-status.enum';

export class LoanFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  // `search` is provided by PaginationDto; do not redeclare here.
}

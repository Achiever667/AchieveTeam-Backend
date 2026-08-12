import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { RepaymentStatus } from '../enums';

export class RepaymentsFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus;

  @IsOptional()
  @IsUUID()
  loanId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  // `search` is provided by PaginationDto; do not redeclare here.
}

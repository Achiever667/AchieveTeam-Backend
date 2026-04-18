import { IsIn, IsOptional } from 'class-validator';
import type { LoanStatus } from '../interfaces/loan.interface';

export class QueryLoansDto {
  @IsOptional()
  @IsIn(['pending', 'active'])
  status?: LoanStatus;
}

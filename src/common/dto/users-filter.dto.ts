import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { Role } from '../enums/role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class UsersFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  department?: string;

  // `search` is provided by PaginationDto; do not redeclare here.
}

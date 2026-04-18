import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { QueryLoansDto } from './dto/query-loans.dto';
import { LoansService } from './loans.service';

@Controller()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('loans')
  getLoans(
    @Query() query: QueryLoansDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.getLoans(request.user.role, query.status);
  }

  @Get('loans/expired')
  getExpiredLoans(@Req() request: { user: AuthenticatedUser }) {
    return this.loansService.getExpiredLoans(request.user.role);
  }

  @Get('loans/:userEmail/get')
  getLoansByUserEmail(
    @Param('userEmail') userEmail: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.getLoansByUserEmail(userEmail, request.user.role);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete('loan/:loanId/delete')
  deleteLoan(@Param('loanId') loanId: string) {
    return this.loansService.deleteLoan(loanId);
  }
}

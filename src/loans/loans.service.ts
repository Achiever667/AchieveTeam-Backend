import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role } from '../common/enums/role.enum';
import { LoanFilterDto } from '../common/dto/loan-filter.dto';
import { buildPrismaPagination, formatPaginated } from '../common/utils/prisma-pagination.util';

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async getLoans(role: Role, filter: LoanFilterDto) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, userId, dateFrom, dateTo, minAmount, maxAmount, search } = filter as any;

    const { take, skip, orderBy } = buildPrismaPagination(page, limit, sort, order);

    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
    if (minAmount || maxAmount) where.amount = {};
    if (minAmount) where.amount.gte = Number(minAmount);
    if (maxAmount) where.amount.lte = Number(maxAmount);
    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        take,
        skip,
        orderBy,
        include: { user: true },
      }),
      this.prisma.loan.count({ where }),
    ]);

    const mapped = items.map((l) => this.mapLoan(l, role));

    return {
      data: formatPaginated(mapped, total, page, limit),
    };
  }

  async getLoansByUserEmail(userEmail: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return { data: { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } };

    const items = await this.prisma.loan.findMany({ where: { userId: user.id }, include: { user: true } });
    return { loans: items.map((l) => this.mapLoan(l, role)) };
  }

  async getExpiredLoans(role: Role) {
    // Expiry is determined by schedules; treat loans with any schedule due < now and unpaid
    const now = new Date();
    const schedules = await this.prisma.loanSchedule.findMany({ where: { dueDate: { lt: now }, status: { not: 'PAID' } }, include: { loan: { include: { user: true } } } });
    const loans = schedules.map((s) => this.mapLoan(s.loan, role));
    return loans;
  }

  async deleteLoan(loanId: string) {
    // Only soft-delete is implemented by removing the record
    try {
      await this.prisma.loan.delete({ where: { id: loanId } });
    } catch (e) {
      throw new NotFoundException(`Loan with id ${loanId} not found`);
    }

    return { message: 'Loan deleted successfully' };
  }

  private mapLoan(l: any, role: Role) {
    const applicant = {
      id: l.user.id,
      name: l.user.name,
      email: l.user.email,
      department: l.user.department,
      // totalLoan isn't modelled in User; include null for compatibility
      totalLoan: (l.amount || null)?.toString?.() ?? null,
    };

    const loan = {
      id: l.id,
      amount: l.amount?.toString?.() ?? '0',
      maturityDate: l.disbursedAt ? l.disbursedAt.toISOString() : l.createdAt.toISOString(),
      status: l.status.toLowerCase(),
      applicant,
      createdAt: l.createdAt.toISOString(),
      loanNumber: l.loanNumber,
    };

    if (role === Role.STAFF) {
      const { totalLoan, ...safeApplicant } = applicant as any;
      return { ...loan, applicant: safeApplicant };
    }

    return loan;
  }
}

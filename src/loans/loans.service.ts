import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { Role } from '../common/enums/role.enum';
import { appConfig } from '../config/app.config';
import { readJsonFile } from '../utils/file-storage.util';
import { Loan, LoanForStaff, LoanStatus } from './interfaces/loan.interface';

@Injectable()
export class LoansService implements OnModuleInit {
  private loans: Loan[] = [];
  private readonly filePath = join(appConfig.dataDirectory, 'loans.json');

  async onModuleInit(): Promise<void> {
    this.loans = await readJsonFile<Loan[]>(this.filePath);
  }

  async getLoans(role: Role, status?: LoanStatus): Promise<Array<Loan | LoanForStaff>> {
    if (this.loans.length === 0) {
      await this.onModuleInit();
    }

    const filteredLoans = status
      ? this.loans.filter((loan) => loan.status === status)
      : this.loans;

    return filteredLoans.map((loan) => this.transformLoanByRole(loan, role));
  }

  async getLoansByUserEmail(
    userEmail: string,
    role: Role,
  ): Promise<{ loans: Array<Loan | LoanForStaff> }> {
    if (this.loans.length === 0) {
      await this.onModuleInit();
    }

    const loans = this.loans
      .filter((loan) => loan.applicant.email.toLowerCase() === userEmail.toLowerCase())
      .map((loan) => this.transformLoanByRole(loan, role));

    return { loans };
  }

  async getExpiredLoans(role: Role): Promise<Array<Loan | LoanForStaff>> {
    if (this.loans.length === 0) {
      await this.onModuleInit();
    }

    const currentDate = new Date();
    const expiredLoans = this.loans.filter((loan) => {
      const maturityDate = new Date(loan.maturityDate.replace(' ', 'T'));
      return maturityDate < currentDate;
    });

    return expiredLoans.map((loan) => this.transformLoanByRole(loan, role));
  }

  async deleteLoan(loanId: string): Promise<{ message: string }> {
    if (this.loans.length === 0) {
      await this.onModuleInit();
    }

    const nextLoans = this.loans.filter((loan) => loan.id !== loanId);

    if (nextLoans.length === this.loans.length) {
      throw new NotFoundException(`Loan with id ${loanId} not found`);
    }

    this.loans = nextLoans;

    return {
      message: 'Loan deleted successfully for the current runtime session',
    };
  }

  private transformLoanByRole(loan: Loan, role: Role): Loan | LoanForStaff {
    if (role !== Role.STAFF) {
      return { ...loan };
    }

    const { totalLoan: _totalLoan, ...safeApplicant } = loan.applicant;

    return {
      ...loan,
      applicant: safeApplicant,
    };
  }
}

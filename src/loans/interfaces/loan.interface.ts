export type LoanStatus = 'pending' | 'active';

export interface LoanApplicant {
  name: string;
  email: string;
  telephone: string;
  totalLoan: string;
}

export interface Loan {
  id: string;
  amount: string;
  maturityDate: string;
  status: LoanStatus;
  applicant: LoanApplicant;
  createdAt: string;
}

export type LoanForStaff = Omit<Loan, 'applicant'> & {
  applicant: Omit<LoanApplicant, 'totalLoan'>;
};

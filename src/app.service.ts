import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Loan management API is running',
    };
  }
}

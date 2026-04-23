import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { appConfig } from '../config/app.config';
import { Staff, StaffSafe } from './interfaces/staff.interface';

@Injectable()
export class StaffService {
  private staff: Staff[] = [];

  constructor() {
    const primaryFilePath = join(appConfig.dataDirectory, 'staffs.json');
    const fallbackFilePath = join(appConfig.dataDirectory, 'staff.json');
    const filePath = existsSync(primaryFilePath)
      ? primaryFilePath
      : fallbackFilePath;
    const file = readFileSync(filePath, 'utf-8');
    this.staff = JSON.parse(file);
  }

  findByEmail(email: string): Staff | undefined {
    return this.staff.find(
      (member) => member.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findById(id: number): Staff | undefined {
    return this.staff.find((member) => member.id === id);
  }

  sanitizeStaff(staff: Staff): StaffSafe {
    const { password: _password, ...safeStaff } = staff;
    return safeStaff;
  }
}

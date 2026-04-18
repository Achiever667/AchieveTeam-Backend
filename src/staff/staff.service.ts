import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { appConfig } from '../config/app.config';
import { readJsonFile } from '../utils/file-storage.util';
import { Staff, StaffSafe } from './interfaces/staff.interface';

@Injectable()
export class StaffService implements OnModuleInit {
  private staff: Staff[] = [];
  private readonly filePath = join(appConfig.dataDirectory, 'staff.json');

  async onModuleInit(): Promise<void> {
    this.staff = await readJsonFile<Staff[]>(this.filePath);
  }

  async findByEmail(email: string): Promise<Staff | undefined> {
    if (this.staff.length === 0) {
      await this.onModuleInit();
    }

    return this.staff.find(
      (member) => member.email.toLowerCase() === email.toLowerCase(),
    );
  }

  sanitizeStaff(staff: Staff): StaffSafe {
    const { password: _password, ...safeStaff } = staff;
    return safeStaff;
  }
}

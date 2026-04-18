import { Role } from '../../common/enums/role.enum';

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: Role;
  password: string;
}

export type StaffSafe = Omit<Staff, 'password'>;

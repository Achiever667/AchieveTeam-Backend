import { Role } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

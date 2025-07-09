import { User_Status } from '../../enums/userEnums';

export interface UserStatus {
  status: User_Status;
  lastActive: Date;
}

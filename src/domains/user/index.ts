// User domain - 利用者管理
export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserError,
  UserSearchCriteria,
  LoanSummary,
  UserWithLoans,
} from './types.js';
export { DEFAULT_LOAN_LIMIT } from './types.js';

export type { UserRepository } from './user-repository.js';

export type { UserService } from './user-service.js';
export { createUserService } from './user-service.js';

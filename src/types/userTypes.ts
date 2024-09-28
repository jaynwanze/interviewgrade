export type UserRoles = {
  ANON: 'anon';
  ADMIN: 'admin';
  USER: 'user';
};

export type UserRole = UserRoles[keyof UserRoles];

export interface UserTypes {
  CANDIDATE: 'candidate';
  EMPLOYER: 'employer';
}

export type UserType = UserTypes[keyof UserTypes];

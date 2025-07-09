import { faker } from '@faker-js/faker';

export interface User {
  id?: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class UserFactory {
  static createUser(overrides: Partial<User> = {}): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    return {
      username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: `P@ssw0rd${Math.floor(Math.random() * 1000)}`,
      firstName,
      lastName,
      ...overrides
    };
  }

  static createAdminUser(): User {
    return this.createUser({
      username: `admin_${Math.random().toString(36).substring(2, 8)}`,
      email: `admin_${Date.now()}@example.com`,
      password: 'Admin@123',
      firstName: 'Admin',
      lastName: 'User'
    });
  }

  static createRandomUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.createUser());
  }
}

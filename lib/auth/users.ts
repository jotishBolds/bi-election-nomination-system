import { User } from "./types";

export const USERS: User[] = [
  {
    id: "1",
    email: "ro@sikkim.gov",
    phone: "9876543210",
    name: "Karma Wangchuk Lepcha",
    role: "RO",
    password: "ro123",
  },
  {
    id: "2",
    email: "tenzin.bhutia@sikkim.gov",
    phone: "9876543211",
    name: "Tenzin Bhutia",
    role: "CANDIDATE",
    password: "applicant123",
  },
  {
    id: "3",
    email: "ses@sikkim.gov",
    phone: "9876543212",
    name: "Pemba Sherpa",
    role: "SES",
    password: "ses123",
  },
  {
    id: "4",
    email: "admin@sikkim.gov",
    phone: "9876543213",
    name: "Dolma Tamang",
    role: "SUPER_ADMIN",
    password: "admin123",
  },
];

export function findUserByPhone(phone: string): User | undefined {
  return USERS.find((user) => user.phone === phone);
}

export function findUserByEmail(email: string): User | undefined {
  return USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function validateByPhone(phone: string): User | null {
  const user = findUserByPhone(phone);
  if (user) {
    return user;
  }
  return null;
}

export function validateCredentials(
  email: string,
  password: string,
): User | null {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

import { User } from "./types";

export const USERS: User[] = [
  {
    id: "1",
    email: "ro@sikkim.gov",
    name: "Karma Wangchuk Lepcha",
    role: "RO",
    password: "ro123",
  },
  {
    id: "2",
    email: "tenzin.bhutia@sikkim.gov",
    name: "Tenzin Bhutia",
    role: "CANDIDATE",
    password: "applicant123",
  },
  {
    id: "3",
    email: "ses@sikkim.gov",
    name: "Pemba Sherpa",
    role: "SES",
    password: "ses123",
  },
  {
    id: "4",
    email: "admin@sikkim.gov",
    name: "Dolma Tamang",
    role: "SUPER_ADMIN",
    password: "admin123",
  },
];

export function findUserByEmail(email: string): User | undefined {
  return USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());
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

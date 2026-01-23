import { User } from "./types";

export const USERS: User[] = [
  {
    id: "1",
    email: "ro@election.gov",
    name: "John Smith",
    role: "RO",
    password: "ro123",
  },
  {
    id: "2",
    email: "candidate@election.gov",
    name: "Sarah Johnson",
    role: "CANDIDATE",
    password: "candidate123",
  },
  {
    id: "3",
    email: "ses@election.gov",
    name: "Michael Davis",
    role: "SES",
    password: "ses123",
  },
  {
    id: "4",
    email: "admin@election.gov",
    name: "Admin User",
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

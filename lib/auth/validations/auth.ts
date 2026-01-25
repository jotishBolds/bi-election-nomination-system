import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(4, "Password must be at least 4 characters"),
});

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^[0-9]+$/, "Please enter a valid phone number"),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^[0-9]+$/, "OTP must contain only numbers"),
});

export const registrationSchema = z
  .object({
    epicNo: z
      .string()
      .min(1, "EPIC Number is required")
      .min(10, "EPIC Number must be at least 10 characters"),
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    phone: z
      .string()
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits")
      .regex(/^[0-9]+$/, "Please enter a valid phone number"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;

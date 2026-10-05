import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(255);

/** At least 8 characters; long passphrases are welcome. */
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(80, "Use at most 80 characters")
    .regex(/^[^<>]*$/, "Names cannot contain < or >"),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password: newPassword });

export const profileSchema = z.object({
  displayName: signUpSchema.shape.displayName,
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  bio: z.string().trim().max(1000, "Use at most 1000 characters").optional().or(z.literal("")),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

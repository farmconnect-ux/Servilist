import { describe, expect, it } from "vitest";
import { fieldErrorsFrom } from "@/server/services/result";
import { profileSchema, signInSchema, signUpSchema } from "./auth";

describe("sign up", () => {
  it("accepts a valid registration and normalises the email", () => {
    const result = signUpSchema.parse({
      displayName: "  Amara Obi ",
      email: " Amara@Example.COM ",
      password: "correct horse battery",
    });
    expect(result).toEqual({
      displayName: "Amara Obi",
      email: "amara@example.com",
      password: "correct horse battery",
    });
  });

  it("rejects short passwords, bad emails and markup in names", () => {
    const result = signUpSchema.safeParse({
      displayName: "<script>",
      email: "not-an-email",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(fieldErrorsFrom(result.error)).sort()).toEqual([
        "displayName",
        "email",
        "password",
      ]);
    }
  });

  it("rejects missing fields instead of throwing", () => {
    expect(signUpSchema.safeParse({ email: null }).success).toBe(false);
  });
});

describe("sign in", () => {
  it("requires both fields", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("profile", () => {
  it("allows optional fields to be empty and limits the bio", () => {
    expect(
      profileSchema.safeParse({ displayName: "Amara", city: "", country: "", bio: "" }).success,
    ).toBe(true);
    expect(profileSchema.safeParse({ displayName: "Amara", bio: "x".repeat(1001) }).success).toBe(
      false,
    );
  });
});

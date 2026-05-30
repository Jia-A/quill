import zod from "zod";
export const signupSchema = zod.object({
  email: zod.email(),
  password: zod
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  name: zod.string().min(1, "Name is required"),
});

export const signinSchema = zod.object({
  email: zod.email(),
  password: zod.string().min(1, "Password is required"),
});

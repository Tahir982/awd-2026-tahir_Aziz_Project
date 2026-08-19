import { z } from "zod";

// Every Server Action re-validates input with these schemas, even though the
// client also validates — client-side checks are for UX only and can always
// be bypassed, so the server is the real gate.

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const skillSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  category: z.enum([
    "Programming",
    "Design",
    "Languages",
    "Music",
    "Academics",
    "Sports & Fitness",
    "Other",
  ]),
  tags: z
    .string()
    .trim()
    .max(200)
    .transform((s) =>
      s
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    ),
});

export const slotSchema = z
  .object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((d) => new Date(d.startTime) > new Date(), {
    message: "Start time must be in the future",
    path: ["startTime"],
  });

export const bookingSchema = z.object({
  slotId: z.string().uuid(),
  skillId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const reportSchema = z.object({
  skillId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
});

export const messageSchema = z.object({
  bookingId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

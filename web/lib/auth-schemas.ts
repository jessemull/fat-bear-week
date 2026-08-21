import { z } from "zod";

export const MAX_BULK_INVITES = 100;

export const joinBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
    token: z.string().min(20).max(200),
    turnstileToken: z.string().trim().min(1).max(2048),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["passwordConfirm"],
      });
    }
  });

export const signInBodySchema = z
  .object({
    identifier: z.string().trim().min(1).max(254),
    password: z.string().min(8).max(128),
    turnstileToken: z.string().trim().min(1).max(2048),
  })
  .strict();

export const forgotPasswordBodySchema = z
  .object({
    email: z.string().trim().email().max(254),
    turnstileToken: z.string().trim().min(1).max(2048),
  })
  .strict();

export const resetPasswordBodySchema = z
  .object({
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
    token: z.string().min(20).max(200),
    turnstileToken: z.string().trim().min(1).max(2048),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["passwordConfirm"],
      });
    }
  });

export const updateAccountNameBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
  })
  .strict();

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["passwordConfirm"],
      });
    }
  });

export const createPoolBodySchema = z
  .object({
    bracketDeadline: z.string().datetime().nullable().optional(),
    maxPlayers: z.number().int().positive().max(500).default(100),
    name: z.string().trim().min(1).max(120),
    scoringSystem: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .default("standard_1_2_4_8"),
    showBracketsBeforeLock: z.boolean().default(false),
    tournamentId: z.string().uuid(),
  })
  .strict();

export const updatePoolBodySchema = z
  .object({
    bracketDeadline: z.string().datetime().nullable().optional(),
    maxPlayers: z.number().int().positive().max(500),
    name: z.string().trim().min(1).max(120),
    scoringSystem: z.string().trim().min(1).max(64).optional(),
    showBracketsBeforeLock: z.boolean().optional(),
    tournamentId: z.string().uuid(),
  })
  .strict();

export const mintInviteBodySchema = z
  .object({
    email: z.string().trim().email().max(254),
    expiresAt: z.string().datetime().optional(),
    nameHint: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

export const mintInvitesBodySchema = z
  .object({
    invites: z
      .array(
        z
          .object({
            email: z.string().trim().email().max(254),
            nameHint: z.string().trim().max(80).nullable().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_BULK_INVITES),
  })
  .strict();

export const updateInviteBodySchema = z
  .object({
    email: z.string().trim().email().max(254),
    nameHint: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type CreatePoolBody = z.infer<typeof createPoolBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type JoinBody = z.infer<typeof joinBodySchema>;
export type MintInviteBody = z.infer<typeof mintInviteBodySchema>;
export type MintInvitesBody = z.infer<typeof mintInvitesBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type SignInBody = z.infer<typeof signInBodySchema>;
export type UpdateAccountNameBody = z.infer<typeof updateAccountNameBodySchema>;
export type UpdateInviteBody = z.infer<typeof updateInviteBodySchema>;
export type UpdatePoolBody = z.infer<typeof updatePoolBodySchema>;

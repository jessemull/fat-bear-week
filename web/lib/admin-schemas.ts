import { z } from "zod";

const bearSexSchema = z.enum(["female", "male", "unknown"]);

const tournamentStatusSchema = z.enum([
  "complete",
  "draft",
  "live",
  "locked",
]);

export const createTournamentBodySchema = z
  .object({
    endsAt: z.string().datetime().nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    year: z.number().int().min(2000).max(2100),
  })
  .strict();

export const updateTournamentMetaBodySchema = z
  .object({
    endsAt: z.string().datetime().nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .strict();

export const transitionTournamentStatusBodySchema = z
  .object({
    status: tournamentStatusSchema,
  })
  .strict();

export const createBearBodySchema = z
  .object({
    age: z.number().int().min(0).max(100).nullable().optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    imageUrl: z.string().trim().url().max(2000).nullable().optional(),
    name: z.string().trim().min(1).max(120),
    nickname: z.string().trim().max(120).nullable().optional(),
    number: z.number().int().min(0).max(9999).nullable().optional(),
    officialId: z.string().trim().max(120).nullable().optional(),
    profileUrl: z.string().trim().url().max(2000).nullable().optional(),
    sex: bearSexSchema.nullable().optional(),
  })
  .strict();

export const updateBearBodySchema = z
  .object({
    age: z.number().int().min(0).max(100).nullable().optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    imageUrl: z.string().trim().url().max(2000).nullable().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    nickname: z.string().trim().max(120).nullable().optional(),
    number: z.number().int().min(0).max(9999).nullable().optional(),
    officialId: z.string().trim().max(120).nullable().optional(),
    profileUrl: z.string().trim().url().max(2000).nullable().optional(),
    sex: bearSexSchema.nullable().optional(),
  })
  .strict();

export const seedBracketBodySchema = z
  .object({
    bearIdsInOrder: z.array(z.string().uuid()).min(2).max(128),
  })
  .strict();

export const setMatchupWinnerBodySchema = z
  .object({
    officialVotesA: z.number().int().min(0).nullable().optional(),
    officialVotesB: z.number().int().min(0).nullable().optional(),
    winnerId: z.string().uuid(),
  })
  .strict();

export type CreateBearBody = z.infer<typeof createBearBodySchema>;
export type CreateTournamentBody = z.infer<typeof createTournamentBodySchema>;
export type SeedBracketBody = z.infer<typeof seedBracketBodySchema>;
export type SetMatchupWinnerBody = z.infer<typeof setMatchupWinnerBodySchema>;
export type TransitionTournamentStatusBody = z.infer<
  typeof transitionTournamentStatusBodySchema
>;
export type UpdateBearBody = z.infer<typeof updateBearBodySchema>;
export type UpdateTournamentMetaBody = z.infer<
  typeof updateTournamentMetaBodySchema
>;

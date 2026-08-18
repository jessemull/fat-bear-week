export type BearSex = "female" | "male" | "unknown";

export type TournamentStatus = "complete" | "draft" | "live" | "locked";

export interface TournamentRecord {
  endsAt: null | string;
  id: string;
  startsAt: null | string;
  status: TournamentStatus;
  year: number;
}

/** Display label for a tournament lifecycle status (e.g. live → Live). */
export function formatTournamentStatus(status: string): string {
  if (!status) {
    return status;
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

"use client";

import {
  PoolForm,
  type PoolFormTournamentOption,
} from "@/components/pools/PoolForm";

interface CreatePoolFormProps {
  tournaments: PoolFormTournamentOption[];
}

export function CreatePoolForm({ tournaments }: CreatePoolFormProps) {
  return <PoolForm mode="create" tournaments={tournaments} />;
}

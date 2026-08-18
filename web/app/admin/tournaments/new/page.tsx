import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";

export const dynamic = "force-dynamic";

export default function NewTournamentPage() {
  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Years must be unique. The tournament starts in draft status."
        title="Create Tournament"
      />
      <CreateTournamentForm />
    </div>
  );
}

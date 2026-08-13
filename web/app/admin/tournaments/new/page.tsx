import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

export const dynamic = "force-dynamic";

export default function NewTournamentPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Create Tournament
        </h1>
        <p className={formMutedClassName}>
          Years must be unique. The tournament starts in draft status.
        </p>
      </header>
      <CreateTournamentForm />
    </div>
  );
}

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreatePoolForm } from "@/components/pools/CreatePoolForm";

export const dynamic = "force-dynamic";

export default function AdminNewPoolPage() {
  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Tie the pool to a tournament year. Invite friends after it is created."
        title="Create Pool"
      />
      <CreatePoolForm />
    </div>
  );
}

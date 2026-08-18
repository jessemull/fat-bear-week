import { PawPrint } from "lucide-react";

import { PageStatus } from "@/components/PageStatus";

export default function NotFound() {
  return (
    <PageStatus
      description="This page does not exist. Hibernating elsewhere."
      icon={PawPrint}
      iconTone="amber"
      title="Empty Den"
    />
  );
}

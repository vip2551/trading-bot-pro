import { PlansManager } from "@/components/plans-manager";

export const dynamic = "force-dynamic";

export default function AdminPlansPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PlansManager />
    </div>
  );
}

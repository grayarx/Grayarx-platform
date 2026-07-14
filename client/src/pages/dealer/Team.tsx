import DealerShell from "@/components/DealerShell";
import { TeamMembersUI } from "@/pages/TeamMembersUI";

export default function DealerTeam() {
  return (
    <DealerShell title="Team" subtitle="Invite consultants and owners to this dealership">
      <div className="max-w-3xl">
        <TeamMembersUI />
      </div>
    </DealerShell>
  );
}

import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { getTeamOverview } from "@/actions/teamActions";
import TeamCard from "./TeamCard";
import NewTeamButton from "./NewTeamButton";

// Sharing changes the moment someone hits Share, and the page is per-user, so
// there's nothing worth caching here.
export const dynamic = "force-dynamic";

const TeamsPage = async () => {
  const session = await auth();

  if (!session?.backendToken) {
    redirect("/auth/signin");
  }

  let teams;
  try {
    teams = await getTeamOverview(session.backendToken);
  } catch {
    return (
      <main className="mx-auto max-w-content px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <p className="mt-6 rounded-md border border-border p-8 text-center text-sm text-muted">
          {`Couldn't load your teams right now. Please try again shortly.`}
        </p>
      </main>
    );
  }

  const sharedCount = teams.reduce(
    (sum, team) => sum + team.sharedByYou.length + team.sharedWithYou.length,
    0
  );

  return (
    <main className="mx-auto max-w-content px-4 py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted">
            Posts you&rsquo;ve shared, and posts shared with you.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {teams.length > 0 && (
            <p className="text-sm text-muted">
              {teams.length} {teams.length === 1 ? "team" : "teams"} ·{" "}
              <span className="font-medium text-fg">{sharedCount} shared</span>
            </p>
          )}
          <NewTeamButton />
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-6 w-6 text-muted" />
          <p className="mt-3 font-medium">You&rsquo;re not in any teams yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Create one here, or open a draft in the editor and hit Share in teams.
          </p>
          <NewTeamButton className="mt-5" />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </ul>
      )}
    </main>
  );
};

export default TeamsPage;

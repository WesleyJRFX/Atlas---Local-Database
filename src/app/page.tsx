import { cookies } from "next/headers";
import { LocalDbPanel, normalizeSavedView } from "@/components/localdb-panel";
import { listDatabases } from "@/lib/localdb";

export const dynamic = "force-dynamic";

function parseSavedView(rawView?: string) {
  if (!rawView) return undefined;
  try {
    return normalizeSavedView(JSON.parse(rawView));
  } catch {
    try {
      return normalizeSavedView(JSON.parse(decodeURIComponent(rawView)));
    } catch {
      return undefined;
    }
  }
}

export default async function Home() {
  const databases = await listDatabases();
  const cookieStore = await cookies();
  const initialView = parseSavedView(cookieStore.get("localdb-panel-view")?.value);

  return <LocalDbPanel initialDatabases={databases} initialView={initialView} />;
}

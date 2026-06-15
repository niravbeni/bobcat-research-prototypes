import { NextResponse } from "next/server";
import { DEFAULT_TEXTS, type PriorityText } from "@/lib/priorities";
import { hasDatabase, loadTexts, resetTexts, saveTexts } from "@/lib/store";

export const dynamic = "force-dynamic";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "bobcat2026";

function clamp(value: unknown, max: number, fallback: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return fallback;
  return s.slice(0, max);
}

// Always return all known priorities in their canonical order, applying any
// stored overrides on top of the defaults.
function normalise(incoming: PriorityText[] | undefined): PriorityText[] {
  const byId = new Map((incoming ?? []).map((t) => [t.id, t]));
  return DEFAULT_TEXTS.map((d) => {
    const t = byId.get(d.id);
    return {
      id: d.id,
      title: clamp(t?.title, 120, d.title),
      short: clamp(t?.short, 40, d.short),
      question: clamp(t?.question, 240, d.question),
    };
  });
}

export async function GET() {
  const priorities = await loadTexts();
  return NextResponse.json({
    priorities: normalise(priorities),
    backend: hasDatabase() ? "database" : "local-file",
  });
}

export async function POST(request: Request) {
  let body: {
    password?: string;
    action?: string;
    priorities?: PriorityText[];
  } | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || body.password !== PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 },
    );
  }

  // Password-only check used by the admin login screen.
  if (body.action === "verify") {
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset") {
    await resetTexts();
    return NextResponse.json({ priorities: DEFAULT_TEXTS });
  }

  const priorities = normalise(body.priorities);
  try {
    await saveTexts(priorities);
  } catch {
    return NextResponse.json(
      {
          error:
            "Could not save. On the deployed site you need a REDIS_URL environment variable pointing at a Redis database.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ priorities });
}

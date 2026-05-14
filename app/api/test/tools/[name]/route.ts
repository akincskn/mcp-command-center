import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getTool } from '@/lib/tools/registry';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;
  const toolName = name.replace(/_/g, '.'); // allow github_list_issues as well
  const tool = getTool(name) ?? getTool(toolName);

  if (!tool) {
    return NextResponse.json({ error: `Tool '${name}' not found` }, { status: 404 });
  }

  const input = (await req.json()) as Record<string, unknown>;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { githubToken: true },
  });

  try {
    const result = await tool.execute(input, {
      userId: session.user.id,
      githubToken: user?.githubToken ?? undefined,
    });

    return NextResponse.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

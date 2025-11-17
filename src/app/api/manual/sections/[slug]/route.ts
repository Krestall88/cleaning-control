import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type ManualSectionRecord = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  order: number;
  content: string;
};

export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;

  try {
    const manualSectionDelegate = (prisma as any).manualSection;

    if (manualSectionDelegate?.findUnique) {
      const section = await manualSectionDelegate.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          title: true,
          icon: true,
          order: true,
          content: true,
        },
      });

      if (!section) {
        return NextResponse.json(
          { error: 'Manual section not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(section);
    }

    const rows = await prisma.$queryRaw<ManualSectionRecord[]>`
      SELECT id, slug, title, icon, "order", content
      FROM manual_sections
      WHERE slug = ${slug}
      LIMIT 1
    `;

    const section = rows[0];

    if (!section) {
      return NextResponse.json(
        { error: 'Manual section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error fetching manual section by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manual section' },
      { status: 500 }
    );
  }
}

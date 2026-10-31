import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getStarterTemplateById, STARTER_TEMPLATES } from "@/server/templates/template-definitions";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const template = getStarterTemplateById(id);

    if (!template) {
      return NextResponse.json(
        {
          error: `Template not found: '${id}'`,
          availableTemplates: STARTER_TEMPLATES.map((t) => t.id),
        },
        { status: 404 }
      );
    }

    const zip = new JSZip();
    const folder = zip.folder(`${template.id}-starter`);

    const targetZip = folder || zip;

    for (const [filepath, content] of Object.entries(template.files)) {
      targetZip.file(filepath, content);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `${template.id}-starter.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Template-Id": template.id,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error generating zip archive";
    return NextResponse.json(
      { error: "Failed to generate template archive", details: message },
      { status: 500 }
    );
  }
}

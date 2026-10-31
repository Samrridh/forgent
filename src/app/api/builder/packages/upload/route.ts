import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PackageUploadSchema = z.object({
  manifest: z.object({
    name: z.string().min(3),
    slug: z.string().min(2),
    version: z.string().default("1.0.0"),
    category: z.string(),
    description: z.string().optional(),
    pricing: z.object({
      pricePerTaskUsd: z.number().min(0.50).max(50.00),
      currency: z.string().default("USD"),
    }),
    runtime: z.string().default("node22"),
    inputSchema: z.record(z.string(), z.unknown()),
    outputSchema: z.record(z.string(), z.unknown()),
  }),
  files: z.record(z.string(), z.string()).refine((f) => Object.keys(f).length > 0, {
    message: "Package must contain at least one file",
  }),
  sha256Checksum: z.string().regex(/^sha256:[a-f0-9]{64}$/, "Must be valid sha256: digest"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PackageUploadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PACKAGE_PAYLOAD",
          issues: parseResult.error.format(),
          message: "Package upload payload failed schema validation.",
        },
        { status: 400 }
      );
    }

    const { manifest, files, sha256Checksum } = parseResult.data;

    // Verify SHA-256 integrity against files payload
    const sortedFileKeys = Object.keys(files).sort();
    const canonicalFilesPayload = sortedFileKeys.map((k) => `${k}:${files[k]}`).join("\n");
    const computedDigest = `sha256:${crypto.createHash("sha256").update(canonicalFilesPayload).digest("hex")}`;

    if (computedDigest !== sha256Checksum) {
      return NextResponse.json(
        {
          success: false,
          error: "CHECKSUM_MISMATCH",
          expected: sha256Checksum,
          computed: computedDigest,
          message: "Uploaded package files SHA-256 digest did not match declared manifest checksum.",
        },
        { status: 422 }
      );
    }

    const packageId = `pkg_${crypto.randomBytes(8).toString("hex")}`;

    return NextResponse.json(
      {
        success: true,
        packageId,
        agentSlug: manifest.slug,
        version: manifest.version,
        sha256: sha256Checksum,
        filesCount: sortedFileKeys.length,
        message: `Agent package "${manifest.name}" (${manifest.version}) uploaded and verified.`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: "PACKAGE_UPLOAD_FAILED",
        message,
      },
      { status: 500 }
    );
  }
}

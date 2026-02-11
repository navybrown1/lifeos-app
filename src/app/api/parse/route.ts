import { NextRequest, NextResponse } from "next/server";
import { parseSectionsFromText, processExtractedData } from "@/lib/extraction";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pathParam = formData.get("path") as string | null;

    let rawText = "";

    if (file) {
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = (file.name || "").toLowerCase().split(".").pop();

      if (ext === "docx") {
        const result = await mammoth.extractRawText({ buffer: buf });
        rawText = result.value;
      } else if (ext === "pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buf);
        rawText = data.text;
      } else if (ext === "txt" || ext === "md") {
        rawText = buf.toString("utf-8");
      } else {
        return NextResponse.json({ error: "Unsupported format. Use DOCX, PDF, or TXT." }, { status: 400 });
      }
    } else if (pathParam) {
      const safePath = path.resolve(process.cwd(), "documents", pathParam);
      if (!safePath.startsWith(path.resolve(process.cwd(), "documents"))) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }
      if (!fs.existsSync(safePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      const ext = safePath.split(".").pop()?.toLowerCase();
      if (ext === "docx") {
        const buf = fs.readFileSync(safePath);
        const result = await mammoth.extractRawText({ buffer: buf });
        rawText = result.value;
      } else if (ext === "pdf") {
        const buf = fs.readFileSync(safePath);
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buf);
        rawText = data.text;
      } else if (ext === "txt" || ext === "md") {
        rawText = fs.readFileSync(safePath, "utf-8");
      } else {
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "No file or path provided" }, { status: 400 });
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "Document is empty or could not be parsed" }, { status: 400 });
    }

    const sections = parseSectionsFromText(rawText);
    const data = processExtractedData(sections);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}

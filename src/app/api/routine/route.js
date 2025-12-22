import { NextResponse } from "next/server";
import dbConnect, { hasMongoUri } from "../../../lib/mongodb";
import Routine from "../../../models/Routine";
import { uploadImage } from "../../../lib/cloudinary";

// GET all routines
export async function GET() {
  try {
    if (!hasMongoUri) {
      return NextResponse.json({ error: "MONGODB_URI is missing. Add it to .env.local and restart the dev server." }, { status: 500 });
    }
    await dbConnect();
    const routines = await Routine.find().sort({ pinned: -1, date: 1, startTime: 1, createdAt: 1 });
    return NextResponse.json(routines);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}

// CREATE routine
export async function POST(req) {
  try {
    if (!hasMongoUri) {
      return NextResponse.json({ error: "MONGODB_URI is missing. Add it to .env.local and restart the dev server." }, { status: 500 });
    }
    await dbConnect();
    const { fields, imageFile } = await extractRoutinePayload(req, { includePinnedDefault: true });

    if (!fields.name || !fields.startTime || !fields.date || !fields.endTime) {
      return NextResponse.json(
        { error: "Name, date, start time, and end time are required." },
        { status: 400 }
      );
    }

    let imageData = {};
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadImage(buffer, { folder: "routine_diary" });
      if (uploaded?.secure_url) {
        imageData = {
          imageUrl: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }
    }

    const routine = await Routine.create({
      name: fields.name,
      date: fields.date,
      startTime: fields.startTime,
      endTime: fields.endTime,
      links: fields.links,
      description: fields.description,
      updated: fields.updated,
      pinned: typeof fields.pinned === "boolean" ? fields.pinned : false,
      ...imageData,
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return fallback;
}

function normalizeLinks(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeString(entry)).filter(Boolean);
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => sanitizeString(entry)).filter(Boolean);
      }
    } catch (_) {
      return [sanitizeString(value)].filter(Boolean);
    }
  }
  return [];
}

function normalizeRoutineFields(raw = {}, { includePinnedDefault = true } = {}) {
  const normalized = {
    name: sanitizeString(raw.name),
    date: sanitizeString(raw.date),
    startTime: sanitizeString(raw.startTime),
    endTime: sanitizeString(raw.endTime),
    links: normalizeLinks(raw.links),
    description: sanitizeString(raw.description),
    updated: sanitizeString(raw.updated),
    removeImage: parseBoolean(raw.removeImage, false),
  };

  if (Object.prototype.hasOwnProperty.call(raw, "pinned")) {
    normalized.pinned = parseBoolean(raw.pinned, false);
  } else if (includePinnedDefault) {
    normalized.pinned = false;
  }

  return normalized;
}

async function extractRoutinePayload(req, options = {}) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const raw = Object.fromEntries(formData.entries());
    const imageFile = formData.get("image");
    return {
      fields: normalizeRoutineFields(raw, options),
      imageFile: imageFile && typeof imageFile === "object" && imageFile.size ? imageFile : null,
    };
  }

  const body = await req.json().catch(() => ({}));
  return {
    fields: normalizeRoutineFields(body || {}, options),
    imageFile: null,
  };
}

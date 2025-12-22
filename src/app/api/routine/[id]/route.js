import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Routine from "../../../../models/Routine";
import { uploadImage, deleteImage } from "../../../../lib/cloudinary";

// UPDATE
export async function PUT(req, context) {
  try {
    await dbConnect();
    const { fields, imageFile } = await extractRoutinePayload(req, { includePinnedDefault: false });
    let id = context?.params?.id;
    if (!id) {
      const urlParts = req.url.split("/");
      id = urlParts[urlParts.length - 1];
    }

    if (!fields.name || !fields.date || !fields.startTime || !fields.endTime) {
      return NextResponse.json(
        { error: "Name, date, start time, and end time are required." },
        { status: 400 }
      );
    }

    const existing = await Routine.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    const updateData = {
      name: fields.name,
      date: fields.date,
      startTime: fields.startTime,
      endTime: fields.endTime,
      links: fields.links,
      description: fields.description,
      updated: fields.updated,
    };

    if (typeof fields.pinned === "boolean") {
      updateData.pinned = fields.pinned;
    }

    if (imageFile) {
      if (existing.imagePublicId) {
        await deleteImage(existing.imagePublicId);
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadImage(buffer, { folder: "routine_diary" });
      if (uploaded?.secure_url) {
        updateData.imageUrl = uploaded.secure_url;
        updateData.imagePublicId = uploaded.public_id;
      }
    } else if (fields.removeImage && existing.imagePublicId) {
      await deleteImage(existing.imagePublicId);
      updateData.imageUrl = "";
      updateData.imagePublicId = "";
    }

    const updated = await Routine.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// PATCH (partial updates e.g., pin/unpin)
export async function PATCH(req, context) {
  try {
    await dbConnect();
    const body = await req.json();
    let id = context?.params?.id;
    if (!id) {
      const urlParts = req.url.split("/");
      id = urlParts[urlParts.length - 1];
    }

    if (typeof body.pinned !== "boolean") {
      return NextResponse.json({ error: "Pinned state required" }, { status: 400 });
    }

    const updated = await Routine.findByIdAndUpdate(
      id,
      { pinned: body.pinned },
      { new: true }
    );
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Patch failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req, context) {
  try {
    await dbConnect();
    let id = context?.params?.id;
    if (!id) {
      // fallback: extract from URL
      const urlParts = req.url.split("/");
      id = urlParts[urlParts.length - 1];
    }
    const removed = await Routine.findByIdAndDelete(id);
    if (removed?.imagePublicId) {
      await deleteImage(removed.imagePublicId);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
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

import dbConnect from "../../../lib/mongodb";
import Todo from "../../../models/Todo";
import { NextResponse } from "next/server";
import { uploadImage, deleteImage } from "../../../lib/cloudinary";

const TODO_IMAGE_FOLDER = "todo_items";

export async function GET() {
  try {
    await dbConnect();
    const todos = await Todo.find({}).sort({ createdAt: -1 });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { fields, imageFile } = await extractTodoPayload(request);
    if (!fields.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    let imageData = {};
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadImage(buffer, { folder: TODO_IMAGE_FOLDER });
      if (uploaded?.secure_url) {
        imageData = {
          imageUrl: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }
    }

    const todo = await Todo.create({
      text: fields.text,
      completed: typeof fields.completed === "boolean" ? fields.completed : false,
      ...imageData,
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const { fields, imageFile } = await extractTodoPayload(request);
      if (!fields.id) {
        return NextResponse.json({ error: "Todo id is required" }, { status: 400 });
      }

      const existing = await Todo.findById(fields.id);
      if (!existing) {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
      }

      const updateData = {};
      if (fields.text) updateData.text = fields.text;
      if (typeof fields.completed === "boolean") {
        updateData.completed = fields.completed;
      }

      if (imageFile) {
        if (existing.imagePublicId) {
          await deleteImage(existing.imagePublicId);
        }
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploaded = await uploadImage(buffer, { folder: TODO_IMAGE_FOLDER });
        if (uploaded?.secure_url) {
          updateData.imageUrl = uploaded.secure_url;
          updateData.imagePublicId = uploaded.public_id;
        }
      } else if (fields.removeImage && existing.imagePublicId) {
        await deleteImage(existing.imagePublicId);
        updateData.imageUrl = "";
        updateData.imagePublicId = "";
      }

      const todo = await Todo.findByIdAndUpdate(fields.id, updateData, { new: true });
      return NextResponse.json(todo);
    }

    const { id, completed } = await request.json();
    const todo = await Todo.findByIdAndUpdate(id, { completed }, { new: true });
    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { id } = await request.json();
    const todo = await Todo.findByIdAndDelete(id);
    if (todo?.imagePublicId) {
      await deleteImage(todo.imagePublicId);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value, fallback = undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return fallback;
}

function normalizeTodoFields(raw = {}) {
  return {
    id: sanitizeString(raw.id),
    text: sanitizeString(raw.text),
    completed: parseBoolean(raw.completed),
    removeImage: parseBoolean(raw.removeImage, false) || false,
  };
}

async function extractTodoPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const raw = Object.fromEntries(formData.entries());
    const imageFile = formData.get("image");
    return {
      fields: normalizeTodoFields(raw),
      imageFile: imageFile && typeof imageFile === "object" && imageFile.size ? imageFile : null,
    };
  }

  const body = await request.json().catch(() => ({}));
  return {
    fields: normalizeTodoFields(body || {}),
    imageFile: null,
  };
}

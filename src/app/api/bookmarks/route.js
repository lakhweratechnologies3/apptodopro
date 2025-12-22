import dbConnect from "../../../lib/mongodb";
import Bookmark from "../../../models/Bookmark";
import { NextResponse } from "next/server";

// Helper: build a favicon URL using Google's s2 service
function buildFaviconFor(url) {
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
  } catch (e) {
    return "";
  }
}

async function fetchPageTitle(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    const m = text.match(/<title>([^<]*)<\/title>/i);
    if (m && m[1]) return m[1].trim();
  } catch (e) {
    // ignore
  }
  return "";
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { url: { $regex: query, $options: "i" } },
        ],
      };
    }
    
    let items = await Bookmark.find(filter).sort({ pinned: -1, createdAt: -1 });
    // Ensure pinned field exists on all items
    items = items.map(item => ({
      ...item.toObject(),
      pinned: item.pinned || false
    }));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const url = (body.url || "").trim();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let title = (body.title || "").trim();
    if (!title) {
      title = await fetchPageTitle(url);
    }

    const faviconUrl = buildFaviconFor(url);

    const created = await Bookmark.create({ url, title, faviconUrl });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const { id, pinned } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await Bookmark.findByIdAndUpdate(
      id, 
      { pinned: pinned }, 
      { new: true, runValidators: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    // Return plain object with pinned field explicitly included
    const result = {
      ...updated.toObject(),
      pinned: updated.pinned !== undefined ? updated.pinned : false
    };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await Bookmark.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

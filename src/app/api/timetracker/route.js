import dbConnect from "../../../lib/mongodb";
import TimeTracker from "../../../models/TimeTracker";
import { NextResponse } from "next/server";

// GET all time tracker sessions
export async function GET() {
  try {
    await dbConnect();
    const sessions = await TimeTracker.find({}).sort({ createdAt: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Start new session
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { projectName, notes } = body;
    
    if (!projectName?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const session = await TimeTracker.create({
      projectName: projectName.trim(),
      notes: notes?.trim() || "",
      startTime: new Date(),
      isRunning: true,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Stop session or update
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, endTime, duration, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const updateData = {};
    if (endTime) updateData.endTime = new Date(endTime);
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;
    updateData.isRunning = false;

    const session = await TimeTracker.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE session
export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    await TimeTracker.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

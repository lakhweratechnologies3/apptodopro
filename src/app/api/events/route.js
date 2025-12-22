import dbConnect from "../../../lib/mongodb";
import Event from "../../../models/Event";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const events = await Event.find({}).sort({ date: 1 });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { title, date, description } = await request.json();
    if (!title || !date) return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    const event = await Event.create({ title, date, description });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const { id, title, date, description } = await request.json();
    const event = await Event.findByIdAndUpdate(id, { title, date, description }, { new: true });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { id } = await request.json();
    await Event.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
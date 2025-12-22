import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find().sort({ updatedAt: -1 });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log('Creating project with data:', body);
    
    // Create the project
    const project = new Project({
      name: body.name,
      description: body.description || '',
      status: body.status || 'active',
      todos: body.todos || []
    });
    
    await project.save();
    console.log('Project created successfully:', project);
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation error', details: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create project', 
      details: error.message,
      name: error.name 
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, ...updateData } = body;
    console.log('Updating project:', id, updateData);
    
    const project = await Project.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('PATCH /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to update project', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Deleting project:', id);
    
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500 });
  }
}

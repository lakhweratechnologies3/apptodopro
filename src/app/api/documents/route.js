import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';

export async function GET() {
  try {
    await dbConnect();
    const documents = await Document.find().sort({ updatedAt: -1 });
    console.log(`📚 GET /api/documents: Retrieved ${documents.length} documents`);
    documents.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.type}): ${doc.diagramData ? doc.diagramData.length : 0} bytes`);
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    console.log('➕ POST /api/documents: Creating new document:', {
      title: body.title,
      type: body.type,
      hasContent: !!body.content,
      hasDiagramData: !!body.diagramData,
      diagramDataSize: body.diagramData ? body.diagramData.length : 0
    });
    
    const document = new Document({
      title: body.title,
      content: body.content || '',
      type: body.type || 'text',
      diagramData: body.diagramData || null
    });
    
    await document.save();
    console.log('✅ Document created:', document._id);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, ...updateData } = body;
    
    console.log('📝 PATCH /api/documents:', {
      id,
      hasContent: !!updateData.content,
      hasDiagramData: !!updateData.diagramData,
      diagramDataSize: updateData.diagramData ? updateData.diagramData.length : 0
    });
    
    const document = await Document.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!document) {
      console.error('❌ Document not found:', id);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    console.log('✅ Document updated in MongoDB:', {
      id: document._id,
      title: document.title,
      hasDiagramData: !!document.diagramData,
      diagramDataSize: document.diagramData ? document.diagramData.length : 0
    });
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('❌ PATCH /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const document = await Document.findByIdAndDelete(id);
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

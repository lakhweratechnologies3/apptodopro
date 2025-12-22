'use client';

import { useState, useEffect, useRef } from 'react';
import { MdAdd, MdDelete, MdDescription, MdDraw, MdArrowBack, MdBrush, MdCheck } from 'react-icons/md';

export default function EditorPage() {
  const canvasRef = useRef(null);
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWidth, setDrawWidth] = useState(2);
  const [tool, setTool] = useState('pen'); // pen, rectangle, circle, line, arrow
  const [startPos, setStartPos] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('text');
  const [content, setContent] = useState('');
  const [diagramData, setDiagramData] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: docType === 'text' ? content : '',
          type: docType,
          diagramData: docType === 'diagram' ? diagramData : null
        })
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setDiagramData(null);
        setShowForm(false);
        fetchDocuments();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    }
  };

  const updateDocument = async (capturedImageData = null) => {
    if (!selectedDoc) {
      console.log('⚠️ No document selected, skipping save');
      return;
    }

    try {
      let finalContent = content;
      
      // Save Editor.js content before updating
      if (selectedDoc.type === 'text' && editorInstance.current) {
        const data = await editorInstance.current.save();
        finalContent = JSON.stringify(data);
      }

      // Use captured data if provided, otherwise use state
      const finalDiagramData = capturedImageData || diagramData;

      console.log('💾 Saving document:', {
        id: selectedDoc._id,
        type: selectedDoc.type,
        title: selectedDoc.title,
        hasContent: !!finalContent,
        hasDiagramData: !!finalDiagramData,
        diagramDataSize: finalDiagramData ? finalDiagramData.length : 0,
        usingCapturedData: !!capturedImageData
      });

      const response = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDoc._id,
          content: finalContent,
          diagramData: finalDiagramData
        })
      });

      if (response.ok) {
        const savedDoc = await response.json();
        console.log('✅ Document saved successfully to MongoDB:', {
          id: savedDoc._id,
          hasDiagramData: !!savedDoc.diagramData,
          diagramDataSize: savedDoc.diagramData ? savedDoc.diagramData.length : 0
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save document:', errorData);
      }
    } catch (error) {
      console.error('❌ Error updating document:', error);
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE'
      });
      fetchDocuments();
      if (selectedDoc?._id === docId) {
        setSelectedDoc(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openDocument = async (doc) => {
    // Save current document before opening new one
    if (selectedDoc) {
      await updateDocument();
    }
    
    // Clear editor instance if switching document types
    if (editorInstance.current && selectedDoc?.type !== doc.type) {
      editorInstance.current.destroy();
      editorInstance.current = null;
    }
    
    console.log('📂 Opening document:', {
      id: doc._id,
      title: doc.title,
      type: doc.type,
      hasContent: !!doc.content,
      hasDiagramData: !!doc.diagramData,
      diagramDataSize: doc.diagramData ? doc.diagramData.length : 0
    });
    
    setSelectedDoc(doc);
    setContent(doc.content || '');
    setDiagramData(doc.diagramData || null);
  };

  // Initialize Editor.js for text documents
  useEffect(() => {
    if (selectedDoc?.type === 'text' && editorRef.current && !editorInstance.current) {
      const initEditor = async () => {
        const EditorJS = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const List = (await import('@editorjs/list')).default;
        const Checklist = (await import('@editorjs/checklist')).default;
        const Quote = (await import('@editorjs/quote')).default;
        const Code = (await import('@editorjs/code')).default;
        const Delimiter = (await import('@editorjs/delimiter')).default;
        const Table = (await import('@editorjs/table')).default;
        const InlineCode = (await import('@editorjs/inline-code')).default;

        editorInstance.current = new EditorJS({
          holder: editorRef.current,
          placeholder: 'Start writing your document...',
          data: content ? JSON.parse(content) : undefined,
          tools: {
            header: {
              class: Header,
              config: {
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
              }
            },
            list: {
              class: List,
              inlineToolbar: true
            },
            checklist: {
              class: Checklist,
              inlineToolbar: true
            },
            quote: {
              class: Quote,
              inlineToolbar: true
            },
            code: Code,
            delimiter: Delimiter,
            table: {
              class: Table,
              inlineToolbar: true
            },
            inlineCode: {
              class: InlineCode
            }
          },
          onChange: async () => {
            const data = await editorInstance.current.save();
            setContent(JSON.stringify(data));
          },
          onReady: () => {
            console.log('Editor.js is ready!');
          }
        });
      };

      initEditor();
    }

    return () => {
      if (editorInstance.current && editorInstance.current.destroy) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [selectedDoc]);

  // Canvas drawing functions
  useEffect(() => {
    if (selectedDoc?.type === 'diagram' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match container
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        const oldData = canvas.toDataURL(); // Save current drawing
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Reload saved drawing after resize
        const imageData = diagramData || oldData;
        if (imageData && imageData !== 'data:,') {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = imageData;
        }
      };
      
      // Initial setup
      resizeCanvas();
      
      // Add resize listener
      window.addEventListener('resize', resizeCanvas);
      
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [selectedDoc]);

  // Load diagram data when opening a document
  useEffect(() => {
    if (selectedDoc?.type === 'diagram' && canvasRef.current && diagramData) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = diagramData;
    }
  }, [diagramData, selectedDoc]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    // Save canvas state for shape drawing
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.fillStyle = drawColor;
    
    if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Restore snapshot for live preview
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
      }
      
      const width = x - startPos.x;
      const height = y - startPos.y;
      
      if (tool === 'rectangle') {
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (tool === 'circle') {
        ctx.beginPath();
        const radius = Math.sqrt(width * width + height * height);
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, x, y);
      }
    }
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = drawColor;
    ctx.fill();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      setStartPos(null);
      setSnapshot(null);
      
      // Save the drawing
      const imageData = canvasRef.current.toDataURL();
      console.log('🎨 Canvas drawing stopped, capturing data:', {
        dataLength: imageData.length,
        preview: imageData.substring(0, 50) + '...'
      });
      setDiagramData(imageData);
      
      // Auto-save after drawing with the captured imageData
      setTimeout(() => {
        console.log('⏰ Auto-saving canvas after 500ms delay');
        updateDocument(imageData);
      }, 500);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      if (!confirm('Are you sure you want to clear the canvas?')) return;
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDiagramData(null);
      updateDocument();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white flex items-center justify-center">
        <div className="text-black text-lg">Loading...</div>
      </div>
    );
  }

  if (selectedDoc) {
    return (
      <div className="fixed inset-0 lg:ml-56 ml-0 bg-white flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                updateDocument();
                setSelectedDoc(null);
              }}
              className="flex items-center gap-2 text-black hover:text-gray-600"
            >
              <MdArrowBack size={20} />
              Back
            </button>
            <h1 className="text-xl font-bold text-black">{selectedDoc.title}</h1>
          </div>
          <button
            onClick={() => deleteDocument(selectedDoc._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <MdDelete size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDoc.type === 'text' ? (
            <div 
              ref={editorRef}
              className="w-full h-full p-8 overflow-y-auto prose prose-lg max-w-none"
              style={{
                '--tw-prose-body': '#000',
                '--tw-prose-headings': '#000',
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="border-b border-gray-200 p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 font-semibold">Tool:</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTool('pen')}
                      className={`px-3 py-2 rounded border-2 transition-colors ${
                        tool === 'pen' ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Pen"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setTool('line')}
                      className={`px-3 py-2 rounded border-2 transition-colors ${
                        tool === 'line' ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Line"
                    >
                      📏
                    </button>
                    <button
                      onClick={() => setTool('arrow')}
                      className={`px-3 py-2 rounded border-2 transition-colors ${
                        tool === 'arrow' ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Arrow"
                    >
                      ➡️
                    </button>
                    <button
                      onClick={() => setTool('rectangle')}
                      className={`px-3 py-2 rounded border-2 transition-colors ${
                        tool === 'rectangle' ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Rectangle"
                    >
                      ▭
                    </button>
                    <button
                      onClick={() => setTool('circle')}
                      className={`px-3 py-2 rounded border-2 transition-colors ${
                        tool === 'circle' ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      title="Circle"
                    >
                      ⭕
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MdBrush size={20} />
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-10 h-10 cursor-pointer border-2 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Width:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 w-8">{drawWidth}px</span>
                </div>
                
                <button
                  onClick={clearCanvas}
                  className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 w-full h-full overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Visual Editor</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            <MdAdd size={20} />
            New Document
          </button>
        </div>

        {showForm && (
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Create New Document</h2>
            <form onSubmit={createDocument} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title *"
                  required
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none focus:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Document Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="text"
                      checked={docType === 'text'}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <MdDescription size={20} />
                    <span>Text Document</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="diagram"
                      checked={docType === 'diagram'}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <MdDraw size={20} />
                    <span>Diagram/Whiteboard</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border-2 border-black text-black rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MdDescription size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No documents yet</p>
            <p className="text-sm">Create a document to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => openDocument(doc)}
                className="bg-white border-2 border-black rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    {doc.type === 'text' ? (
                      <MdDescription size={24} className="text-black" />
                    ) : (
                      <MdDraw size={24} className="text-black" />
                    )}
                    <h3 className="font-semibold text-black truncate">{doc.title}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDocument(doc._id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="capitalize">{doc.type}</p>
                  <p className="text-xs mt-1">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

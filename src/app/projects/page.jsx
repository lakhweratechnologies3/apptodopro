'use client';

import { useState, useEffect } from 'react';
import { MdPlayArrow, MdFolder, MdAccessTime, MdNotes, MdArrowBack, MdAdd, MdDelete, MdCheck, MdEdit } from 'react-icons/md';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchSessions();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/timetracker');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      console.log('Creating project:', { name: projectName, description: projectDescription });
      
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          status: 'active'
        })
      });

      if (res.ok) {
        const newProject = await res.json();
        console.log('✅ Project saved successfully:', newProject);
        setProjectName('');
        setProjectDescription('');
        setShowForm(false);
        fetchProjects();
      } else {
        const data = await res.json();
        console.error('❌ Failed to save project:', data.error);
        alert(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('❌ Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const addTodo = async (projectId) => {
    if (!newTodoText.trim()) return;

    const project = projects.find(p => p._id === projectId);
    const updatedTodos = [...(project.todos || []), { text: newTodoText, completed: false }];

    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, todos: updatedTodos })
      });

      if (res.ok) {
        setNewTodoText('');
        fetchProjects();
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (projectId, todoIndex) => {
    const project = projects.find(p => p._id === projectId);
    const updatedTodos = [...project.todos];
    updatedTodos[todoIndex].completed = !updatedTodos[todoIndex].completed;

    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, todos: updatedTodos })
      });
      fetchProjects();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (projectId, todoIndex) => {
    const project = projects.find(p => p._id === projectId);
    const updatedTodos = project.todos.filter((_, i) => i !== todoIndex);

    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, todos: updatedTodos })
      });
      fetchProjects();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await fetch(`/api/projects?id=${projectId}`, {
        method: 'DELETE'
      });
      fetchProjects();
      setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const completeProject = async (projectId) => {
    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, status: 'completed' })
      });
      fetchProjects();
    } catch (error) {
      console.error('Error completing project:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRunningSession = () => {
    return sessions.find(s => s.isRunning);
  };

  const getProjectTimeTracking = (projectName) => {
    const projectSessions = sessions.filter(s => s.projectName === projectName);
    const totalDuration = projectSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return { sessions: projectSessions.length, totalDuration };
  };

  if (loading) {
    return (
      <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white flex items-center justify-center">
        <div className="text-black text-lg">Loading projects...</div>
      </div>
    );
  }

  if (selectedProject) {
    const project = projects.find(p => p._id === selectedProject);
    const timeTracking = getProjectTimeTracking(project.name);
    
    return (
      <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 mb-6 text-black hover:text-gray-600"
          >
            <MdArrowBack size={20} />
            Back to Projects
          </button>

          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">{project.name}</h1>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-700 border border-green-600' 
                  : 'bg-gray-100 text-gray-700 border border-gray-600'
              }`}>
                {project.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <MdAccessTime size={18} />
                Total: {formatDuration(timeTracking.totalDuration)}
              </span>
              <span>{timeTracking.sessions} session(s)</span>
            </div>

            {project.status === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={() => completeProject(project._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => deleteProject(project._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            )}

            {project.status === 'completed' && (
              <button
                onClick={() => deleteProject(project._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Project
              </button>
            )}
          </div>

          {/* Todo List */}
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Updates & Features</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo(project._id)}
                placeholder="Add completed feature or update..."
                className="flex-1 px-3 py-2 border-2 border-black rounded-md focus:outline-none focus:border-gray-600"
              />
              <button
                onClick={() => addTodo(project._id)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center gap-2"
              >
                <MdAdd size={20} />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {project.todos && project.todos.length > 0 ? (
                project.todos.map((todo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <button
                      onClick={() => toggleTodo(project._id, index)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        todo.completed 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-gray-400'
                      }`}
                    >
                      {todo.completed && <MdCheck size={16} className="text-white" />}
                    </button>
                    <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(project._id, index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No updates added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const runningSession = getRunningSession();

  return (
    <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Projects</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <MdAdd size={20} />
              New Project
            </button>
            <a
              href="/timetracker"
              className="flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-md hover:bg-gray-100"
            >
              <MdPlayArrow size={20} />
              Time Tracker
            </a>
          </div>
        </div>

        {/* Currently Running Project */}
        {runningSession && (
          <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm text-green-700 font-semibold">Currently Running</p>
                  <p className="text-lg font-bold text-black">{runningSession.projectName}</p>
                  {runningSession.notes && (
                    <p className="text-sm text-gray-600">{runningSession.notes}</p>
                  )}
                </div>
              </div>
              <a
                href="/timetracker"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Go to Tracker
              </a>
            </div>
          </div>
        )}

        {/* New Project Form */}
        {showForm && (
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Create New Project</h2>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name *"
                  required
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none focus:border-gray-600"
                />
              </div>
              <div>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Project Description (optional)"
                  rows="3"
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none focus:border-gray-600 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Create Project
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

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MdFolder size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm">Create a project to get started</p>
          </div>
        ) : (
          <div>
            {/* Active Projects */}
            {projects.filter(p => p.status === 'active').length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-black mb-4">Active Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects
                    .filter(p => p.status === 'active')
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map((project) => {
                      const timeTracking = getProjectTimeTracking(project.name);
                      const isRunning = sessions.some(s => s.isRunning && s.projectName === project.name);
                      
                      return (
                        <div
                          key={project._id}
                          onClick={() => setSelectedProject(project._id)}
                          className={`bg-white border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                            isRunning ? 'border-green-600' : 'border-black'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <MdFolder size={24} className={isRunning ? 'text-green-600' : 'text-black'} />
                              <h3 className="font-semibold text-black truncate">{project.name}</h3>
                            </div>
                            {isRunning && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-600 rounded text-xs text-green-700">
                                <MdPlayArrow size={12} />
                                Active
                              </span>
                            )}
                          </div>

                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600">
                              <span className="flex items-center gap-1">
                                <MdAccessTime size={16} />
                                Total Time
                              </span>
                              <span className="font-semibold text-black">
                                {formatDuration(timeTracking.totalDuration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-gray-600">
                              <span>Updates</span>
                              <span className="font-semibold text-black">
                                {project.todos ? project.todos.filter(t => t.completed).length : 0}/{project.todos ? project.todos.length : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Completed Projects */}
            {projects.filter(p => p.status === 'completed').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-black mb-4">Completed Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects
                    .filter(p => p.status === 'completed')
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map((project) => {
                      const timeTracking = getProjectTimeTracking(project.name);
                      
                      return (
                        <div
                          key={project._id}
                          onClick={() => setSelectedProject(project._id)}
                          className="bg-white border-2 border-gray-400 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow opacity-75"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <MdFolder size={24} className="text-gray-600" />
                              <h3 className="font-semibold text-black truncate">{project.name}</h3>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 border border-gray-600 rounded text-xs text-gray-700">
                              Completed
                            </span>
                          </div>

                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600">
                              <span className="flex items-center gap-1">
                                <MdAccessTime size={16} />
                                Total Time
                              </span>
                              <span className="font-semibold text-black">
                                {formatDuration(timeTracking.totalDuration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-gray-600">
                              <span>Updates</span>
                              <span className="font-semibold text-black">
                                {project.todos ? project.todos.length : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

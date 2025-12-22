import Link from "next/link";
import { Calendar, ListTodo, Home, FileText, Bookmark, Clock, Folder, PenTool } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="h-screen w-56 bg-white border-r border-gray-200 flex flex-col py-8 px-4 fixed left-0 top-0 z-20 shadow-sm overflow-y-auto">
      <div className="mb-10 flex items-center gap-2">
        <Home className="text-blue-600" />
        <span className="font-bold text-lg text-blue-700">Hi Huzaifa!</span>
      </div>
      <nav className="flex flex-col gap-4">
        <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Dashboard</Link>
        <Link href="/calendar" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <Calendar size={18} /> Calendar
        </Link>
        <Link href="/todo" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <ListTodo size={18} /> Todo
        </Link>
        <Link href="/routine" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <FileText size={18} /> Daily Routine
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <Bookmark size={18} /> Bookmarks
        </Link>
        <Link href="/timetracker" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <Clock size={18} /> Time Tracker
        </Link>
        <Link href="/projects" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <Folder size={18} /> Projects
        </Link>
        <Link href="/editor" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium">
          <PenTool size={18} /> Visual Editor
        </Link>
      </nav>
    </aside>
  );
}

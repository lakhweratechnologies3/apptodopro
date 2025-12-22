"use client";
import { useEffect, useState } from "react";
import { MdDelete, MdEdit, MdPictureAsPdf, MdBarChart } from "react-icons/md";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function TimeTrackerHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, today, week, month
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timetracker");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    if (!confirm("Delete this session?")) return;
    try {
      await fetch("/api/timetracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalTime = () => {
    return sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  };

  const filterSessions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return sessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      if (filter === "today") return sessionDate >= today;
      if (filter === "week") return sessionDate >= weekAgo;
      if (filter === "month") return sessionDate >= monthAgo;
      return true;
    });
  };

  const filtered = filterSessions();

  // Group sessions by year
  const getYearlyData = () => {
    const yearMap = {};
    sessions.forEach(session => {
      const year = new Date(session.startTime).getFullYear();
      if (!yearMap[year]) {
        yearMap[year] = { year, totalHours: 0, sessions: 0 };
      }
      yearMap[year].totalHours += (session.duration || 0) / 3600;
      yearMap[year].sessions += 1;
    });
    return Object.values(yearMap).sort((a, b) => a.year - b.year);
  };

  // Group sessions by month for current year
  const getMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const monthMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    monthNames.forEach((name, idx) => {
      monthMap[idx] = { month: name, totalHours: 0, sessions: 0 };
    });
    
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        monthMap[monthIdx].totalHours += (session.duration || 0) / 3600;
        monthMap[monthIdx].sessions += 1;
      }
    });
    
    return Object.values(monthMap);
  };

  const formatHours = (hours) => {
    return hours.toFixed(1) + 'h';
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Time Tracker Report', pageWidth / 2, 20, { align: 'center' });
    
    // Report info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const filterText = filter.charAt(0).toUpperCase() + filter.slice(1);
    doc.text(`Filter: ${filterText}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, 45);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Sessions: ${filtered.length}`, 20, 52);
    doc.text(`Total Time: ${formatTime(filtered.reduce((sum, s) => sum + (s.duration || 0), 0))}`, 20, 57);
    
    // Line separator
    doc.setDrawColor(0);
    doc.line(20, 62, pageWidth - 20, 62);
    
    // Sessions details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Sessions', 20, 70);
    
    let yPosition = 78;
    const lineHeight = 6;
    const sectionGap = 12;
    
    filtered.forEach((session, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Session number and project name
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${session.projectName}`, 20, yPosition);
      yPosition += lineHeight;
      
      // Date and time
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const startDate = formatDate(session.startTime);
      const endDate = session.endTime ? formatDate(session.endTime) : 'In Progress';
      doc.text(`Start: ${startDate}`, 25, yPosition);
      yPosition += lineHeight;
      doc.text(`End: ${endDate}`, 25, yPosition);
      yPosition += lineHeight;
      
      // Duration
      doc.setFont(undefined, 'bold');
      doc.text(`Duration: ${formatTime(session.duration)}`, 25, yPosition);
      yPosition += lineHeight;
      
      // Notes
      if (session.notes) {
        doc.setFont(undefined, 'italic');
        const notes = session.notes.length > 80 ? session.notes.substring(0, 80) + '...' : session.notes;
        doc.text(`Notes: ${notes}`, 25, yPosition);
        yPosition += lineHeight;
      }
      
      yPosition += sectionGap;
    });
    
    // Footer on last page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `timetracker-report-${filter}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen ml-56 p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black">Time Tracker History</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <MdBarChart size={20} />
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <MdPictureAsPdf size={20} />
              PDF Report
            </button>
            <a
              href="/timetracker"
              className="px-4 py-2 bg-white text-black border-2 border-black rounded-md hover:bg-gray-100"
            >
              Back to Tracker
            </a>
          </div>
        </div>
        
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
          <div className="text-sm text-gray-700 mb-2">Total Time Tracked</div>
          <div className="text-4xl font-bold text-black font-mono mb-2">
            {formatTime(getTotalTime())}
          </div>
          <div className="text-sm text-gray-600">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </div>
        </div>

        {showCharts && (
          <div className="space-y-6 mb-6">
            {/* Yearly Chart */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Yearly Report</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getYearlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="year" stroke="#000" />
                  <YAxis stroke="#000" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalHours') return [value.toFixed(1) + 'h', 'Total Hours'];
                      return [value, 'Sessions'];
                    }}
                    contentStyle={{ border: '2px solid black', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="totalHours" fill="#000" name="Total Hours" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {getYearlyData().map(yearData => (
                  <div key={yearData.year} className="border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-black">{yearData.year}</div>
                    <div className="text-2xl font-mono text-black">{formatHours(yearData.totalHours)}</div>
                    <div className="text-sm text-gray-600">{yearData.sessions} sessions</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Chart for Current Year */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Monthly Report - {new Date().getFullYear()}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="month" stroke="#000" />
                  <YAxis stroke="#000" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalHours') return [value.toFixed(1) + 'h', 'Total Hours'];
                      return [value, 'Sessions'];
                    }}
                    contentStyle={{ border: '2px solid black', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalHours" stroke="#000" strokeWidth={3} name="Total Hours" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          {["all", "today", "week", "month"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md font-semibold capitalize transition ${
                filter === f
                  ? "bg-black text-white"
                  : "bg-white text-black border-2 border-black hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-600">No sessions found</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((session) => (
              <div
                key={session._id}
                className="bg-white border-2 border-black rounded-lg p-4 flex items-start gap-4"
              >
                <div className="flex-1">
                  <div className="text-lg font-bold text-black mb-2">
                    {session.projectName}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {formatDate(session.startTime)}
                    {session.endTime && ` - ${formatDate(session.endTime)}`}
                  </div>
                  {session.notes && (
                    <div className="text-sm text-gray-600 mb-3 italic">
                      {session.notes}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-black font-mono">
                    {formatTime(session.duration)}
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(session._id)}
                  className="p-2 hover:bg-gray-100 rounded-md transition"
                  title="Delete session"
                >
                  <MdDelete size={24} className="text-black" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

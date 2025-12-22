"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
        console.error("API error:", data.error || data);
      }
    } catch (error) {
      setEvents([]);
      console.error("Error fetching events:", error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getEventsForDate = (dateKey) => {
    return events.filter(event => event.date === dateKey);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(dateKey);
    setShowModal(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, date: selectedDate }),
      });
      setNewEvent({ title: "", description: "" });
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id) => {
    setLoading(true);
    try {
      await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
    setLoading(false);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="p-8 min-h-screen bg-white dark:bg-black transition-colors">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Calendar</h1>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded border border-black dark:border-white hover:text-white hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-100"
          >
            <ChevronLeft className="text-black  dark:text-white" />
          </button>
          <h2 className="text-2xl font-semibold text-black">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded border border-black dark:border-white hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-100"
          >
            <ChevronRight className="text-black dark:text-white" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center font-bold text-black dark:text-white py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dateKey = day ? formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
              const dayEvents = dateKey ? getEventsForDate(dateKey) : [];
              const isToday = dateKey === todayKey;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-24 p-2 border-2 rounded-xl cursor-pointer transition-colors
                    ${day ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 cursor-default opacity-30"}
                    ${isToday ? "border-4 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 shadow-xl" : ""}`}
                >
                  {day ? (
                    <>
                      <div className={`font-bold text-lg mb-1 ${isToday ? "text-black dark:text-white" : "text-black dark:text-white"}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div key={event._id} className="text-xs font-semibold bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded truncate">
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs font-semibold text-black dark:text-white">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-6 w-full max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-black dark:text-white">
                  Events for {selectedDate}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black dark:hover:text-white cursor-pointer">
                  <X />
                </button>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Event Form - Left Side */}
                <div className="p-4 border border-black dark:border-white rounded">
                  <h4 className="font-semibold mb-4 text-black dark:text-white">Add New Event</h4>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full px-3 py-2 mb-2 border border-black dark:border-white rounded bg-white dark:bg-black text-black dark:text-white"
                    disabled={loading}
                  />
                  <textarea
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 mb-2 border border-black dark:border-white rounded bg-white dark:bg-black text-black dark:text-white"
                    rows="3"
                    disabled={loading}
                  />
                  <button
                    onClick={handleAddEvent}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    disabled={loading}
                  >
                    <Plus size={16} /> Add Event
                  </button>
                </div>

                {/* Event List - Right Side */}
                <div className="p-4 border border-black dark:border-white rounded">
                  <h4 className="font-semibold mb-4 text-black dark:text-white">Event List</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {getEventsForDate(selectedDate).length === 0 ? (
                      <p className="text-black dark:text-white text-center py-8">No events for this day</p>
                    ) : (
                      getEventsForDate(selectedDate).map(event => (
                        <div key={event._id} className="p-3 border-2 border-black dark:border-white rounded flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-bold text-black dark:text-white">{event.title}</h5>
                            {event.description && (
                              <p className="text-sm text-black dark:text-white opacity-80">{event.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="text-red-500 hover:text-red-700 ml-2 cursor-pointer"
                            disabled={loading}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

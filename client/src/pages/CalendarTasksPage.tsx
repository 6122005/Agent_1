import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Plus, Clock } from 'lucide-react';
import { api } from '../lib/api.js';

export const CalendarTasksPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, taskRes] = await Promise.allSettled([
        api.get('/assistant/calendar'),
        api.get('/assistant/tasks'),
      ]);
      if (evRes.status === 'fulfilled') setEvents(evRes.value.data || []);
      if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await api.post('/assistant/chat', { message: `Add task: ${newTaskTitle}` });
      setNewTaskTitle('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">Schedule & Tasks</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Synced live with Google Calendar and Google Tasks via secure OAuth2
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Events Panel (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Google Calendar Events</h3>
            </div>
            <span className="text-xs text-slate-400">{events.length} Scheduled</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No upcoming events found on your Google Calendar.
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((ev, idx) => {
                const startDate = new Date(ev.start);
                const endDate = new Date(ev.end);
                return (
                  <div
                    key={ev.id || idx}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-white text-sm">{ev.summary}</h4>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {ev.location && (
                        <span className="text-[11px] text-slate-500 mt-0.5 block">📍 {ev.location}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Google Tasks</h3>
            </div>
            <span className="text-xs text-slate-400">{tasks.length} Pending</span>
          </div>

          {/* Add quick task form */}
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Quick add task..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All tasks completed! Say "Add task..." to create one.
              </div>
            ) : (
              tasks.map((task, idx) => (
                <div
                  key={task.id || idx}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded border border-slate-700 flex items-center justify-center text-slate-500 hover:border-emerald-500 cursor-pointer">
                      ✓
                    </span>
                    <span className="text-slate-200 font-medium">{task.title}</span>
                  </div>
                  {task.due && (
                    <span className="text-[10px] text-slate-500">
                      Due {new Date(task.due).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

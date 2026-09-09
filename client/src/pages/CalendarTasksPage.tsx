import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Plus, Clock, MapPin, Sparkles, CheckCircle2, Circle, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';

export const CalendarTasksPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

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
    if (!newTaskTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/assistant/chat', { message: `Add task: ${newTaskTitle}` });
      setNewTaskTitle('');
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskCompletion = (id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Check for any overlapping calendar events
  const hasConflict = events.some((evA, i) => {
    const startA = new Date(evA.start).getTime();
    const endA = new Date(evA.end).getTime();
    return events.some((evB, j) => {
      if (i === j) return false;
      const startB = new Date(evB.start).getTime();
      const endB = new Date(evB.end).getTime();
      return (startA < endB && endA > startB);
    });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
            TIMELINE & PRODUCTIVITY WORKSPACE
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Schedule & Tasks
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Live synchronization with Google Calendar events and Google Tasks via secure OAuth2
          </p>
        </div>

        {/* Global Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Google Sync Active
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all duration-150 disabled:opacity-50"
            title="Refresh schedule & tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Events Panel (HERO panel - 7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border-l-4 border-l-sky-500 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                LIVE AGENDA & TIMELINE
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Calendar Events</h3>
                  <p className="text-xs text-zinc-400">Scheduled executive meetings & syncs</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasConflict && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Overlap Warning
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/20 text-sky-300">
                {events.length} Scheduled
              </span>
            </div>
          </div>

          {/* Conflict Warning Banner if detected */}
          {hasConflict && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Attention:</strong> You have overlapping meetings scheduled. Consider delegating or adjusting timestamps.
              </span>
            </div>
          )}

          {/* Events List */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto opacity-80" />
              <p className="text-xs text-zinc-400 font-medium">Fetching Google Calendar events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800/80 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">No Upcoming Events Found</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Your calendar is clear for today. New meetings and Google Meet sessions will populate automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, idx) => {
                const startDate = new Date(ev.start);
                const endDate = new Date(ev.end);
                const isToday = startDate.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={ev.id || idx}
                    className="group relative p-4 bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/[0.06] hover:border-sky-500/30 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white text-sm tracking-tight group-hover:text-sky-300 transition-colors">
                            {ev.summary || 'Untitled Event'}
                          </h4>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' • '}
                            <span className="text-zinc-300 font-mono">
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                        </div>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-900 border border-white/[0.08] text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        Confirmed
                      </span>
                    </div>

                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-1 border-t border-white/[0.04]">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] flex flex-col space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                EXECUTIVE CHECKLIST
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Google Tasks</h3>
                  <p className="text-xs text-zinc-400">Action items & deliverables</p>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              {tasks.length} Pending
            </span>
          </div>

          {/* Add quick task form - styled consistently with Dashboard Chat bar */}
          <form onSubmit={handleCreateTask} className="relative">
            <div className="flex items-center bg-zinc-950/80 border border-white/10 rounded-xl p-1.5 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-inner">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Quick add task..."
                disabled={submitting}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || submitting}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium rounded-lg text-xs transition-colors shadow-sm gap-1 flex-shrink-0"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[220px]">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading Google tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800/80 p-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-300">All Tasks Completed!</p>
                <p className="text-[11px] text-zinc-500">
                  Type an action item above to schedule a new task.
                </p>
              </div>
            ) : (
              tasks.map((task, idx) => {
                const taskId = task.id || `task-${idx}`;
                const isCompleted = completedTaskIds.has(taskId);

                return (
                  <div
                    key={taskId}
                    onClick={() => toggleTaskCompletion(taskId)}
                    className={`group p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-xs select-none ${
                      isCompleted
                        ? 'bg-zinc-950/40 border-white/[0.04] opacity-60'
                        : 'bg-zinc-950/70 hover:bg-zinc-900/80 border-white/[0.06] hover:border-emerald-500/30 shadow-sm hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        aria-label="Toggle task completion"
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'border border-zinc-700 text-transparent hover:border-emerald-500 group-hover:text-zinc-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      </button>

                      <span
                        className={`font-medium truncate transition-all ${
                          isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {task.due ? (
                      <span className="text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-white/[0.06] flex-shrink-0">
                        Due {new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">No due date</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* AI Task Suggestion Tip */}
          <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl flex items-start gap-2.5 text-[11px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
            <span>
              Tip: You can also ask in executive chat <strong className="text-zinc-200">"Remind me to follow up tomorrow at 10 AM"</strong> to create tasks automatically.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

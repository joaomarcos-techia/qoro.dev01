
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { listTasks } from '@/ai/flows/task-management';
import { TaskProfile } from '@/ai/schemas';
import { Loader2, ServerCrash } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    priority: string;
  };
}

const priorityColors: Record<TaskProfile['priority'], { bg: string; border: string }> = {
    low: { bg: 'hsl(var(--crm-primary))', border: 'hsl(var(--crm-primary) / 0.8)' },
    medium: { bg: 'hsl(var(--task-primary))', border: 'hsl(var(--task-primary) / 0.8)' },
    high: { bg: 'hsl(var(--destructive))', border: 'hsl(var(--destructive) / 0.8)' },
    urgent: { bg: 'hsl(var(--pulse-primary))', border: 'hsl(var(--pulse-primary) / 0.8)' },
};


export function TaskCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      listTasks({ actor: currentUser.uid })
        .then((tasks) => {
          const calendarEvents = tasks
            .filter(task => !!task.dueDate) // Only include tasks with a due date
            .map((task): CalendarEvent => ({
              id: task.id,
              title: task.title,
              start: task.dueDate!,
              allDay: true, // Tasks are treated as all-day events on their due date
              backgroundColor: priorityColors[task.priority]?.bg || priorityColors.medium.bg,
              borderColor: priorityColors[task.priority]?.border || priorityColors.medium.border,
              extendedProps: {
                status: task.status,
                priority: task.priority,
              }
            }));
          setEvents(calendarEvents);
        })
        .catch(err => {
          console.error("Failed to load tasks for calendar:", err);
          setError("Não foi possível carregar as tarefas do calendário.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Carregando calendário...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
            <ServerCrash className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
        </div>
    );
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={events}
        locale="pt-br"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        buttonText={{
            today:    'Hoje',
            month:    'Mês',
            week:     'Semana',
            day:      'Dia',
            list:     'Lista'
        }}
        height="auto" // Ensures the calendar fits within its container
        eventDisplay="block"
        eventTimeFormat={{ // Hides the time for all-day events
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        }}
      />
    </div>
  );
}

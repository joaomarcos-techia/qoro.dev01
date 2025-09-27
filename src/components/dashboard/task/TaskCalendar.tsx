
'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/contexts/TasksContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { TaskProfile } from '@/ai/schemas';
import { Loader2, ServerCrash } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    priority: string;
  };
}

const priorityColors: Record<TaskProfile['priority'], { bg: string; border: string, text: string }> = {
    low: { bg: 'hsl(var(--crm-primary))', border: 'hsl(var(--crm-primary) / 0.8)', text: '#000000' },
    medium: { bg: 'hsl(var(--task-primary))', border: 'hsl(var(--task-primary) / 0.8)', text: '#000000' },
    high: { bg: 'hsl(var(--destructive))', border: 'hsl(var(--destructive) / 0.8)', text: '#FFFFFF' },
    urgent: { bg: 'hsl(var(--pulse-primary))', border: 'hsl(var(--pulse-primary) / 0.8)', text: '#FFFFFF' },
};

export function TaskCalendar() {
  const { tasks, loading, error } = useTasks();

  const calendarEvents = tasks
    .filter(task => !!task.dueDate)
    .map((task): CalendarEvent => {
        const colors = priorityColors[task.priority] || priorityColors.medium;
        return {
            id: task.id,
            title: task.title,
            start: task.dueDate!,
            allDay: true,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
            extendedProps: {
                status: task.status,
                priority: task.priority,
            }
        };
    });

  if (loading) {
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
        events={calendarEvents}
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
        height="auto"
        eventDisplay="block"
        eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        }}
      />
    </div>
  );
}

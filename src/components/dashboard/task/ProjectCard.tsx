
'use client';
import { ProjectProfile } from "@/ai/schemas";
import { CheckCircle, Clock, List, ArrowRight } from "lucide-react";
import Link from 'next/link';

interface ProjectCardProps {
    project: ProjectProfile;
}

const statusMap: Record<ProjectProfile['status'], { text: string; color: string }> = {
    not_started: { text: 'Não Iniciado', color: 'bg-gray-100 text-gray-800' },
    in_progress: { text: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
    completed: { text: 'Concluído', color: 'bg-green-100 text-green-800' },
    on_hold: { text: 'Em Espera', color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export function ProjectCard({ project }: ProjectCardProps) {
    const statusInfo = statusMap[project.status] || statusMap.not_started;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 flex flex-col justify-between border border-gray-100">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-black break-words">{project.name}</h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mb-6 min-h-[40px]">{project.description || 'Sem descrição.'}</p>
                
                <div className="space-y-4 mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-neumorphism-inset">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="flex items-center text-gray-600"><List className="w-4 h-4 mr-2"/> {project.taskCount} Tarefas</span>
                        <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-2"/> {project.completedTaskCount} Concluídas</span>
                    </div>
                </div>
            </div>

            <Link href={`/dashboard/task/projetos/${project.id}`}>
              <div className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                <span>Ver Detalhes</span>
                <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
              </div>
            </Link>
        </div>
    );
}

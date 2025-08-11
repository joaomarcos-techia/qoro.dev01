
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getProjectWithTasks } from '@/ai/flows/project-management';
import { ProjectProfile, TaskProfile } from '@/ai/schemas';
import { Loader2, ServerCrash, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { TaskTable } from '@/components/dashboard/task/TaskTable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectDetailsPage() {
    const [project, setProject] = useState<ProjectProfile | null>(null);
    const [tasks, setTasks] = useState<TaskProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const fetchProjectDetails = () => {
        if (currentUser && projectId) {
            setIsLoading(true);
            setError(null);
            getProjectWithTasks({ projectId, actor: currentUser.uid })
                .then(data => {
                    setProject(data.project);
                    setTasks(data.tasks);
                })
                .catch(err => {
                    console.error("Failed to fetch project details:", err);
                    setError("Não foi possível carregar os detalhes do projeto.");
                })
                .finally(() => setIsLoading(false));
        }
    }

    useEffect(() => {
        fetchProjectDetails();
    }, [currentUser, projectId]);

    const renderContent = () => {
        if (isLoading) {
            return (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-gray-600">Carregando detalhes do projeto...</p>
              </div>
            );
        }
      
        if (error) {
            return (
              <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg p-8 text-center">
                <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
            );
        }
        
        if (!project) {
            return <div className="text-center py-10">Projeto não encontrado.</div>
        }

        return (
            <div>
                 <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200 mb-8">
                    <h2 className="text-2xl font-bold text-black mb-2">{project.name}</h2>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    <div className="flex items-center space-x-6 text-sm">
                        {project.dueDate && (
                            <div className="flex items-center text-gray-500">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Entrega: {format(new Date(project.dueDate), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                            </div>
                        )}
                         <div className="flex items-center text-gray-500">
                            <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                            <span>Progresso: {project.progress}%</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
                     <h3 className="text-xl font-bold text-black mb-4">Tarefas do Projeto</h3>
                    <TaskTable data={tasks} isLoading={false} error={null} onRefresh={fetchProjectDetails} />
                </div>
            </div>
        )
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para todos os projetos
                    </button>
                    <h1 className="text-3xl font-bold text-black">Detalhes do Projeto</h1>
                </div>
            </div>
            {renderContent()}
        </div>
    );
}

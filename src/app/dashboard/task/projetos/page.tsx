
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, ClipboardList, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listProjects } from '@/ai/flows/project-management';
import { ProjectProfile } from '@/ai/schemas';
import { ProjectCard } from '@/components/dashboard/task/ProjectCard';
import { ProjectForm } from '@/components/dashboard/task/ProjectForm';

export default function ProjetosPage() {
  const [projects, setProjects] = useState<ProjectProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchProjects = () => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      listProjects({ actor: currentUser.uid })
        .then(setProjects)
        .catch((err) => {
          console.error(err);
          setError('Não foi possível carregar os projetos.');
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentUser, refreshCounter]);

  const handleProjectAction = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-gray-600">Carregando projetos...</p>
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
    
    if (projects.length === 0) {
        return (
            <div className="text-center py-16">
                <ClipboardList className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Nenhum projeto encontrado</h3>
                <p className="mt-2 text-sm text-gray-500">Comece criando seu primeiro projeto para organizar suas tarefas.</p>
            </div>
        )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Projetos</h1>
          <p className="text-gray-600">
            Crie, gerencie e acompanhe o progresso de suas iniciativas.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                Defina os detalhes do seu novo projeto para começar.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm onProjectAction={handleProjectAction} />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200">
        {renderContent()}
      </div>
    </div>
  );
}

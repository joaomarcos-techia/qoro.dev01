# Guia de Resolução de Problemas - Firebase Server Action

## 📋 Análise dos Erros

### Erro Principal
- **Status**: 500 Internal Server Error
- **Endpoint**: `POST /dashboard/task/lista`
- **Localização**: `taskService.ts:134-135`
- **Mensagem**: "Falha ao carregar tarefas. Ocorreu um erro no servidor."

### Stack Trace Indica
- Problema na função `$$ACTION_2` no taskService
- Integração com Genkit AI está falhando
- Firebase Authentication pode estar envolvido

## 🔍 Análise Específica do Erro

Baseado no stack trace detalhado, o erro está acontecendo em:
- **Header.tsx:30** e **Header.tsx:44** 
- **page.tsx:37**
- **taskService.ts:134** (função `$ACTION_2`)

O padrão indica que **múltiplos componentes estão tentando carregar tarefas simultaneamente** quando o usuário se autentica, causando sobrecarga no servidor.

## 🔍 Possíveis Causas

### 1. **Chamadas Duplicadas/Simultâneas**
```typescript
// PROBLEMA: Múltiplas chamadas simultâneas
// Header.tsx e page.tsx chamando a mesma função ao mesmo tempo

// SOLUÇÃO: Implementar debounce e cache
const useTasksWithCache = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  const loadTasks = useCallback(async () => {
    // Evitar chamadas múltiplas em 5 segundos
    if (Date.now() - lastFetch < 5000 && tasks.length > 0) {
      return tasks;
    }

    if (loading) return; // Evitar chamadas simultâneas
    
    setLoading(true);
    try {
      const result = await listarTarefas();
      setTasks(result);
      setLastFetch(Date.now());
      return result;
    } finally {
      setLoading(false);
    }
  }, [tasks, loading, lastFetch]);

  return { tasks, loadTasks, loading };
};
```

### 2. **Problemas de Configuração do Firebase**
```typescript
// Verifique se o Firebase está inicializado corretamente
// firebase.config.ts ou similar
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Suas configurações
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2. **Problemas no taskService.ts**
```typescript
// src/services/taskService.ts
// Verifique a implementação da função que está falhando

export async function listarTarefas() {
  try {
    // Verificar se o usuário está autenticado
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Sua lógica de busca
    const tasksRef = collection(db, 'tasks');
    const querySnapshot = await getDocs(tasksRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
    throw new Error('Falha ao carregar tarefas. Ocorreu um erro no servidor.');
  }
}
```

### 3. **Problemas com Genkit AI**
```typescript
// Verificar configuração do Genkit
import { genkit } from '@genkit-ai/core';

// Certifique-se de que está configurado corretamente
const ai = genkit({
  // configurações
});
```

## 🛠️ Soluções Prioritárias

### **Solução 1: Prevenir Chamadas Simultâneas (URGENTE)**

```typescript
// 1. Criar um Context para gerenciar estado global das tarefas
// contexts/TasksContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TasksContextType {
  tasks: any[];
  loading: boolean;
  error: string | null;
  loadTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  const loadTasks = useCallback(async () => {
    // Evitar múltiplas chamadas
    if (loading) {
      console.log('⏳ Carregamento já em progresso...');
      return;
    }

    // Cache por 30 segundos
    if (Date.now() - lastFetch < 30000 && tasks.length > 0) {
      console.log('📦 Usando cache...');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Carregando tarefas...');
      const result = await listarTarefas();
      setTasks(result);
      setLastFetch(Date.now());
      console.log('✅ Tarefas carregadas:', result.length);
    } catch (err) {
      console.error('❌ Erro ao carregar tarefas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, tasks.length, lastFetch]);

  return (
    <TasksContext.Provider value={{ tasks, loading, error, loadTasks }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de TasksProvider');
  }
  return context;
};
```

```typescript
// 2. Atualizar Header.tsx
import { useTasks } from '@/contexts/TasksContext';

export default function Header() {
  const { loadTasks, loading, error } = useTasks();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('👤 Usuário autenticado:', user.uid);
        // Não chama loadTasks aqui - deixa para o page.tsx
      }
    });

    return () => unsubscribe();
  }, []);

  // Remove a chamada loadTasks() do Header
  return (
    // seu JSX
  );
}
```

```typescript
// 3. Atualizar page.tsx
import { useTasks } from '@/contexts/TasksContext';

export default function Page() {
  const { tasks, loadTasks, loading, error } = useTasks();

  useEffect(() => {
    // Só carrega se o usuário estiver autenticado
    const user = auth.currentUser;
    if (user) {
      loadTasks();
    }
  }, [loadTasks]);

  if (error) {
    return <div>Erro: {error}</div>;
  }

  // resto do componente
}
```

### **Solução 2: Implementar Circuit Breaker no taskService**

```typescript
// utils/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private nextAttempt = Date.now();
  private timeout = 60000; // 1 minuto

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= 5 && Date.now() < this.nextAttempt) {
      throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset em caso de sucesso
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= 5) {
        this.nextAttempt = Date.now() + this.timeout;
      }
      throw error;
    }
  }
}

const taskServiceBreaker = new CircuitBreaker();
```

### **Solução 3: Verificar Logs do Servidor**

1. **Ativar logs detalhados no Next.js:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
```

2. **Adicionar logs no taskService:**
```typescript
export async function listarTarefas() {
  console.log('🔍 Iniciando carregamento de tarefas...');
  
  try {
    console.log('✅ Verificando autenticação...');
    // seu código aqui
    
    console.log('✅ Buscando tarefas no Firestore...');
    // sua lógica de busca
    
    console.log('✅ Tarefas carregadas com sucesso');
    return results;
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
}
```

### **Solução 2: Verificar Autenticação**

```typescript
// Header.tsx - Melhorar tratamento de autenticação
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        console.log('Usuário autenticado:', user.uid);
        // Carregar tarefas apenas se autenticado
        await carregarTarefas();
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    } else {
      console.log('Usuário não autenticado');
    }
  });

  return () => unsubscribe();
}, []);
```

### **Solução 3: Implementar Retry e Fallback**

```typescript
// utils/apiUtils.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Backoff exponencial
    }
  }
  throw new Error('Todas as tentativas falharam');
}

// Usar no taskService
export async function listarTarefas() {
  return withRetry(async () => {
    // sua lógica aqui
  });
}
```

### **Solução 4: Verificar Regras do Firestore**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para usuários autenticados
    match /tasks/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Solução 5: Configurar CORS (se necessário)**

```typescript
// Se estiver usando Firebase Functions
import { cors } from 'cors';

const corsHandler = cors({ origin: true });

export const listarTarefas = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // sua lógica aqui
  });
});
```

## 🔧 Checklist de Diagnóstico

- [ ] Verificar se o Firebase está inicializado corretamente
- [ ] Confirmar se as credenciais do Firebase estão válidas
- [ ] Testar conexão com Firestore separadamente
- [ ] Verificar se as regras do Firestore permitem a operação
- [ ] Confirmar se o usuário está autenticado antes da requisição
- [ ] Verificar logs do servidor Next.js
- [ ] Testar a função isoladamente
- [ ] Verificar se há problemas de rede/conectividade
- [ ] Confirmar configuração do Genkit AI

## 📝 Próximos Passos

1. **Implementar logs detalhados** nas funções que estão falhando
2. **Verificar o console do servidor** para erros mais específicos
3. **Testar as funções isoladamente** usando um script de teste
4. **Implementar tratamento de erro robusto** com fallbacks
5. **Adicionar monitoramento** para identificar padrões

## 🚨 Monitoramento Contínuo

```typescript
// Implementar healthcheck
export async function healthCheck() {
  try {
    const testDoc = await db.collection('_health').doc('test').get();
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```
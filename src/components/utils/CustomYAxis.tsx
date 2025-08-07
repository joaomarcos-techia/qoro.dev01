
'use client';

import { YAxis as RechartsYAxis, type YAxisProps } from 'recharts';

/**
 * @fileoverview Custom Wrapper for Recharts YAxis Component.
 * 
 * @description
 * Este componente foi criado para resolver um warning de depreciação do React.
 * A biblioteca `recharts` utiliza o padrão `defaultProps` em seus componentes funcionais
 * (como o YAxis), um padrão que será removido em futuras versões do React.
 * 
 * Este wrapper (invólucro) importa o componente original `YAxis` da `recharts` e o 
 * re-exporta, mas aplicando os valores padrão diretamente na desestruturação das props,
 * usando a sintaxe moderna de parâmetros padrão do JavaScript.
 * 
 * Isso elimina o warning no console, garante a compatibilidade com futuras versões do
 * React e nos permite continuar usando a biblioteca `recharts` de forma limpa.
 * 
 * @param {YAxisProps} props - As mesmas props do componente YAxis original da `recharts`.
 */
const CustomYAxis = ({ 
  // Define os valores padrão usando a sintaxe de parâmetros de função do JS.
  tickLine = false,
  axisLine = false,
  ...props
}: YAxisProps) => {
  // Passa as props (incluindo as com valores padrão) para o componente original.
  return <RechartsYAxis 
    tickLine={tickLine}
    axisLine={axisLine}
    {...props} 
  />;
};

export default CustomYAxis;

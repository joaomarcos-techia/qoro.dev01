'use client';

import { XAxis as RechartsXAxis, type XAxisProps } from 'recharts';

/**
 * @fileoverview Custom Wrapper for Recharts XAxis Component.
 * 
 * @description
 * Este componente foi criado para resolver um warning de depreciação do React.
 * A biblioteca `recharts` utiliza o padrão `defaultProps` em seus componentes funcionais
 * (como o XAxis), um padrão que será removido em futuras versões do React.
 * 
 * Este wrapper (invólucro) importa o componente original `XAxis` da `recharts` e o 
 * re-exporta, mas aplicando os valores padrão diretamente na desestruturação das props,
 * usando a sintaxe moderna de parâmetros padrão do JavaScript.
 * 
 * Isso elimina o warning no console, garante a compatibilidade com futuras versões do
 * React e nos permite continuar usando a biblioteca `recharts` de forma limpa.
 * 
 * @param {XAxisProps} props - As mesmas props do componente XAxis original da `recharts`.
 */

const CustomXAxis = ({
  // Define os valores padrão usando a sintaxe de parâmetros de função do JS.
  allowDuplicatedCategory = true,
  tickLine = false,
  axisLine = false,
  ...props
}: XAxisProps) => {
  // Passa as props (incluindo as com valores padrão) para o componente original.
  return <RechartsXAxis 
    allowDuplicatedCategory={allowDuplicatedCategory}
    tickLine={tickLine}
    axisLine={axisLine}
    {...props} 
  />;
};

export default CustomXAxis;

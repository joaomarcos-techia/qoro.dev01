import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QoroPulse | AI Chat',
};

export default function PulsePage() {
    return (
      <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-black">QoroPulse</h1>
            <p className="text-gray-600">
                Converse com seus dados e obtenha insights de negócio em tempo real.
            </p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200 min-h-[60vh] flex items-center justify-center">
             <p className="text-gray-400">Interface de Chat - Em breve</p>
        </div>
      </div>
    );
  }


import { BarChart3, CheckSquare, DollarSign, Home, Settings, Users, TrendingUp, ArrowDown } from "lucide-react";

export function DashboardMockup() {
    return (
        <div className="w-full aspect-video rounded-lg bg-[#0A0A0A] flex overflow-hidden border border-white/10">
            {/* Sidebar */}
            <div className="w-16 bg-black/20 p-3 flex-shrink-0 flex flex-col items-center justify-between">
                <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center font-bold text-lg">Q</div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                        <Home className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary transition-colors">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                        <Users className="w-5 h-5" />
                    </div>
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                    <Settings className="w-5 h-5" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-hidden">
                <h1 className="text-xl font-bold text-white/90 mb-6">Dashboard</h1>
                
                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center text-white/60 text-xs mb-1">
                            <DollarSign className="w-3 h-3 mr-1.5" />
                            Receita Mensal
                        </div>
                        <p className="text-lg font-bold text-white/90">R$ 25.480,00</p>
                        <div className="flex items-center text-green-400 text-xs mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12.5%
                        </div>
                    </div>
                     <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center text-white/60 text-xs mb-1">
                            <Users className="w-3 h-3 mr-1.5" />
                            Novos Clientes
                        </div>
                        <p className="text-lg font-bold text-white/90">32</p>
                        <div className="flex items-center text-green-400 text-xs mt-1">
                             <TrendingUp className="w-3 h-3 mr-1" />
                            +5%
                        </div>
                    </div>
                     <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center text-white/60 text-xs mb-1">
                            <ArrowDown className="w-3 h-3 mr-1.5" />
                            Taxa de Churn
                        </div>
                        <p className="text-lg font-bold text-white/90">1.8%</p>
                         <div className="flex items-center text-red-400 text-xs mt-1">
                             <TrendingUp className="w-3 h-3 mr-1" />
                            +0.3%
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-40 bg-white/5 p-4 rounded-lg border border-white/10 flex items-end space-x-2">
                    {[3, 5, 4, 7, 6, 8, 9, 7, 5, 6, 8, 10].map((height, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-b from-primary/80 to-primary/40" style={{ height: `${height * 10}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

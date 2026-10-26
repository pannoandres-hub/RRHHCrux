import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeChartModalProps {
  prenda: string;
  sizeType: string;
  onClose: () => void;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ prenda, sizeType, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-sm text-white">Tabla de Medidas & Talles: {prenda}</h3>
              <p className="text-xs text-zinc-400">Guía anatómica de referencia industrial</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual reference representation */}
        {sizeType === 'numerico_calzado' ? (
          <div className="space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border border-zinc-800">Talle Arg/EU</th>
                    <th className="p-2 border border-zinc-800">Largo Pie (cm)</th>
                    <th className="p-2 border border-zinc-800">Equiv. US</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200 font-mono">
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">38</td><td className="p-2 border border-zinc-800">24.5 cm</td><td className="p-2 border border-zinc-800">6.0</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">39</td><td className="p-2 border border-zinc-800">25.0 cm</td><td className="p-2 border border-zinc-800">6.5</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">40</td><td className="p-2 border border-zinc-800">25.8 cm</td><td className="p-2 border border-zinc-800">7.5</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">41</td><td className="p-2 border border-zinc-800">26.5 cm</td><td className="p-2 border border-zinc-800">8.5</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">42</td><td className="p-2 border border-zinc-800">27.2 cm</td><td className="p-2 border border-zinc-800">9.0</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">43</td><td className="p-2 border border-zinc-800">28.0 cm</td><td className="p-2 border border-zinc-800">10.0</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">44</td><td className="p-2 border border-zinc-800">28.6 cm</td><td className="p-2 border border-zinc-800">10.5</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">45</td><td className="p-2 border border-zinc-800">29.4 cm</td><td className="p-2 border border-zinc-800">11.5</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-400 italic">Mide desde el talón hasta la punta del dedo pulgar con media gruesa puesta.</p>
          </div>
        ) : sizeType === 'numerico_camisa' ? (
          <div className="space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border border-zinc-800">Talle Camisa</th>
                    <th className="p-2 border border-zinc-800">Cuello (cm)</th>
                    <th className="p-2 border border-zinc-800">Contorno Pecho (cm)</th>
                    <th className="p-2 border border-zinc-800">Largo Manga (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200 font-mono">
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">38</td><td className="p-2 border border-zinc-800">38 cm</td><td className="p-2 border border-zinc-800">92 - 96 cm</td><td className="p-2 border border-zinc-800">62 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">40</td><td className="p-2 border border-zinc-800">40 cm</td><td className="p-2 border border-zinc-800">97 - 102 cm</td><td className="p-2 border border-zinc-800">63 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">42</td><td className="p-2 border border-zinc-800">42 cm</td><td className="p-2 border border-zinc-800">103 - 108 cm</td><td className="p-2 border border-zinc-800">64 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">44</td><td className="p-2 border border-zinc-800">44 cm</td><td className="p-2 border border-zinc-800">109 - 114 cm</td><td className="p-2 border border-zinc-800">65 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">46</td><td className="p-2 border border-zinc-800">46 cm</td><td className="p-2 border border-zinc-800">115 - 120 cm</td><td className="p-2 border border-zinc-800">66 cm</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border border-zinc-800">Talle</th>
                    <th className="p-2 border border-zinc-800">Busto/Pecho (cm)</th>
                    <th className="p-2 border border-zinc-800">Cintura (cm)</th>
                    <th className="p-2 border border-zinc-800">Cadera (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200 font-mono">
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">S (Small)</td><td className="p-2 border border-zinc-800">86 - 92 cm</td><td className="p-2 border border-zinc-800">70 - 76 cm</td><td className="p-2 border border-zinc-800">90 - 96 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">M (Medium)</td><td className="p-2 border border-zinc-800">93 - 99 cm</td><td className="p-2 border border-zinc-800">77 - 83 cm</td><td className="p-2 border border-zinc-800">97 - 103 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">L (Large)</td><td className="p-2 border border-zinc-800">100 - 107 cm</td><td className="p-2 border border-zinc-800">84 - 91 cm</td><td className="p-2 border border-zinc-800">104 - 110 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">XL (Extra)</td><td className="p-2 border border-zinc-800">108 - 115 cm</td><td className="p-2 border border-zinc-800">92 - 99 cm</td><td className="p-2 border border-zinc-800">111 - 118 cm</td></tr>
                  <tr><td className="p-2 border border-zinc-800 font-bold text-indigo-400">XXL</td><td className="p-2 border border-zinc-800">116 - 124 cm</td><td className="p-2 border border-zinc-800">100 - 108 cm</td><td className="p-2 border border-zinc-800">119 - 126 cm</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

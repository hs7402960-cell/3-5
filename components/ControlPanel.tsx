
import React from 'react';
import { Axes } from '../types';
import { Play, Square, RotateCcw, ScanLine } from 'lucide-react';

interface ControlPanelProps {
  axes: Axes;
  setAxes: React.Dispatch<React.SetStateAction<Axes>>;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
  resetScan: () => void;
  startDemo: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  axes,
  setAxes,
  isScanning,
  setIsScanning,
  resetScan,
  startDemo
}) => {
  const handleChange = (key: keyof Axes, value: number) => {
    setAxes(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-gray-850 p-6 rounded-lg border border-gray-750 flex flex-col gap-6 shadow-xl w-full max-w-sm">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-white">CNC Control</h2>
         <div className="flex gap-2">
            {!isScanning ? (
                <button onClick={() => setIsScanning(true)} className="p-2 bg-green-600 rounded hover:bg-green-500" title="Start Manual Scan">
                    <Play size={16} />
                </button>
            ) : (
                <button onClick={() => setIsScanning(false)} className="p-2 bg-red-600 rounded hover:bg-red-500" title="Stop Scan">
                    <Square size={16} />
                </button>
            )}
             <button onClick={resetScan} className="p-2 bg-gray-600 rounded hover:bg-gray-500" title="Reset Point Cloud">
                <RotateCcw size={16} />
            </button>
         </div>
      </div>

      <div className="space-y-4">
        <div>
           <div className="flex justify-between text-sm text-gray-400 mb-1">
             <span>X-Axis (Gantry)</span>
             <span>{axes.x.toFixed(1)}</span>
           </div>
           <input type="range" min="0" max="100" value={axes.x} onChange={(e) => handleChange('x', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>

        <div>
           <div className="flex justify-between text-sm text-gray-400 mb-1">
             <span>Y-Axis (Gantry)</span>
             <span>{axes.y.toFixed(1)}</span>
           </div>
           <input type="range" min="0" max="100" value={axes.y} onChange={(e) => handleChange('y', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>

        <div>
           <div className="flex justify-between text-sm text-gray-400 mb-1">
             <span>Z-Axis (Height)</span>
             <span>{axes.z.toFixed(1)}</span>
           </div>
           <input type="range" min="0" max="100" value={axes.z} onChange={(e) => handleChange('z', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>

        <div>
           <div className="flex justify-between text-sm text-gray-400 mb-1">
             <span>A-Axis (Tilt)</span>
             <span>{axes.a.toFixed(1)}°</span>
           </div>
           <input type="range" min="-90" max="90" value={axes.a} onChange={(e) => handleChange('a', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
        </div>

        <div>
           <div className="flex justify-between text-sm text-gray-400 mb-1">
             <span>B-Axis (Rotate)</span>
             <span>{axes.b.toFixed(1)}°</span>
           </div>
           <input type="range" min="-180" max="180" value={axes.b} onChange={(e) => handleChange('b', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
        </div>
      </div>

      <button 
        onClick={startDemo}
        className="mt-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
      >
        <ScanLine size={18} />
        Start Full Scan
      </button>
    </div>
  );
};

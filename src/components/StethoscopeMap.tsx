import React, { useState } from 'react';

export interface LobeZone {
  id: string;
  name: string;
  type: 'Bronchial' | 'Bronchovesicular' | 'Vesicular';
  x: number;
  y: number;
  side: 'left' | 'right';
  view: 'anterior' | 'posterior';
  description: string;
}

interface StethoscopeMapProps {
  activeZoneId: string;
  onSelectZone: (zone: LobeZone) => void;
}

export const LOBE_ZONES: LobeZone[] = [
  // Anterior View (Front)
  {
    id: 'ant-ur',
    name: 'Anterior Right Upper Lobe',
    type: 'Bronchial',
    x: 85,
    y: 75,
    side: 'right',
    view: 'anterior',
    description: 'High-pitched, loud blowing sounds heard over the trachea.'
  },
  {
    id: 'ant-ul',
    name: 'Anterior Left Upper Lobe',
    type: 'Bronchial',
    x: 155,
    y: 75,
    side: 'left',
    view: 'anterior',
    description: 'Bilateral bronchial breathing fields. Assesses upper airway pathways.'
  },
  {
    id: 'ant-mr',
    name: 'Anterior Right Middle Lobe',
    type: 'Bronchovesicular',
    x: 75,
    y: 125,
    side: 'right',
    view: 'anterior',
    description: 'Intermediate pitch, heard between 1st & 2nd intercostal spaces.'
  },
  {
    id: 'ant-ll',
    name: 'Anterior Left Lower Lobe',
    type: 'Vesicular',
    x: 165,
    y: 175,
    side: 'left',
    view: 'anterior',
    description: 'Soft, low-pitched rustling sound representing deep alveolar air intake.'
  },
  {
    id: 'ant-lr',
    name: 'Anterior Right Lower Lobe',
    type: 'Vesicular',
    x: 75,
    y: 175,
    side: 'right',
    view: 'anterior',
    description: 'Vesicular breathing zone. Principal site for crackle inspection.'
  },

  // Posterior View (Back)
  {
    id: 'post-ul',
    name: 'Posterior Left Upper Lobe',
    type: 'Bronchovesicular',
    x: 80,
    y: 70,
    side: 'left',
    view: 'posterior',
    description: 'Moderate pitch and intensity. Assesses posterior bronchial stems.'
  },
  {
    id: 'post-ur',
    name: 'Posterior Right Upper Lobe',
    type: 'Bronchovesicular',
    x: 160,
    y: 70,
    side: 'right',
    view: 'posterior',
    description: 'Upper spinal border fields. Vital for early wheeze detection.'
  },
  {
    id: 'post-ll',
    name: 'Posterior Left Lower Lobe',
    type: 'Vesicular',
    x: 70,
    y: 160,
    side: 'left',
    view: 'posterior',
    description: 'Deep pulmonary fields. Primary evaluation for fluid and consolidation.'
  },
  {
    id: 'post-lr',
    name: 'Posterior Right Lower Lobe',
    type: 'Vesicular',
    x: 170,
    y: 160,
    side: 'right',
    view: 'posterior',
    description: 'Basal vesicular zone. Prone to crackle signals due to gravity-driven secretions.'
  }
];

const StethoscopeMap: React.FC<StethoscopeMapProps> = ({ activeZoneId, onSelectZone }) => {
  const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

  const filteredZones = LOBE_ZONES.filter((z) => z.view === view);

  return (
    <div className="w-full flex flex-col items-center bg-[#0d1326]/60 backdrop-blur-md rounded-xl p-5 border border-white/10">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wider text-white/90 uppercase font-mono">
          Stethoscope Chest Mapper
        </h3>
        
        {/* Toggle buttons for Anterior/Posterior */}
        <div className="flex bg-[#070b16] rounded-lg p-0.5 border border-white/10">
          <button
            onClick={() => setView('anterior')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all duration-300 ${
              view === 'anterior'
                ? 'bg-blue-600/80 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ANTERIOR (FRONT)
          </button>
          <button
            onClick={() => setView('posterior')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all duration-300 ${
              view === 'posterior'
                ? 'bg-blue-600/80 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            POSTERIOR (BACK)
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[280px] aspect-[4/5] flex items-center justify-center my-2 select-none">
        {/* Lungs and Torso SVG Layout */}
        <svg viewBox="0 0 240 300" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          {/* Torso Outline */}
          <path
            d="M 60 20 C 80 15, 160 15, 180 20 C 190 22, 195 35, 195 45 C 195 55, 180 65, 205 90 C 220 105, 215 170, 210 210 C 205 240, 195 285, 190 290 C 140 295, 100 295, 50 290 C 45 285, 35 240, 30 210 C 25 170, 20 105, 35 90 C 60 65, 45 55, 45 45 C 45 35, 50 22, 60 20 Z"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
            strokeDasharray="4,4"
          />

          {/* Rib Cage Lines (Visual details) */}
          <path d="M 50 110 Q 120 120 190 110" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
          <path d="M 45 140 Q 120 155 195 140" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
          <path d="M 40 170 Q 120 190 200 170" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
          <path d="M 38 200 Q 120 225 202 200" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />

          {/* Trachea Outline */}
          <path
            d="M 116 20 L 116 65 L 105 85 M 124 20 L 124 65 L 135 85"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />

          {/* Left Lung Silhouette */}
          <path
            d="M 130 80 C 135 60, 160 55, 185 70 C 195 76, 200 95, 202 115 C 206 150, 195 200, 188 215 C 180 230, 150 235, 134 210 C 128 200, 135 150, 130 130 C 127 115, 126 95, 130 80 Z"
            fill="none"
            stroke={view === 'anterior' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}
            strokeWidth="2"
            className="transition-colors duration-500"
          />

          {/* Right Lung Silhouette */}
          <path
            d="M 110 80 C 105 60, 80 55, 55 70 C 45 76, 40 95, 38 115 C 34 150, 45 200, 52 215 C 60 230, 90 235, 106 210 C 112 200, 105 150, 110 130 C 113 115, 114 95, 110 80 Z"
            fill="none"
            stroke={view === 'anterior' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}
            strokeWidth="2"
            className="transition-colors duration-500"
          />

          {/* Stethoscope Target Points */}
          {filteredZones.map((zone) => {
            const isActive = activeZoneId === zone.id;
            let markerColor = '#10B981'; // Green for Vesicular
            let markerGlow = 'rgba(16, 185, 129, 0.4)';
            if (zone.type === 'Bronchial') {
              markerColor = '#EF4444'; // Red-ish for upper tracheal/bronchial
              markerGlow = 'rgba(239, 68, 68, 0.4)';
            } else if (zone.type === 'Bronchovesicular') {
              markerColor = '#3B82F6'; // Blue
              markerGlow = 'rgba(59, 130, 246, 0.4)';
            }

            return (
              <g
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className="cursor-pointer group"
              >
                {/* Active Outer Pulsing Ring */}
                {isActive && (
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r="15"
                    fill="none"
                    stroke={markerColor}
                    strokeWidth="1.5"
                    className="animate-ping origin-center"
                    style={{ transformOrigin: `${zone.x}px ${zone.y}px` }}
                  />
                )}

                {/* Hover ring */}
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r="12"
                  fill="none"
                  stroke={markerColor}
                  strokeWidth="1"
                  opacity="0"
                  className="group-hover:opacity-100 transition-opacity duration-300"
                />

                {/* Inner target circle */}
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={isActive ? '7' : '5'}
                  fill={markerColor}
                  className="transition-all duration-300"
                  style={{
                    filter: `drop-shadow(0 0 6px ${markerGlow})`
                  }}
                />

                {/* Stethoscope scope crosshair styling */}
                {isActive && (
                  <>
                    <line x1={zone.x - 14} y1={zone.y} x2={zone.x - 9} y2={zone.y} stroke={markerColor} strokeWidth="1" />
                    <line x1={zone.x + 9} y1={zone.y} x2={zone.x + 14} y2={zone.y} stroke={markerColor} strokeWidth="1" />
                    <line x1={zone.x} y1={zone.y - 14} x2={zone.x} y2={zone.y - 9} stroke={markerColor} strokeWidth="1" />
                    <line x1={zone.x} y1={zone.y + 9} x2={zone.x} y2={zone.y + 14} stroke={markerColor} strokeWidth="1" />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Chest overlay label */}
        <div className="absolute bottom-2 bg-[#070b16]/90 border border-white/5 px-3 py-1 rounded text-[10px] font-mono text-white/50 tracking-wider">
          VIEW: {view.toUpperCase()} ASPECT
        </div>
      </div>

      {/* Target details */}
      <div className="w-full mt-2 pt-3 border-t border-white/5">
        <div className="text-xs font-semibold text-white/40 font-mono tracking-wider">
          SELECTING SITE
        </div>
        <div className="text-sm font-semibold text-white/90 mt-0.5">
          {LOBE_ZONES.find((z) => z.id === activeZoneId)?.name || 'None selected'}
        </div>
        <div className="text-[11px] text-white/60 leading-relaxed mt-1 font-sans">
          {LOBE_ZONES.find((z) => z.id === activeZoneId)?.description || 'Select a pulsing stethoscope target point above to begin mapping respiratory sounds.'}
        </div>
      </div>
    </div>
  );
};

export default StethoscopeMap;

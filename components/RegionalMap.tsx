
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { MedicalDesert } from '../types';

interface Props {
  deserts: MedicalDesert[];
  selectedDesertId?: string | null;
  onDesertClick?: (desert: MedicalDesert) => void;
  onClearSelection?: () => void;
  theme?: 'dark' | 'light';
}

const RegionalMap: React.FC<Props> = ({ deserts, selectedDesertId, onDesertClick, onClearSelection, theme = 'dark' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([7.9465, -1.0232], 7, { duration: 1.5 });
      if (onClearSelection) onClearSelection();
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([7.9465, -1.0232], 7);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Clear selection on background click
    map.on('click', (e) => {
      if (onClearSelection) onClearSelection();
    });

    // Initial size fix
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Handle map resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === 'light' 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    
    deserts.forEach((desert) => {
      const isSelected = desert.id === selectedDesertId;
      const isSevere = desert.severity > 85;
      const color = isSevere ? '#f43f5e' : '#10b981';
      const glow = isSevere ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      const activeGlow = isSevere ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)';

      const circle = L.circleMarker([desert.coordinates[0], desert.coordinates[1]], {
        radius: isSelected ? Math.max(12, (desert.severity / 100) * 45) : Math.max(12, (desert.severity / 100) * 30),
        fillColor: color,
        color: isSelected ? '#fff' : color,
        weight: isSelected ? 2 : 1,
        opacity: isSelected ? 0.8 : 0.4,
        fillOpacity: isSelected ? 0.3 : 0.15,
      });

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="position: relative; cursor: pointer;">
            ${isSelected ? `
              <div style="
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 40px; height: 40px;
                background: ${activeGlow};
                border-radius: 50%;
                filter: blur(8px);
                animation: activeSelectionPulse 1.5s infinite ease-out;
              "></div>
            ` : ''}
            <div style="
              width: ${isSelected ? '20px' : '14px'}; 
              height: ${isSelected ? '20px' : '14px'}; 
              background: ${color}; 
              border-radius: 50%; 
              border: 2px solid white;
              box-shadow: 0 0 ${isSelected ? '30px' : '20px'} ${isSelected ? activeGlow : glow};
              animation: mapPulse 2s infinite ease-in-out;
              transition: all 0.3s ease;
            "></div>
          </div>
          <style>
            @keyframes mapPulse {
              0% { transform: scale(1); box-shadow: 0 0 5px ${glow}; }
              50% { transform: scale(1.4); box-shadow: 0 0 25px ${glow}; }
              100% { transform: scale(1); box-shadow: 0 0 5px ${glow}; }
            }
            @keyframes activeSelectionPulse {
              0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
              100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: isSelected ? [20, 20] : [14, 14],
        iconAnchor: isSelected ? [10, 10] : [7, 7]
      });

      const coreMarker = L.marker([desert.coordinates[0], desert.coordinates[1]], { icon });

      const handleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (onDesertClick) onDesertClick(desert);
        map.flyTo([desert.coordinates[0], desert.coordinates[1]], 11, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      };

      coreMarker.on('click', handleClick);
      circle.on('click', handleClick);

      layerGroup.addLayer(circle);
      layerGroup.addLayer(coreMarker);
    });
  }, [deserts, selectedDesertId, onDesertClick]);

  return (
    <div className="w-full h-full relative group" style={{ minHeight: '400px' }}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0" 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-8 left-8 z-[500] pointer-events-none flex flex-col gap-4">
        <div className="glass-card p-4 rounded-2xl border-emerald-500/20 backdrop-blur-xl pointer-events-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Satellite Link</p>
          <p className="text-xs font-black text-emerald-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            GHANA_NORTH_NODE_V4
          </p>
          <button 
            onClick={(e) => { e.stopPropagation(); resetView(); }}
            className="mt-3 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest transition-all pointer-events-auto"
          >
            Reset Matrix View
          </button>
        </div>

        <div className="glass-card p-4 rounded-2xl border-white/5 backdrop-blur-xl space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inference Legend</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 border border-white/20"></div>
              <span className="text-[10px] font-bold text-slate-300">Critical Desert (85%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white/20"></div>
              <span className="text-[10px] font-bold text-slate-300">Vulnerable Area</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-[500] pointer-events-none">
        <div className="glass-card p-4 rounded-2xl border-white/10 text-right backdrop-blur-xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Scan Area</p>
          <p className="text-[10px] font-black text-white">238,533 km²</p>
          <div className="h-1 w-24 bg-white/5 mt-2 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-emerald-500/50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalMap;

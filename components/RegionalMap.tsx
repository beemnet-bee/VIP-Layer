
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { MedicalDesert, HospitalReport } from '../types';

interface Props {
  deserts: MedicalDesert[];
  hospitals?: HospitalReport[];
  selectedDesertId?: string | null;
  onDesertClick?: (desert: MedicalDesert) => void;
  onClearSelection?: () => void;
  theme?: 'dark' | 'light';
}

const RegionalMap: React.FC<Props> = ({ deserts, hospitals = [], selectedDesertId, onDesertClick, onClearSelection, theme = 'dark' }) => {
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

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([7.9465, -1.0232], 7);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', (e) => {
      if (onClearSelection) onClearSelection();
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

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
    
    // Render Deserts (Clusters)
    deserts.forEach((desert) => {
      const isSelected = desert.id === selectedDesertId;
      const isSevere = desert.severity > 85;
      const color = isSevere ? '#f43f5e' : '#fbbf24';
      const glow = isSevere ? 'rgba(244, 63, 94, 0.4)' : 'rgba(251, 191, 36, 0.4)';

      const circle = L.circleMarker([desert.coordinates[0], desert.coordinates[1]], {
        radius: isSelected ? Math.max(12, (desert.severity / 100) * 45) : Math.max(12, (desert.severity / 100) * 30),
        fillColor: color,
        color: isSelected ? '#fff' : color,
        weight: isSelected ? 2 : 1,
        opacity: isSelected ? 0.8 : 0.3,
        fillOpacity: isSelected ? 0.3 : 0.1,
      });

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="width: 14px; height: 14px; background: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${glow};"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([desert.coordinates[0], desert.coordinates[1]], { icon });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onDesertClick) onDesertClick(desert);
        map.flyTo([desert.coordinates[0], desert.coordinates[1]], 11, { duration: 1.2 });
      });

      layerGroup.addLayer(circle);
      layerGroup.addLayer(marker);
    });

    // Render Hospitals (Nodes)
    hospitals.forEach((h) => {
      if (!h.coordinates) return;
      const color = '#10b981';
      const glow = 'rgba(16, 185, 129, 0.5)';

      const hIcon = L.divIcon({
        className: 'hospital-marker',
        html: `
          <div style="position: relative;">
            <div style="position: absolute; inset: -10px; background: ${glow}; filter: blur(8px); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px; border: 1.5px solid white; transform: rotate(45deg); position: relative; z-index: 1;"></div>
          </div>
          <style>
            @keyframes pulse {
              0% { transform: scale(0.8); opacity: 0.5; }
              50% { transform: scale(1.5); opacity: 0.2; }
              100% { transform: scale(0.8); opacity: 0.5; }
            }
          </style>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const hMarker = L.marker([h.coordinates[0], h.coordinates[1]], { icon: hIcon });
      hMarker.bindTooltip(`<div class="font-black uppercase text-[10px] tracking-widest p-1">${h.facilityName}</div>`, {
        direction: 'top',
        className: 'custom-tooltip glass-card border-none text-white'
      });
      layerGroup.addLayer(hMarker);
    });

  }, [deserts, hospitals, selectedDesertId, onDesertClick]);

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
            SYNC_GH_NODES_01
          </p>
          <button 
            onClick={(e) => { e.stopPropagation(); resetView(); }}
            className="mt-3 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest transition-all pointer-events-auto"
          >
            Reset View
          </button>
        </div>

        <div className="glass-card p-4 rounded-2xl border-white/5 backdrop-blur-xl space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Logic Layers</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 border border-white/20"></div>
              <span className="text-[10px] font-bold text-slate-300">Severe Desert</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-white/20 rotate-45"></div>
              <span className="text-[10px] font-bold text-slate-300">Active Hospital</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-white/20"></div>
              <span className="text-[10px] font-bold text-slate-300">Resource Gap Cluster</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalMap;

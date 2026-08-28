import { useState, useRef, useCallback } from 'react';
import { GameState, Country } from '../types';
import { getFlagEmoji } from '../data/flags';
import { COUNTRY_GEO, project } from '../data/worldMap';
import { formatMoney } from '../utils/calculations';
import { getResearchTierForGDP } from '../data/research';
import worldMapSrc from '../assets/world-map.png';

const MAP_W = 1000;
const MAP_H = 507; // world-map-2400px.png is 2400x1216 => ~1.974 aspect

type Props = {
  gameState: GameState;
  onSelectCountry: (id: string) => void;
};

type NodePos = { x: number; y: number };

function getNodeColor(country: Country): string {
  if (!country.alive) return '#3a1a1a';
  const totalTerrs = country.capturedTerritories.length;
  if (totalTerrs > 5) return '#1a3a1a';
  if (totalTerrs > 2) return '#1a2a3a';
  return 'transparent';
}

function getBorderColor(country: Country): string {
  if (!country.alive) return '#e55454';
  const totalTerrs = country.capturedTerritories.length;
  if (totalTerrs > 5) return '#3ecf8e';
  if (totalTerrs > 2) return '#4a7dff';
  return '#3a3d5e';
}

export default function WorldMap({ gameState, onSelectCountry }: Props) {
  const countries = Object.values(gameState.countries);

  const [positions, setPositions] = useState<Record<string, NodePos>>(() => {
    const pos: Record<string, NodePos> = {};
    for (const c of countries) {
      const geo = COUNTRY_GEO[c.name];
      pos[c.id] = geo ? project(geo.lat, geo.lon, MAP_W, MAP_H) : { x: MAP_W / 2, y: MAP_H / 2 };
    }
    return pos;
  });

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, countryId: string) => {
    e.stopPropagation();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const svgX = (e.clientX - svgRect.left) / zoom - pan.x;
    const svgY = (e.clientY - svgRect.top) / zoom - pan.y;
    setDragging(countryId);
    setDragOffset({
      x: svgX - positions[countryId].x,
      y: svgY - positions[countryId].y,
    });
  }, [positions, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    if (dragging) {
      const svgX = (e.clientX - svgRect.left) / zoom - pan.x;
      const svgY = (e.clientY - svgRect.top) / zoom - pan.y;
      setPositions(prev => ({
        ...prev,
        [dragging]: { x: svgX - dragOffset.x, y: svgY - dragOffset.y },
      }));
    } else if (panning) {
      const dx = (e.clientX - panStart.x) / zoom;
      const dy = (e.clientY - panStart.y) / zoom;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragging, dragOffset, panning, panStart, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(false);
  }, []);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    setPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setSelectedId(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(3, Math.max(0.3, z * delta)));
  }, []);

  const handleClick = useCallback((countryId: string) => {
    setSelectedId(countryId);
  }, []);

  const handleDoubleClick = useCallback((countryId: string) => {
    onSelectCountry(countryId);
  }, [onSelectCountry]);

  return (
    <div className="world-map-container">
      <div className="world-map-toolbar">
        <span className="text-muted">Drag countries to move | Scroll to zoom | Click to select | Double-click to open</span>
        <button className="btn btn-xs" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>RESET VIEW</button>
        <span className="text-muted">Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <svg
        ref={svgRef}
        className="world-map-svg"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onMouseDown={handleBackgroundMouseDown}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#0b1026" />

          {/* Real world map background */}
          <image
            href={worldMapSrc}
            x={0}
            y={0}
            width={MAP_W}
            height={MAP_H}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Graticule lines */}
          {[-120, -60, 0, 60, 120].map(lon => {
            const { x } = project(0, lon, MAP_W, MAP_H);
            return <line key={`m${lon}`} x1={x} y1={0} x2={x} y2={MAP_H} stroke="#12203a" strokeWidth={0.5} />;
          })}
          {[-60, 0, 60].map(lat => {
            const { y } = project(lat, 0, MAP_W, MAP_H);
            return <line key={`p${lat}`} x1={0} y1={y} x2={MAP_W} y2={y} stroke="#12203a" strokeWidth={0.5} />;
          })}

          {/* Connection lines for wars */}
          {Object.values(gameState.wars).filter(w => w.status === 'active').map(war => {
            const lines: JSX.Element[] = [];
            for (const aId of war.attackerIds) {
              for (const dId of war.defenderIds) {
                const aPos = positions[aId];
                const dPos = positions[dId];
                if (aPos && dPos) {
                  lines.push(
                    <line
                      key={`${war.id}-${aId}-${dId}`}
                      x1={aPos.x} y1={aPos.y}
                      x2={dPos.x} y2={dPos.y}
                      stroke="#e55454"
                      strokeWidth={1.5}
                      strokeDasharray="6,4"
                      opacity={0.6}
                    />
                  );
                }
              }
            }
            return lines;
          })}

          {/* Connection lines for treaties */}
          {Object.values(gameState.treaties || {}).map(treaty => {
            const lines: JSX.Element[] = [];
            for (let i = 0; i < treaty.countryIds.length; i++) {
              for (let j = i + 1; j < treaty.countryIds.length; j++) {
                const aPos = positions[treaty.countryIds[i]];
                const bPos = positions[treaty.countryIds[j]];
                if (aPos && bPos) {
                  lines.push(
                    <line
                      key={`treaty-${treaty.id}-${i}-${j}`}
                      x1={aPos.x} y1={aPos.y}
                      x2={bPos.x} y2={bPos.y}
                      stroke="#3ecf8e"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                      opacity={0.5}
                    />
                  );
                }
              }
            }
            return lines;
          })}

          {/* Country flag markers */}
          {countries.map(c => {
            const pos = positions[c.id];
            if (!pos) return null;
            const isSelected = selectedId === c.id;
            const isHovered = hoveredId === c.id;
            const border = getBorderColor(c);

            return (
              <g
                key={c.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={e => handleMouseDown(e, c.id)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={e => { e.stopPropagation(); handleClick(c.id); }}
                onDoubleClick={e => { e.stopPropagation(); handleDoubleClick(c.id); }}
                style={{ cursor: dragging === c.id ? 'grabbing' : 'grab' }}
                opacity={c.alive ? 1 : 0.55}
              >
                {/* Anchor pin */}
                <line x1={0} y1={0} x2={0} y2={14} stroke="#666d8a" strokeWidth={2} />
                <circle cx={0} cy={14} r={2.5} fill="#8890a4" />

                {/* Flag shield */}
                <circle
                  cx={0}
                  cy={0}
                  r={16}
                  fill="#111827"
                  stroke={isSelected ? '#4a7dff' : border}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
                />
                <circle cx={0} cy={0} r={13} fill={getNodeColor(c)} />
                <text x={0} y={7} textAnchor="middle" fontSize={16}>
                  {getFlagEmoji(c.name)}
                </text>

                {/* Territory count chip */}
                {c.capturedTerritories.length > 0 && (
                  <g>
                    <circle cx={14} cy={-14} r={8} fill="#3ecf8e" stroke="#0b1026" strokeWidth={1.5} />
                    <text x={14} y={-11} textAnchor="middle" fill="#000" fontSize={9} fontWeight={700}>
                      {c.capturedTerritories.length}
                    </text>
                  </g>
                )}

                {/* Name label */}
                <g transform={`translate(22, -4)`}>
                  <rect
                    x={-3}
                    y={-8}
                    width={94}
                    height={16}
                    rx={3}
                    fill="#0b1026"
                    stroke={border}
                    strokeWidth={0.8}
                    opacity={0.95}
                  />
                  <text x={44} y={4} textAnchor="middle" fill="#e6e9f5" fontSize={10} fontWeight={700}>
                    {getFlagEmoji(c.name)} {c.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {selectedId && gameState.countries[selectedId] && (
        <div className="world-map-info-panel">
          <div className="info-panel-header">
            <span>{getFlagEmoji(gameState.countries[selectedId].name)} {gameState.countries[selectedId].name}</span>
            <button className="btn btn-xs btn-accent" onClick={() => onSelectCountry(selectedId)}>OPEN</button>
            <button className="btn btn-xs btn-ghost" onClick={() => setSelectedId(null)}>X</button>
          </div>
          <div className="info-panel-body">
            <div>Player: {gameState.countries[selectedId].playerName || '—'}</div>
            <div>Leader: {gameState.countries[selectedId].leaderName || '—'}</div>
            <div>Money: {formatMoney(gameState.countries[selectedId].money)}</div>
            <div>MP: {formatMoney(gameState.countries[selectedId].mp)}</div>
            <div>GDP: {gameState.countries[selectedId].gdp}</div>
            <div>Tier: T{getResearchTierForGDP(gameState.countries[selectedId].gdp)}</div>
            <div>Territories: {gameState.countries[selectedId].capturedTerritories.length}</div>
            {gameState.countries[selectedId].capturedTerritories.length > 0 && (
              <div className="info-terr-list">
                {gameState.countries[selectedId].capturedTerritories.map(t => (
                  <span key={t.id} className={`research-tag ${t.status === 'integrated' ? 'completed' : 'available'}`}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

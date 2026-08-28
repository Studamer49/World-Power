import { useState, useRef, useCallback } from 'react';
import { GameState, Country } from '../types';
import { getFlagEmoji } from '../data/flags';
import { formatMoney } from '../utils/calculations';
import { getResearchTierForGDP } from '../data/research';

type Props = {
  gameState: GameState;
  onSelectCountry: (id: string) => void;
};

type NodePos = { x: number; y: number };

const DEFAULT_POSITIONS: Record<string, NodePos> = {
  'Sweden': { x: 480, y: 100 },
  'Mongolia': { x: 680, y: 160 },
  'USA': { x: 180, y: 180 },
  'China': { x: 680, y: 220 },
  'Russia': { x: 580, y: 100 },
  'Argentina': { x: 250, y: 400 },
  'Israel': { x: 530, y: 250 },
  'North Korea': { x: 750, y: 180 },
  'Australia': { x: 740, y: 380 },
  'Nigeria': { x: 460, y: 310 },
};

function getNodeColor(country: Country): string {
  if (!country.alive) return '#3a1a1a';
  const totalTerrs = country.capturedTerritories.length;
  if (totalTerrs > 5) return '#1a3a1a';
  if (totalTerrs > 2) return '#1a2a3a';
  return '#1e2030';
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
  const alive = countries.filter(c => c.alive);

  const [positions, setPositions] = useState<Record<string, NodePos>>(() => {
    const pos: Record<string, NodePos> = {};
    for (const c of countries) {
      pos[c.id] = DEFAULT_POSITIONS[c.name] || { x: 400 + Math.random() * 200, y: 200 + Math.random() * 200 };
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
          {/* Grid background */}
          {Array.from({ length: 50 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 50} x2={1000} y2={i * 50} stroke="#1e2030" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={500} stroke="#1e2030" strokeWidth={0.5} />
          ))}

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
                      opacity={0.5}
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
                      opacity={0.4}
                    />
                  );
                }
              }
            }
            return lines;
          })}

          {/* Country nodes */}
          {countries.map(c => {
            const pos = positions[c.id];
            if (!pos) return null;
            const isSelected = selectedId === c.id;
            const isHovered = hoveredId === c.id;
            const nodeW = 120;
            const nodeH = 70;

            return (
              <g
                key={c.id}
                transform={`translate(${pos.x - nodeW / 2}, ${pos.y - nodeH / 2})`}
                onMouseDown={e => handleMouseDown(e, c.id)}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={e => { e.stopPropagation(); handleClick(c.id); }}
                onDoubleClick={e => { e.stopPropagation(); handleDoubleClick(c.id); }}
                style={{ cursor: dragging === c.id ? 'grabbing' : 'grab' }}
              >
                <rect
                  width={nodeW}
                  height={nodeH}
                  rx={4}
                  fill={getNodeColor(c)}
                  stroke={isSelected ? '#4a7dff' : getBorderColor(c)}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  opacity={c.alive ? 1 : 0.5}
                />
                <text x={nodeW / 2} y={16} textAnchor="middle" fill="#c8cad8" fontSize={11} fontWeight={700}>
                  {getFlagEmoji(c.name)} {c.name}
                </text>
                <text x={nodeW / 2} y={32} textAnchor="middle" fill="#8890a4" fontSize={9}>
                  {formatMoney(c.money)} | {formatMoney(c.mp)} MP
                </text>
                <text x={nodeW / 2} y={44} textAnchor="middle" fill="#8890a4" fontSize={9}>
                  GDP: {c.gdp} | T{getResearchTierForGDP(c.gdp)}
                </text>
                <text x={nodeW / 2} y={56} textAnchor="middle" fill="#8890a4" fontSize={9}>
                  Terr: {c.capturedTerritories.length} | {c.alive ? 'ALIVE' : 'DEAD'}
                </text>
                {c.capturedTerritories.length > 0 && (
                  <circle cx={nodeW - 8} cy={8} r={6} fill="#3ecf8e" />
                )}
                {c.capturedTerritories.length > 0 && (
                  <text x={nodeW - 8} y={11} textAnchor="middle" fill="#000" fontSize={8} fontWeight={700}>
                    {c.capturedTerritories.length}
                  </text>
                )}
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

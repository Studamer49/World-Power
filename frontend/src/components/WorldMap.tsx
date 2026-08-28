import { useState } from 'react';
import {
  ComposableMap,
  Geography,
  Geographies,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { GameState, Country } from '../types';
import { getFlagEmoji } from '../data/flags';
import { COUNTRY_GEO } from '../data/worldMap';
import { formatMoney } from '../utils/calculations';
import { getResearchTierForGDP } from '../data/research';

import worldTopo from '../data/countries-110m.json';

import flSe from '../assets/flags/se.png';
import flMn from '../assets/flags/mn.png';
import flUs from '../assets/flags/us.png';
import flCn from '../assets/flags/cn.png';
import flRu from '../assets/flags/ru.png';
import flAr from '../assets/flags/ar.png';
import flIl from '../assets/flags/il.png';
import flKp from '../assets/flags/kp.png';
import flAu from '../assets/flags/au.png';
import flNg from '../assets/flags/ng.png';

const FLAG_IMAGES: Record<string, string> = {
  SE: flSe,
  MN: flMn,
  US: flUs,
  CN: flCn,
  RU: flRu,
  AR: flAr,
  IL: flIl,
  KP: flKp,
  AU: flAu,
  NG: flNg,
};

// Country name -> numeric ISO 3166-1 (matches world-atlas TopoJSON ids)
const NUMERIC_ISO: Record<string, number> = {
  Sweden: 752,
  Mongolia: 496,
  USA: 840,
  China: 156,
  Russia: 643,
  Argentina: 32,
  Israel: 376,
  'North Korea': 408,
  Australia: 36,
  Nigeria: 566,
};

const ISO: Record<string, string> = {
  Sweden: 'SE',
  Mongolia: 'MN',
  USA: 'US',
  China: 'CN',
  Russia: 'RU',
  Argentina: 'AR',
  Israel: 'IL',
  'North Korea': 'KP',
  Australia: 'AU',
  Nigeria: 'NG',
};

type Props = {
  gameState: GameState;
  onSelectCountry: (id: string) => void;
};

function fillFor(c: Country | undefined, selected: boolean, hovered: boolean): string {
  if (!c) return '#2a3b52';
  if (!c.alive) return '#5a2b2b';
  const base = selected ? '#3d6bd6' : hovered ? '#3f5f9e' : '#3f8f5a';
  return base;
}

function strokeColor(c: Country | undefined, selected: boolean): string {
  if (!c) return '#4a5a75';
  if (selected) return '#ffd54a';
  if (!c.alive) return '#e55454';
  return '#6b7d9e';
}

export default function WorldMap({ gameState, onSelectCountry }: Props) {
  const countriesById = Object.fromEntries(Object.values(gameState.countries).map(c => [c.id, c]));
  const nameById: Record<string, string> = {};
  for (const c of Object.values(gameState.countries)) nameById[c.id] = c.name;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredNumeric, setHoveredNumeric] = useState<number | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  // Find which country owns a given numeric ISO geography id
  const ownerOf = (numericId: number): Country | undefined => {
    for (const c of Object.values(gameState.countries)) {
      if (NUMERIC_ISO[c.name] === numericId) return c;
    }
    return undefined;
  };

  const resolveHover = (name: string) => {
    const match = (a: string) => a.trim().toLowerCase() === name.trim().toLowerCase();
    const gameCountry = Object.values(gameState.countries).find(c => match(c.name));
    let claim: { owner: Country; territoryId: string; ownerId: string; status: string } | null = null;
    for (const c of Object.values(gameState.countries)) {
      if (!c.alive) continue;
      const t = (c.capturedTerritories || []).find(t => match(t.name));
      if (t) { claim = { owner: c, territoryId: t.id, ownerId: c.id, status: t.status }; break; }
    }
    if (!claim) {
      for (const c of Object.values(gameState.countries)) {
        if (!c.alive) continue;
        for (const t of c.capturedTerritories || []) {
          if (NUMERIC_ISO[t.name] === NUMERIC_ISO[name]) { claim = { owner: c, territoryId: t.id, ownerId: c.id, status: t.status }; break; }
        }
        if (claim) break;
      }
    }
    const treaty = claim
      ? Object.values(gameState.treaties || {}).find(tr => tr.territoryId === claim!.territoryId && tr.territoryOwnerId === claim!.ownerId)
      : undefined;
    const conquered = !!gameCountry && !gameCountry.alive;
    const possession = claim ? [{
      countryId: claim.ownerId,
      name: claim.owner.name,
      flag: claim.owner.flag,
      percent: treaty ? Math.max(0, 100 - treaty.splits.filter(s => s.countryId !== claim!.ownerId).reduce((a, s) => a + s.percent, 0)) : 100,
    }, ...(treaty ? treaty.splits.filter(s => s.countryId !== claim!.ownerId).map(s => ({
      countryId: s.countryId,
      name: gameState.countries[s.countryId]?.name || '???',
      flag: gameState.countries[s.countryId]?.flag || '',
      percent: s.percent,
    })) : [])] : [];
    return { gameCountry, claim, treaty, conquered, possession };
  };

  const hoverInfo = hoveredName ? resolveHover(hoveredName) : null;

  const resetView = () => {
    setZoom(1);
    setCenter([0, 0]);
  };

  const selected = selectedId ? countriesById[selectedId] : undefined;

  return (
    <div className="world-map-container">
      <div className="world-map-toolbar">
        <span className="text-muted">Drag to pan | Scroll to zoom | Click to select | Click ocean to deselect | Double-click to open</span>
        <button className="btn btn-xs" onClick={resetView}>RESET VIEW</button>
        <span className="text-muted">Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <ComposableMap
        projection="geoEquirectangular"
        width={1000}
        height={505}
        style={{ width: '100%', height: '100%' }}
        projectionConfig={{ scale: 150 }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={0.5}
          maxZoom={4}
          onMoveEnd={({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) => {
            setCenter(coordinates);
            setZoom(z);
          }}
        >
          <rect width={1000} height={505} fill="#0b1026" style={{ cursor: 'grab' }} onClick={() => setSelectedId(null)} />
          <Geographies geography={worldTopo}>
            {({ geographies }) =>
              geographies.map(geo => {
                const title = (geo.properties as any)?.name as string | undefined;
                const numericId = Number((geo as any).id);
                const owner = ownerOf(numericId);
                const isSelected = owner && owner.id === selectedId;
                const isHovered = hoveredNumeric === numericId;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillFor(owner, !!isSelected, isHovered)}
                    stroke={strokeColor(owner, !!isSelected)}
                    strokeWidth={isSelected ? 1 : 0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: owner ? '#4a9ad6' : '#34506e' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => { setHoveredNumeric(numericId); setHoveredName(title || null); }}
                    onMouseLeave={() => { setHoveredNumeric(null); setHoveredName(null); }}
                    onClick={(e) => {
                      if (owner) setSelectedId(owner.id);
                    }}
                    onDoubleClick={(e) => {
                      if (owner) onSelectCountry(owner.id);
                    }}
                  >
                    {title && <title>{title}</title>}
                  </Geography>
                );
              })
            }
          </Geographies>

          {/* Flag markers on top of countries */}
          {Object.values(gameState.countries).map(c => {
            const geo = COUNTRY_GEO[c.name];
            if (!geo) return null;
            const isSelected = selectedId === c.id;
            const isHovered = hoveredNumeric === NUMERIC_ISO[c.name];
            const img = FLAG_IMAGES[ISO[c.name]];
            const base = isSelected || isHovered ? 40 : 32;
            const size = base / zoom;
            return (
              <Marker key={c.id} coordinates={[geo.lon, geo.lat]}>
                <g
                  style={{ cursor: 'pointer', opacity: c.alive ? 1 : 0.6 }}
                  onClick={() => setSelectedId(c.id)}
                  onDoubleClick={() => onSelectCountry(c.id)}
                >
                  <circle r={size / 2 + 4} fill="rgba(11,16,38,0.55)" stroke="#ffffff" strokeWidth={1.2} />
                  {img ? (
                    <image
                      href={img}
                      x={-size}
                      y={-size / 2}
                      width={size * 2}
                      height={size}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : (
                    <text y={6} textAnchor="middle" fontSize={20}>
                      {getFlagEmoji(c.name)}
                    </text>
                  )}
                  {!c.alive && (
                    <text y={-size / 2 - 6} textAnchor="middle" fontSize={12} fill="#e55454" fontWeight={700}>
                      ✕
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {selected && (
        <div className="world-map-info-panel">
          <div className="info-panel-header">
            <span>{getFlagEmoji(selected.name)} {selected.name}</span>
            <button className="btn btn-xs btn-accent" onClick={() => onSelectCountry(selected.id)}>OPEN</button>
            <button className="btn btn-xs btn-ghost" onClick={() => setSelectedId(null)}>X</button>
          </div>
          <div className="info-panel-body">
            <div>Player: {selected.playerName || '—'}</div>
            <div>Leader: {selected.leaderName || '—'}</div>
            <div>Money: {formatMoney(selected.money)}</div>
            <div>MP: {formatMoney(selected.mp)}</div>
            <div>GDP: {selected.gdp}</div>
            <div>Tier: T{getResearchTierForGDP(selected.gdp)}</div>
            <div>Territories: {selected.capturedTerritories.length}</div>
            {selected.capturedTerritories.length > 0 && (
              <div className="info-terr-list">
                {selected.capturedTerritories.map(t => (
                  <span key={t.id} className={`research-tag ${t.status === 'integrated' ? 'completed' : 'available'}`}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {hoverInfo && (
        <div className="world-map-hover-popup">
          <div className="hover-popup-title">
            {hoverInfo.gameCountry ? `${hoverInfo.gameCountry.flag} ` : ''}{hoverInfo.gameCountry?.name || hoveredName}
          </div>
          <div className={hoverInfo.conquered || hoverInfo.claim ? 'text-danger' : 'text-success'}>
            {hoverInfo.conquered || hoverInfo.claim ? 'CONQUERED' : 'NOT CONQUERED'}
          </div>
          {hoverInfo.claim ? (
            <div className="hover-popup-possession">
              <div className="hover-popup-subtitle">POSSESSION</div>
              {hoverInfo.possession.map(p => (
                <div key={p.countryId} className="hover-popup-pos-row">
                  <span>{p.flag} {p.name}</span>
                  <span>{p.percent}%</span>
                </div>
              ))}
              <div className="hover-popup-status">Status: {hoverInfo.claim!.status.toUpperCase()}</div>
            </div>
          ) : hoverInfo.gameCountry && !hoverInfo.gameCountry.alive && (
            <div className="hover-popup-status">Eliminated — territory open</div>
          )}
        </div>
      )}
    </div>
  );
}

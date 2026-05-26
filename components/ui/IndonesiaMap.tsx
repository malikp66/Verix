'use client';

import React, { useState, useRef, useEffect } from 'react';

// Define the shape of paths from JSON
interface PathData {
  d: string;
  title: string;
  id: string;
}

export interface ThreatMarker {
  id: string;
  longitude: number;
  latitude: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  label?: string;
  weight?: number; // Decay weight between 0.35 and 1.0
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface IndonesiaMapProps {
  theme: 'green' | 'blue';
  markers?: ThreatMarker[];
  className?: string;
  onHoverProvince?: (provinceName: string | null) => void;
  provinceScores?: Record<string, { count: number; score: number }>;
}

// Bounding box for geo-calibrated indonesia.svg
// mapsvg:geoViewBox="95.220250 7.356505 141.009728 -10.946766"
const LONG_MIN = 95.220250;
const LONG_MAX = 141.009728;
const LAT_MAX = 7.356505;
const LAT_MIN = -10.946766;

const WIDTH = 792.54596;
const HEIGHT = 316.66394;

const scaleX = WIDTH / (LONG_MAX - LONG_MIN);
const scaleY = HEIGHT / (LAT_MAX - LAT_MIN);

export function getXYCoords(longitude: number, latitude: number): [number, number] {
  const x = (longitude - LONG_MIN) * scaleX;
  const y = (LAT_MAX - latitude) * scaleY;
  return [x, y];
}

// Normalise province path names to match the threat feed
export function normalizeProvinceName(title: string): string {
  if (title === "Jakarta Raya") return "Jakarta";
  return title;
}

export function IndonesiaMap({ theme, markers = [], className = '', onHoverProvince, provinceScores }: IndonesiaMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<{ title: string; x: number; y: number } | null>(null);
  const [pathsData, setPathsData] = useState<PathData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/indonesia_paths.json')
      .then(res => res.json())
      .then(data => setPathsData(data))
      .catch(() => setPathsData([]));
  }, []);

  // Styling properties depending on theme and threat severity score
  const getProvinceColors = (isIndonesian: boolean, isHovered: boolean, provinceTitle: string) => {
    if (!isIndonesian) {
      // Muted background shapes for neighboring countries
      if (theme === 'green') {
        return {
          fill: '#050507',
          stroke: '#161D27',
          strokeWidth: 0.5,
        };
      } else {
        return {
          fill: '#050507',
          stroke: '#161D27',
          strokeWidth: 0.4,
        };
      }
    }

    // Lookup score if provided
    const normName = normalizeProvinceName(provinceTitle);
    const stats = provinceScores?.[normName];

    if (stats && stats.score > 0) {
      const score = stats.score;
      if (score >= 7) {
        // Critical
        return {
          fill: '#5b1e1e',
          stroke: '#ef4444',
          strokeWidth: isHovered ? 1.75 : 1.25,
          glowColor: '#ef4444'
        };
      } else if (score >= 5) {
        // High
        return {
          fill: '#452c1e',
          stroke: '#f59e0b',
          strokeWidth: isHovered ? 1.5 : 1,
          glowColor: '#f59e0b'
        };
      } else if (score >= 3) {
        // Medium
        const isGreen = theme === 'green';
        return {
          fill: isGreen ? '#133527' : '#1a4060',
          stroke: isGreen ? '#10b981' : '#06b6d4',
          strokeWidth: isHovered ? 1.5 : 1,
          glowColor: isGreen ? '#10b981' : '#06b6d4'
        };
      } else {
        // Low
        const isGreen = theme === 'green';
        return {
          fill: isGreen ? '#0d2118' : '#162a3f',
          stroke: isGreen ? '#059669' : '#3b82f6',
          strokeWidth: isHovered ? 1.25 : 0.75,
          glowColor: isGreen ? '#059669' : '#3b82f6'
        };
      }
    }

    if (theme === 'green') {
      return {
        fill: isHovered ? '#12241b' : '#080d0a',
        stroke: '#16503c',
        strokeWidth: isHovered ? 1.25 : 0.75,
      };
    } else {
      return {
        fill: isHovered ? '#17263b' : '#121b28',
        stroke: '#163454',
        strokeWidth: isHovered ? 1.25 : 0.75,
      };
    }
  };

  const handlePathMouseMove = (e: React.MouseEvent<SVGPathElement>, path: PathData) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top - 12; // place slightly above cursor
    setHoveredProvince({ title: path.title, x, y });
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full select-none ${className}`}>
      {/* Interactive Map SVG */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full outline-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Render Map Paths */}
        {(pathsData as PathData[]).map((path) => {
          const isIndonesian = path.id.startsWith('ID-');
          const isHovered = hoveredProvince?.title === path.title;
          const styles = getProvinceColors(isIndonesian, isHovered, path.title);
          
          let filterVal = 'none';
          if (isIndonesian) {
            const normName = normalizeProvinceName(path.title);
            const stats = provinceScores?.[normName];
            
            if (isHovered) {
              const glowColor = (styles as any).glowColor || (theme === 'green' ? '#B6FF3B' : '#22D3EE');
              filterVal = `drop-shadow(0 0 6px ${glowColor}c0)`;
            } else if (stats && stats.score >= 7) {
              filterVal = `drop-shadow(0 0 4px rgba(239, 68, 68, 0.45))`;
            } else if (stats && stats.score >= 5) {
              filterVal = `drop-shadow(0 0 3px rgba(245, 158, 11, 0.25))`;
            }
          }

          return (
            <path
              key={path.id}
              d={path.d}
              id={path.id}
              fill={styles.fill}
              stroke={styles.stroke}
              strokeWidth={styles.strokeWidth}
              className={`transition-all duration-300 ${
                isIndonesian ? 'cursor-pointer hover:opacity-90' : 'pointer-events-none'
              }`}
              style={{
                filter: filterVal,
              }}
              onMouseEnter={(e) => {
                if (isIndonesian) {
                  handlePathMouseMove(e, path);
                  onHoverProvince?.(path.title);
                }
              }}
              onMouseMove={(e) => {
                if (isIndonesian) {
                  handlePathMouseMove(e, path);
                }
              }}
              onMouseLeave={() => {
                if (isIndonesian) {
                  setHoveredProvince(null);
                  onHoverProvince?.(null);
                }
              }}
            />
          );
        })}

        {/* Render Threat Markers */}
        {markers.map((marker) => {
          const [x, y] = getXYCoords(marker.longitude, marker.latitude);
          const weight = marker.weight ?? 1.0;
          
          // Style markers depending on severity
          let markerColor = '#ffd03b';
          let ringColor = 'rgba(255,208,59,0.2)';
          if (marker.severity === 'CRITICAL') {
            markerColor = '#ff4f4f';
            ringColor = 'rgba(255,79,79,0.3)';
          } else if (marker.severity === 'HIGH') {
            markerColor = '#ff9a3c';
            ringColor = 'rgba(255,154,60,0.25)';
          }

          return (
            <g
              key={marker.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer select-none group"
              onMouseEnter={marker.onMouseEnter}
              onMouseLeave={marker.onMouseLeave}
              onClick={marker.onClick}
            >
              {/* Outer static ring */}
              <circle
                r={12 * weight}
                fill="none"
                stroke={markerColor}
                strokeWidth={1}
                style={{
                  opacity: 0.25 * weight,
                }}
              />
              {/* Inner static ring */}
              <circle
                r={7 * weight}
                fill={markerColor}
                style={{
                  opacity: 0.15 * weight,
                }}
              />
              {/* Core threat node */}
              <circle
                r={4 * weight}
                fill={markerColor}
                stroke="#030303"
                strokeWidth={1}
                className="transition-transform duration-200 group-hover:scale-125"
                style={{ opacity: weight }}
              />

              {/* Optional label */}
              {marker.label && (
                <text
                  textAnchor="middle"
                  y={-12}
                  className="font-mono text-[9px] pointer-events-none select-none font-bold tracking-tight"
                  style={{
                    fill: markerColor,
                    textShadow: '0px 1px 2px rgba(0,0,0,0.9)',
                  }}
                >
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Province Glassmorphic Info Card Tooltip */}
      {hoveredProvince && (() => {
        const normName = normalizeProvinceName(hoveredProvince.title);
        const stats = provinceScores?.[normName] || { count: 0, score: 0 };
        
        let riskLabel = "CLEAN / LOW";
        let badgeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
        if (stats.score >= 7) {
          riskLabel = "CRITICAL";
          badgeColor = "text-red-400 border-red-500/20 bg-red-500/10";
        } else if (stats.score >= 5) {
          riskLabel = "HIGH";
          badgeColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";
        } else if (stats.score >= 3) {
          riskLabel = "MEDIUM";
          badgeColor = theme === 'green'
            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
            : "text-cyan-400 border-cyan-500/20 bg-cyan-500/10";
        } else if (stats.score > 0) {
          riskLabel = "LOW";
          badgeColor = theme === 'green'
            ? "text-emerald-500/80 border-emerald-500/10 bg-emerald-500/5"
            : "text-blue-400 border-blue-500/20 bg-blue-500/10";
        }

        return (
          <div
            className="absolute z-35 pointer-events-none p-3 rounded-xl bg-neutral-900/95 border border-neutral-800/80 text-[10px] font-mono shadow-2xl backdrop-blur-md -translate-x-1/2 -translate-y-full flex flex-col gap-1.5 min-w-[170px] transition-all duration-75"
            style={{
              left: hoveredProvince.x,
              top: hoveredProvince.y - 12,
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stats.score > 0 ? 'animate-pulse' : ''}`} style={{ backgroundColor: stats.score >= 7 ? '#ef4444' : stats.score >= 5 ? '#f59e0b' : stats.score >= 3 ? (theme === 'green' ? '#10b981' : '#06b6d4') : '#10b981' }} />
              <span className="font-bold text-neutral-200 tracking-wider truncate max-w-[140px]">{hoveredProvince.title.toUpperCase()}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Active Threats:</span>
                <span className="text-neutral-200 font-bold">{stats.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Risk Score:</span>
                <span className="text-neutral-200 font-bold">{stats.score}</span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-neutral-500">Level:</span>
                <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${badgeColor}`}>{riskLabel}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

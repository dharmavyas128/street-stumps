import { useTheme } from '../hooks/useTheme';

// Aerial top-view cricket stadium — decorative backdrop behind the format cards.
// Renders a floodlit night stadium in dark mode and a sunlit day ground in light mode.
export default function StadiumBackdrop() {
  const isLight = useTheme();

  const C = isLight ? {
    standsFill:   '#D4DCE8',
    vignetteStop: '#EEF2F7',
    crowdA:       'rgba(71,85,105,0.48)',
    crowdB:       'rgba(71,85,105,0.28)',
    crowdGreen:   '#16A34A',
    crowdGold:    '#D97706',
    crowdBlue:    '#3B82F6',
    tierStroke:   'rgba(15,23,42,0.03)',
    walkway:      'rgba(255,255,255,0.88)',
    field0c:      '#22C55E', field0o: '0.52',
    field50c:     '#16A34A', field50o: '0.36',
    field100c:    '#15803D', field100o: '0.16',
    mowStroke:    'rgba(22,163,74,0.08)',
    floodO:       '0.10',
    boundary:     'rgba(15,23,42,0.18)',
    pitch:        'rgba(210,180,110,0.28)',
    pitchStroke:  'rgba(15,23,42,0.10)',
    crease:       'rgba(15,23,42,0.38)',
    stump:        'rgba(15,23,42,0.55)',
    batter:       'rgba(15,23,42,0.65)',
    keeper:       'rgba(180,83,9,0.78)',
    bowler:       'rgba(22,163,74,0.78)',
    fielder:      'rgba(15,23,42,0.32)',
    sightScreen:  'rgba(255,255,255,0.92)',
    towerGlow:    'rgba(100,116,139,0.08)',
    towerBody:    'rgba(100,116,139,0.50)',
    towerCentre:  'rgba(71,85,105,0.70)',
  } : {
    standsFill:   '#101E2D',
    vignetteStop: '#0B0F1A',
    crowdA:       'rgba(255,255,255,0.72)',
    crowdB:       'rgba(255,255,255,0.50)',
    crowdGreen:   '#22C55E',
    crowdGold:    '#FCD34D',
    crowdBlue:    '#93C5FD',
    tierStroke:   'rgba(255,255,255,0.04)',
    walkway:      'rgba(0,0,0,0.35)',
    field0c:      '#16A34A', field0o: '0.50',
    field50c:     '#15803D', field50o: '0.34',
    field100c:    '#14532D', field100o: '0.14',
    mowStroke:    'rgba(34,197,94,0.07)',
    floodO:       '0.18',
    boundary:     'rgba(255,255,255,0.22)',
    pitch:        'rgba(240,218,170,0.28)',
    pitchStroke:  'rgba(255,255,255,0.14)',
    crease:       'rgba(255,255,255,0.45)',
    stump:        'rgba(255,255,255,0.60)',
    batter:       'rgba(255,255,255,0.70)',
    keeper:       'rgba(253,224,71,0.80)',
    bowler:       'rgba(147,197,253,0.75)',
    fielder:      'rgba(255,255,255,0.45)',
    sightScreen:  'rgba(255,255,255,0.18)',
    towerGlow:    'rgba(255,248,195,0.10)',
    towerBody:    'rgba(255,248,195,0.80)',
    towerCentre:  'rgba(255,255,240,0.95)',
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 340"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <pattern id="sd-crowd-a" x="0" y="0" width="8" height="7" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="3.5" r="1.4" fill={C.crowdA} />
        </pattern>
        <pattern id="sd-crowd-b" x="4" y="3.5" width="8" height="7" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="3.5" r="1.1" fill={C.crowdB} />
        </pattern>
        <pattern id="sd-crowd-green" x="0" y="0" width="8" height="7" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="3.5" r="1.3" fill={C.crowdGreen} fillOpacity="0.72" />
        </pattern>
        <pattern id="sd-crowd-gold" x="0" y="0" width="8" height="7" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="3.5" r="1.3" fill={C.crowdGold} fillOpacity="0.68" />
        </pattern>
        <pattern id="sd-crowd-blue" x="0" y="0" width="8" height="7" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="3.5" r="1.2" fill={C.crowdBlue} fillOpacity="0.55" />
        </pattern>

        <mask id="sd-stands-mask">
          <ellipse cx="200" cy="170" rx="196" ry="161" fill="white" />
          <ellipse cx="200" cy="170" rx="138" ry="113" fill="black" />
        </mask>

        <radialGradient id="sd-field" cx="50%" cy="48%" r="52%">
          <stop offset="0%"   stopColor={C.field0c}   stopOpacity={C.field0o} />
          <stop offset="50%"  stopColor={C.field50c}  stopOpacity={C.field50o} />
          <stop offset="100%" stopColor={C.field100c} stopOpacity={C.field100o} />
        </radialGradient>
        <radialGradient id="sd-flood-centre" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFDF0" stopOpacity={C.floodO} />
          <stop offset="100%" stopColor="#FFFDF0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sd-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="68%"  stopColor={C.vignetteStop} stopOpacity="0" />
          <stop offset="100%" stopColor={C.vignetteStop} stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Outer stands base */}
      <ellipse cx="200" cy="170" rx="196" ry="161" fill={C.standsFill} />

      {/* Crowd dots */}
      <rect x="0" y="0" width="400" height="340" fill="url(#sd-crowd-a)" mask="url(#sd-stands-mask)" />
      <rect x="0" y="0" width="400" height="340" fill="url(#sd-crowd-b)" mask="url(#sd-stands-mask)" opacity="0.6" />

      {/* Coloured supporter sections */}
      <ellipse cx="295" cy="52"  rx="72" ry="44" fill="url(#sd-crowd-green)" mask="url(#sd-stands-mask)" opacity="0.40" />
      <ellipse cx="108" cy="292" rx="68" ry="40" fill="url(#sd-crowd-gold)"  mask="url(#sd-stands-mask)" opacity="0.35" />
      <ellipse cx="30"  cy="165" rx="38" ry="65" fill="url(#sd-crowd-blue)"  mask="url(#sd-stands-mask)" opacity="0.28" />
      <ellipse cx="372" cy="160" rx="38" ry="60" fill="url(#sd-crowd-gold)"  mask="url(#sd-stands-mask)" opacity="0.22" />

      {/* Stand tier lines */}
      {[0,1,2,3,4,5,6].map((i) => (
        <ellipse key={i}
          cx="200" cy="170"
          rx={141 + i * 8} ry={116 + i * 7}
          fill="none" stroke={C.tierStroke} strokeWidth="5"
        />
      ))}

      {/* Walkway dividers */}
      <path d="M140,54 Q200,32 260,54"    fill="none" stroke={C.walkway} strokeWidth="3" />
      <path d="M140,286 Q200,308 260,286"  fill="none" stroke={C.walkway} strokeWidth="3" />
      <path d="M16,120 Q4,170 16,220"     fill="none" stroke={C.walkway} strokeWidth="3" />
      <path d="M384,120 Q396,170 384,220" fill="none" stroke={C.walkway} strokeWidth="3" />

      {/* Outfield */}
      <ellipse cx="200" cy="170" rx="138" ry="113" fill="url(#sd-field)" />

      {/* Mowing stripes */}
      {[0,1,2,3,4,5].map((i) => (
        <ellipse key={i}
          cx="200" cy="170"
          rx={138 - i * 20} ry={113 - i * 17}
          fill="none" stroke={C.mowStroke} strokeWidth="9"
        />
      ))}

      {/* Centre wash */}
      <ellipse cx="200" cy="170" rx="90" ry="72" fill="url(#sd-flood-centre)" />

      {/* Boundary rope */}
      <ellipse cx="200" cy="170" rx="138" ry="113"
               fill="none" stroke={C.boundary}
               strokeWidth="1.5" strokeDasharray="5 4" />

      {/* Pitch strip */}
      <rect x="193" y="114" width="14" height="112" rx="2" fill={C.pitch} />
      <rect x="192" y="114" width="16" height="112" rx="2" fill="none" stroke={C.pitchStroke} strokeWidth="0.8" />
      {/* Creases */}
      <rect x="188" y="130" width="24" height="1.5" rx="0.75" fill={C.crease} />
      <rect x="188" y="209" width="24" height="1.5" rx="0.75" fill={C.crease} />
      <rect x="187" y="136" width="26" height="0.8" rx="0.4"  fill={C.crease} opacity="0.55" />
      <rect x="187" y="204" width="26" height="0.8" rx="0.4"  fill={C.crease} opacity="0.55" />

      {/* Stumps */}
      {[-3.5, 0, 3.5].map((dx) => (
        <rect key={`t${dx}`} x={199.5 + dx} y={114} width={1} height={3} rx="0.5" fill={C.stump} />
      ))}
      {[-3.5, 0, 3.5].map((dx) => (
        <rect key={`b${dx}`} x={199.5 + dx} y={224} width={1} height={3} rx="0.5" fill={C.stump} />
      ))}

      {/* Players */}
      <circle cx="200" cy="140" r="2.6" fill={C.batter} />
      <circle cx="200" cy="202" r="2.6" fill={C.batter} />
      <circle cx="200" cy="232" r="2.4" fill={C.keeper} />
      <circle cx="200" cy="106" r="2.4" fill={C.bowler} />
      {[[154,152],[250,156],[172,214],[230,210],[142,178],[261,184],[200,270],[165,250],[236,248]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="2.0" fill={C.fielder} />
      ))}

      {/* Sight screens */}
      <rect x="184" y="94"  width="32" height="10" rx="2" fill={C.sightScreen} />
      <rect x="184" y="236" width="32" height="10" rx="2" fill={C.sightScreen} />

      {/* Floodlight towers */}
      {[[76,46],[324,46],[76,294],[324,294]].map(([cx,cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="20" fill={C.towerGlow} />
          <circle cx={cx} cy={cy} r="5"  fill={C.towerBody} />
          <circle cx={cx} cy={cy} r="2.5" fill={C.towerCentre} />
        </g>
      ))}

      {/* Outer vignette — blends stadium edge into app background */}
      <ellipse cx="200" cy="170" rx="200" ry="165" fill="url(#sd-vignette)" />
    </svg>
  );
}

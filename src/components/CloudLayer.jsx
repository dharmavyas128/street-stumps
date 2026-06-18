import { useTheme } from '../hooks/useTheme';

export default function CloudLayer() {
  const isLight = useTheme();
  if (!isLight) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        maskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.85) 28%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 76%, transparent 92%)',
        WebkitMaskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.85) 28%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 76%, transparent 92%)',
      }}
    >
      <svg
        viewBox="0 0 390 520"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMin slice"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'blur(10px)',
          opacity: 0.88,
          transform: 'translate3d(calc(var(--sy, 0) * -0.01px), calc(var(--sy, 0) * -0.02px), 0)',
          willChange: 'transform',
        }}
      >
        {/* Large cloud — left top */}
        <g className="cloud-a">
          <ellipse cx="55"  cy="88" rx="52" ry="26" fill="#A8C8E8" opacity="0.75"/>
          <ellipse cx="34"  cy="74" rx="30" ry="26" fill="#A8C8E8" opacity="0.70"/>
          <ellipse cx="62"  cy="64" rx="38" ry="28" fill="#A8C8E8" opacity="0.72"/>
          <ellipse cx="90"  cy="76" rx="26" ry="20" fill="#A8C8E8" opacity="0.68"/>
        </g>

        {/* Large cloud — center top */}
        <g className="cloud-b">
          <ellipse cx="195" cy="74" rx="62" ry="25" fill="#A8C8E8" opacity="0.76"/>
          <ellipse cx="168" cy="61" rx="36" ry="28" fill="#A8C8E8" opacity="0.72"/>
          <ellipse cx="200" cy="49" rx="44" ry="30" fill="#A8C8E8" opacity="0.76"/>
          <ellipse cx="228" cy="63" rx="30" ry="22" fill="#A8C8E8" opacity="0.70"/>
        </g>

        {/* Large cloud — right top */}
        <g className="cloud-c">
          <ellipse cx="334" cy="82" rx="52" ry="24" fill="#A8C8E8" opacity="0.74"/>
          <ellipse cx="312" cy="69" rx="28" ry="22" fill="#A8C8E8" opacity="0.70"/>
          <ellipse cx="338" cy="59" rx="36" ry="26" fill="#A8C8E8" opacity="0.74"/>
          <ellipse cx="362" cy="71" rx="24" ry="18" fill="#A8C8E8" opacity="0.68"/>
        </g>

        {/* Small cloud — upper centre-left */}
        <g className="cloud-d">
          <ellipse cx="130" cy="38" rx="34" ry="15" fill="#A8C8E8" opacity="0.65"/>
          <ellipse cx="114" cy="30" rx="20" ry="15" fill="#A8C8E8" opacity="0.62"/>
          <ellipse cx="136" cy="22" rx="26" ry="17" fill="#A8C8E8" opacity="0.65"/>
          <ellipse cx="154" cy="31" rx="18" ry="12" fill="#A8C8E8" opacity="0.60"/>
        </g>

        {/* Small cloud — upper right */}
        <g className="cloud-e">
          <ellipse cx="278" cy="30" rx="30" ry="13" fill="#A8C8E8" opacity="0.63"/>
          <ellipse cx="260" cy="23" rx="18" ry="13" fill="#A8C8E8" opacity="0.60"/>
          <ellipse cx="282" cy="17" rx="22" ry="14" fill="#A8C8E8" opacity="0.63"/>
          <ellipse cx="300" cy="24" rx="16" ry="11" fill="#A8C8E8" opacity="0.58"/>
        </g>

        {/* Mid cloud — left (Quick Match area) */}
        <g className="cloud-f">
          <ellipse cx="38"  cy="228" rx="46" ry="19" fill="#A8C8E8" opacity="0.56"/>
          <ellipse cx="16"  cy="216" rx="26" ry="19" fill="#A8C8E8" opacity="0.52"/>
          <ellipse cx="44"  cy="207" rx="34" ry="21" fill="#A8C8E8" opacity="0.55"/>
          <ellipse cx="74"  cy="219" rx="24" ry="16" fill="#A8C8E8" opacity="0.50"/>
        </g>

        {/* Mid cloud — right (Quick Match area) */}
        <g className="cloud-g">
          <ellipse cx="354" cy="218" rx="44" ry="18" fill="#A8C8E8" opacity="0.54"/>
          <ellipse cx="332" cy="207" rx="25" ry="18" fill="#A8C8E8" opacity="0.50"/>
          <ellipse cx="357" cy="198" rx="32" ry="20" fill="#A8C8E8" opacity="0.53"/>
          <ellipse cx="384" cy="210" rx="20" ry="14" fill="#A8C8E8" opacity="0.48"/>
        </g>

        {/* Lower cloud — left (My Players area) */}
        <g className="cloud-h">
          <ellipse cx="28"  cy="342" rx="40" ry="16" fill="#A8C8E8" opacity="0.42"/>
          <ellipse cx="8"   cy="331" rx="23" ry="16" fill="#A8C8E8" opacity="0.39"/>
          <ellipse cx="34"  cy="323" rx="30" ry="18" fill="#A8C8E8" opacity="0.41"/>
          <ellipse cx="60"  cy="334" rx="20" ry="13" fill="#A8C8E8" opacity="0.37"/>
        </g>

        {/* Lower cloud — right (My Players area) */}
        <g className="cloud-i">
          <ellipse cx="364" cy="332" rx="38" ry="15" fill="#A8C8E8" opacity="0.40"/>
          <ellipse cx="344" cy="321" rx="22" ry="15" fill="#A8C8E8" opacity="0.37"/>
          <ellipse cx="368" cy="313" rx="28" ry="17" fill="#A8C8E8" opacity="0.40"/>
          <ellipse cx="390" cy="324" rx="17" ry="12" fill="#A8C8E8" opacity="0.35"/>
        </g>
      </svg>
    </div>
  );
}

import { buildSvg, svgToDataUrl, parseConfig } from '../avatars';

/**
 * Renders a DiceBear avataaars SVG as an <img>.
 * Accepts config as a JSON string (from Supabase) or a plain object (live builder).
 */
export default function DiceBearAvatar({ config, size = 40, className = '' }) {
  const parsed = config && typeof config === 'object' ? config : parseConfig(config);
  if (!parsed) return null;
  const svg = buildSvg(parsed);
  if (!svg) return null;
  return (
    <img
      src={svgToDataUrl(svg)}
      width={size}
      height={size}
      alt="Avatar"
      className={className}
    />
  );
}

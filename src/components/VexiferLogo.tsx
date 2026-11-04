import React from 'react';

interface VexiferLogoProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Scalable Vexifer Vector Mark:
 * Stylized waving flag with integrated learning checkmark (Vexillology + Active Recall + 'V').
 */
export function VexiferLogo({
  size = 28,
  className,
  'aria-hidden': ariaHidden = true,
}: VexiferLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="46 40 136 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Flagpole */}
      <circle cx="56" cy="52" r="10" fill="#3D4034" />
      <rect x="51.5" y="52" width="9" height="98" rx="4.5" fill="#3D4034" />

      {/* Flag Cloth Group */}
      <g>
        {/* Lower Muted Olive Field (#96966B) */}
        <path
          d="M 60,102 C 78,96 102,104 122,116 L 168,82 C 170,98 172,114 176,126 C 142,138 106,120 60,132 Z"
          fill="#96966B"
        />

        {/* Warm Ivory Accent Chevron Underlay (#F0E8D6) */}
        <path
          d="M 85,99 C 98,99 108,106 122,126 L 168,82 L 160,80 L 122,116 C 112,105 101,101 85,99 Z"
          fill="#F0E8D6"
        />

        {/* Upper Warm Ivory Field (#F0E8D6) */}
        <path
          d="M 60,66 C 88,54 122,72 176,60 C 170,80 171,102 176,126 L 168,82 L 122,116 C 106,104 82,97 60,102 Z"
          fill="#F0E8D6"
        />

        {/* Integrated Dark Charcoal Checkmark Core (#171814) */}
        <path
          d="M 85,99 C 97,99 106,105 122,118 L 168,82 L 161,84 L 122,111 C 112,102 100,98 85,99 Z"
          fill="#171814"
        />
      </g>
    </svg>
  );
}

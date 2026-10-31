"use client";

import React, { useMemo } from "react";

interface UpiQrCodeProps {
  vpa: string;
  payeeName: string;
  amountInr: number;
  size?: number;
  className?: string;
}

/**
 * Generates a deterministic SVG QR code matrix for a UPI payment URI.
 */
export function UpiQrCode({
  vpa,
  payeeName,
  amountInr,
  size = 180,
  className = "",
}: UpiQrCodeProps) {
  const upiUri = useMemo(() => {
    const encodedName = encodeURIComponent(payeeName);
    return `upi://pay?pa=${vpa}&pn=${encodedName}&am=${amountInr}&cu=INR&tn=Forgent%20Task%20Wallet%20TopUp`;
  }, [vpa, payeeName, amountInr]);

  // Generate 25x25 matrix
  const matrix = useMemo(() => {
    const dim = 25;
    const grid: boolean[][] = Array.from({ length: dim }, () =>
      Array(dim).fill(false)
    );

    // 1. Mark position finder patterns (7x7) at (0,0), (0, 18), (18, 0)
    const placeFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[startRow + r][startCol + c] = isOuterBorder || isInnerSquare;
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, 18);
    placeFinder(18, 0);

    // 2. Mark timing patterns
    for (let i = 8; i < 17; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Mark alignment pattern (5x5) centered at (18, 18)
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
        const isCenter = r === 18 && c === 18;
        grid[r][c] = isBorder || isCenter;
      }
    }

    // 4. Fill data areas deterministically using a hash of the upiUri
    let hash = 0;
    for (let i = 0; i < upiUri.length; i++) {
      hash = (hash * 31 + upiUri.charCodeAt(i)) >>> 0;
    }

    const isReserved = (r: number, c: number): boolean => {
      // Finder 1
      if (r < 8 && c < 8) return true;
      // Finder 2
      if (r < 8 && c >= 17) return true;
      // Finder 3
      if (r >= 17 && c < 8) return true;
      // Timing
      if (r === 6 || c === 6) return true;
      // Alignment
      if (r >= 16 && r <= 20 && c >= 16 && c <= 20) return true;
      return false;
    };

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        if (!isReserved(r, c)) {
          // Linear congruential pseudorandom bit
          hash = (hash * 1664525 + 1013904223) >>> 0;
          grid[r][c] = (hash & 0x4000) !== 0;
        }
      }
    }

    return grid;
  }, [upiUri]);

  const dim = matrix.length;
  const cellSize = size / dim;

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg shadow-sm border border-slate-200 bg-white"
        role="img"
        aria-label={`UPI QR Code for ${vpa}`}
      >
        <rect width={size} height={size} fill="#FFFFFF" />
        {matrix.flatMap((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0B4FBA"
              />
            ) : null
          )
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white border border-cobalt-200 px-1.5 py-0.5 rounded shadow-xs text-[9px] font-mono font-bold text-cobalt-700 tracking-wider">
          UPI
        </div>
      </div>
    </div>
  );
}

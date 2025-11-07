const rawMode = (() => {
  if (typeof process === 'undefined') {
    return 'legacy';
  }
  const serverValue = process.env.BOARDS_V2_MODE;
  const clientValue = process.env.NEXT_PUBLIC_BOARDS_V2_MODE;
  return serverValue ?? clientValue ?? 'legacy';
})();

export type BoardsDataMode = 'legacy' | 'dual-write' | 'v2-only';

const normalized = rawMode.trim().toLowerCase();

export const boardsDataMode: BoardsDataMode =
  normalized === 'v2-only'
    ? 'v2-only'
    : normalized === 'dual-write' || normalized === 'dual'
      ? 'dual-write'
      : 'legacy';

export const isBoardsV2Enabled = boardsDataMode !== 'legacy';
export const isBoardsDualWrite = boardsDataMode === 'dual-write';

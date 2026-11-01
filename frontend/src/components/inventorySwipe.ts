/** Only a deliberate, predominantly downward drag dismisses the sheet. */
export function shouldDismissInventory(startX: number, startY: number, endX: number, endY: number): boolean {
  const down = endY - startY;
  return down >= 70 && down > Math.abs(endX - startX);
}

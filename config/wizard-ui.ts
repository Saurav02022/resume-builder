/**
 * Shared height for JD textarea, JD preview, LaTeX preview — keeps wizard columns consistent.
 * Scroll: use `overflow-y-auto` on native elements; `ScrollArea` only needs height.
 */
export const wizardTextBlockHeightClass =
  "h-[min(42vh,380px)] max-h-[min(42vh,380px)] min-h-[280px]";

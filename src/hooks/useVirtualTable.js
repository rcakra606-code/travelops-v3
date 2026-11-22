import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Reusable table/list virtualization hook powered by @tanstack/react-virtual.
 * Automatically activates when row count exceeds `threshold` (default 40 rows),
 * preserving native <table> layout via top/bottom spacer row offsets.
 */
export function useVirtualTable({
  count = 0,
  estimateSize = 56,
  overscan = 8,
  threshold = 40
} = {}) {
  const scrollRef = useRef(null);
  const isVirtualized = count > threshold;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: isVirtualized ? count : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan
  });

  if (!isVirtualized) {
    return {
      scrollRef,
      isVirtualized: false,
      virtualItems: null,
      totalSize: 0,
      paddingTop: 0,
      paddingBottom: 0,
      virtualizer
    };
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(0, totalSize - virtualItems[virtualItems.length - 1].end)
      : 0;

  return {
    scrollRef,
    isVirtualized: true,
    virtualItems,
    totalSize,
    paddingTop,
    paddingBottom,
    virtualizer
  };
}

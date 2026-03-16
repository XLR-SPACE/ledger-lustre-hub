import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPressing(true);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback((e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPressing(false);

    // Only trigger click if it wasn't a long press
    if (shouldTriggerClick && !isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  const handlers = {
    onTouchStart: start,
    onTouchEnd: (e: React.TouchEvent) => stop(e),
    onTouchCancel: (e: React.TouchEvent) => stop(e, false),
    onMouseDown: start,
    onMouseUp: (e: React.MouseEvent) => stop(e),
    onMouseLeave: (e: React.MouseEvent) => stop(e, false),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress();
    },
  };

  return { handlers, isLongPressing };
}

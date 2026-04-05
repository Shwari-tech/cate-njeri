// =========================================
// MOBILE GESTURES HOOK - TOUCH INTERACTIONS
// =========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SwipeState } from '@/types';

interface GestureConfig {
  threshold?: number;
  velocityThreshold?: number;
  preventDefault?: boolean;
}

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
}

export function useGestures(
  handlers: GestureHandlers,
  config: GestureConfig = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.5,
    preventDefault = true,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
    direction: null,
  });

  const touchStartTimeRef = useRef(0);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pinchStartDistanceRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const now = Date.now();

    touchStartTimeRef.current = now;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

    setSwipeState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
      direction: null,
    }));

    // Long press detection
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress?.();
      }, 500);
    }

    // Pinch detection (2 fingers)
    if (e.touches.length === 2 && handlers.onPinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [handlers, preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Determine direction
    let direction: SwipeState['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction,
    }));

    // Pinch handling
    if (e.touches.length === 2 && handlers.onPinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / pinchStartDistanceRef.current;
      handlers.onPinch(scale);
    }
  }, [handlers, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const deltaX = lastTouchRef.current.x - touchStartRef.current.x;
    const deltaY = lastTouchRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartTimeRef.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Tap detection
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      tapCountRef.current++;

      if (tapCountRef.current === 1) {
        tapTimerRef.current = setTimeout(() => {
          handlers.onTap?.();
          tapCountRef.current = 0;
        }, 250);
      } else if (tapCountRef.current === 2) {
        if (tapTimerRef.current) {
          clearTimeout(tapTimerRef.current);
        }
        handlers.onDoubleTap?.();
        tapCountRef.current = 0;
      }
    }

    // Swipe detection
    if (velocity > velocityThreshold || Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    setSwipeState(prev => ({
      ...prev,
      isSwiping: false,
      direction: null,
    }));
  }, [handlers, threshold, velocityThreshold]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    setSwipeState(prev => ({
      ...prev,
      isSwiping: false,
      direction: null,
    }));
  }, []);

  // Attach event listeners
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}

// Hook for swipeable tabs
export function useSwipeableTabs(
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void
) {
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    const distance = touchStartXRef.current - touchEndXRef.current;
    const currentIndex = tabs.indexOf(activeTab);

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        onTabChange(tabs[currentIndex + 1]);
      } else if (distance < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        onTabChange(tabs[currentIndex - 1]);
      }
    }
  }, [tabs, activeTab, onTabChange]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Hook for pull-to-refresh
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  config: { threshold?: number; maxPull?: number } = {}
) {
  const { threshold = 80, maxPull = 120 } = config;
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const isPullingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartYRef.current = e.targetTouches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPullingRef.current) return;

    const touchY = e.targetTouches[0].clientY;
    const diff = touchY - touchStartYRef.current;

    if (diff > 0) {
      e.preventDefault();
      const dampedDistance = Math.min(diff * 0.5, maxPull);
      setPullDistance(dampedDistance);
    }
  }, [maxPull]);

  const onTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    style: {
      transform: `translateY(${pullDistance}px)`,
      transition: isPullingRef.current ? 'none' : 'transform 0.3s ease-out',
    },
  };
}

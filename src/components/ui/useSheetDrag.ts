import { type PointerEvent, useRef } from "react";

export function useSheetDrag(onClose: () => boolean | Promise<boolean>) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const lastY = useRef(0);
  const dragging = useRef(false);

  function moveTo(distance: number) {
    const content = contentRef.current;
    if (!content) return;
    content.style.transform = `translateY(${Math.max(0, distance)}px)`;
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    dragging.current = true;
    startY.current = event.clientY;
    lastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (contentRef.current) {
      contentRef.current.getAnimations().forEach((animation) => animation.cancel());
      contentRef.current.style.transition = "none";
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!dragging.current) return;
    lastY.current = event.clientY;
    moveTo(event.clientY - startY.current);
  }

  async function finish() {
    if (!dragging.current) return;
    dragging.current = false;
    const distance = lastY.current - startY.current;
    const content = contentRef.current;
    if (content) content.style.transition = "transform var(--motion-sheet-snap) var(--motion-ease-out)";
    if (distance > 90) {
      if (content) content.dataset.dragClosing = "true";
      const cerrado = await onClose();
      if (!cerrado) {
        if (content) delete content.dataset.dragClosing;
        moveTo(0);
      }
    } else {
      moveTo(0);
    }
  }

  return { contentRef, dragHandleProps: { onPointerDown, onPointerMove, onPointerUp: () => void finish(), onPointerCancel: () => void finish() } };
}

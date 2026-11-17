import { RefObject, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

// ドラッグを開始しない要素（操作可能な要素とその子孫）
const NO_DRAG_SELECTOR =
  'button, input, textarea, select, a, label, [role=button], [contenteditable], [data-no-drag]';

/**
 * root 要素内の「操作できない部分」を掴むとウィンドウをドラッグ移動できるようにする。
 *
 * Tauri 標準の data-tauri-drag-region は mousedown の target 自身に属性が必要で、
 * 子孫要素（テキストやアイコン）では反応しないため、委譲リスナーで判定する。
 * macOS のドラッグは現在の NSEvent を使うので、startDragging は mousedown 内で同期的に呼ぶこと
 * （動的 import や await を挟まない／mousemove のしきい値を設けない）。
 */
export function useWindowDrag(rootRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(NO_DRAG_SELECTOR)) return;

      // スクロールバー上の mousedown はスクロール操作として扱う
      if (
        target instanceof HTMLElement &&
        (e.offsetX >= target.clientWidth || e.offsetY >= target.clientHeight) &&
        (target.scrollHeight > target.clientHeight || target.scrollWidth > target.clientWidth)
      ) {
        return;
      }

      // preventDefault するとフォーカス移動も起きないため、入力中の要素は明示的に外す
      e.preventDefault();
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && !active.contains(target)) {
        active.blur();
      }

      getCurrentWindow()
        .startDragging()
        .catch((error) => console.error('Failed to start dragging:', error));
    };

    root.addEventListener('mousedown', handleMouseDown);
    return () => root.removeEventListener('mousedown', handleMouseDown);
  }, [rootRef]);
}

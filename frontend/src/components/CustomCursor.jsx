import { useEffect, useRef } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    function onMove(e) {
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
    }

    function onDown() {
      ring.classList.add('clicking');
      dot.classList.add('clicking');
    }
    function onUp() {
      ring.classList.remove('clicking');
      dot.classList.remove('clicking');
    }

    function onOver(e) {
      const tag = e.target.tagName;
      const isInteractive = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' ||
        tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'LI' ||
        e.target.closest('button') || e.target.closest('a') ||
        e.target.classList.contains('conversation-item') ||
        e.target.classList.contains('inline-user-item') ||
        e.target.classList.contains('gm-inline-user-item');
      if (isInteractive) {
        ring.classList.add('hovering');
      }
    }
    function onOut() {
      ring.classList.remove('hovering');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring">
        {/* Bottom-left and bottom-right corners (::before/::after handle top corners) */}
        <div className="cursor-corner-bl" />
        <div className="cursor-corner-br" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface SignaturePadProps {
  id: string;
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
  optional?: boolean;
  className?: string;
}

export function SignaturePad({
  id,
  label,
  value,
  onChange,
  disabled = false,
  optional = false,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !value) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }

    const point = getPoint(event);
    const context = canvasRef.current?.getContext('2d');

    if (!point || !context) {
      return;
    }

    context.strokeStyle = '#111827';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
    canvasRef.current?.setPointerCapture(event.pointerId);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) {
      return;
    }

    const point = getPoint(event);
    const context = canvasRef.current?.getContext('2d');

    if (!point || !context) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(event.pointerId);

    const canvas = canvasRef.current;

    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-wilms-2', className)}>
      <label htmlFor={id} className="text-small font-semibold text-text-primary">
        {label}
        {optional ? <span className="font-normal text-text-muted"> (optional)</span> : null}
      </label>
      <canvas
        id={id}
        ref={canvasRef}
        width={480}
        height={160}
        aria-label={label}
        className={cn(
          'w-full rounded-sm border border-border bg-background touch-none',
          disabled && 'opacity-60',
        )}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
      />
      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clear}>
        Clear signature
      </Button>
    </div>
  );
}

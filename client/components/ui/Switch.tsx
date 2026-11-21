'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Switch — derived from Uiverse.io "foolish-elephant-3" by santhosh_2608
 * (Santhosh Reddy), MIT License. Dark rounded track with an icon knob;
 * recolored to the CodeVerse palette (forest active / sage inactive).
 *
 * A real <button role="switch">, so Space/Enter keyboard activation and
 * screen-reader state come from native semantics. Controlled via
 * `checked`/`onCheckedChange`, or uncontrolled with `defaultChecked`.
 */
type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
};

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  id,
  className,
  ...rest
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isChecked = checked ?? internal;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={isChecked}
      disabled={disabled}
      onClick={toggle}
      className={cn('cv-switch', className)}
      {...rest}
    >
      <span className="cv-switch__knob" aria-hidden="true">
        {isChecked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
    </button>
  );
}

'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            disabled={disabled}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

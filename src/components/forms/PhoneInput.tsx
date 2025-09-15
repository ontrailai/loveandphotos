/**
 * PhoneInput Component
 * Live-formatting phone input with US format (555) 123-4567
 */

import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { formatUSPhone, isValidUSPhone } from '@/utils/formatPhone';
import { clsx } from 'clsx';
import { PhoneIcon } from 'lucide-react';

interface PhoneInputProps {
  name?: string;
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  onDigits?: (digits: string) => void;
  onChange?: (formatted: string, digits: string) => void;
  defaultValue?: string;
  value?: string;
  icon?: React.ReactNode;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  name = 'phone',
  label,
  error,
  required,
  placeholder = '(555) 123-4567',
  className = '',
  containerClassName = '',
  onDigits,
  onChange,
  defaultValue = '',
  value: controlledValue,
  icon = <PhoneIcon className="w-5 h-5 text-muted-foreground" />
}, ref) => {
  const [internalValue, setInternalValue] = useState(() => {
    const initialValue = controlledValue || defaultValue;
    return formatUSPhone(initialValue).formatted;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Expose both inputs via ref
  useImperativeHandle(ref, () => inputRef.current!);

  // Use controlled value if provided, otherwise use internal state
  const displayValue = controlledValue !== undefined
    ? formatUSPhone(controlledValue).formatted
    : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const { formatted, digits } = formatUSPhone(input);

    // Update internal state if not controlled
    if (controlledValue === undefined) {
      setInternalValue(formatted);
    }

    // Update hidden input with raw digits
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = digits;
    }

    // Call callbacks
    onDigits?.(digits);
    onChange?.(formatted, digits);
  };

  const isValid = isValidUSPhone(displayValue);
  const showError = error || (required && displayValue && !isValid);

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          required={required}
          aria-invalid={!!showError}
          className={clsx(
            'block w-full rounded-md border bg-background text-foreground',
            'px-3 py-2.5 transition-all duration-200',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:bg-muted disabled:cursor-not-allowed',
            {
              'border-border hover:border-muted-foreground': !showError,
              'border-destructive focus-visible:ring-destructive': showError,
              'pl-10': icon,
            },
            className
          )}
        />
        {/* Hidden input with raw digits for form submission */}
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={`${name}_raw`}
          value={formatUSPhone(displayValue).digits}
        />
      </div>
      {showError && (
        <p className="mt-1.5 text-sm text-destructive">
          {error || 'Please enter a valid 10-digit phone number'}
        </p>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
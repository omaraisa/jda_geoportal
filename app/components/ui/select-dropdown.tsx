import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SelectDropdown({ 
  options, 
  value = '', 
  onChange,
  placeholder = 'Select an option',
  className = ''
}: SelectDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`select ${className}`}>
      <select value={value} onChange={handleChange}>
        <option value="" hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

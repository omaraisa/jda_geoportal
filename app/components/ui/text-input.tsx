import React from 'react';

interface TextInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
}

export default function TextInput({ 
  id, 
  label, 
  placeholder = ' ',
  value = '',
  onChange,
  className = '',
  type = 'text'
}: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const displayLabel = label || placeholder;

  return (
    <label htmlFor={id} className={`textInput ${className}`}>
      <input
        type={type}
        className="input-text"
        id={id}
        placeholder=''
        value={value}
        onChange={handleChange}
      />
      <span className="label">{displayLabel}</span>
      <span className="focus-bg"></span>
    </label>
  );
}

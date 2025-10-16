import React from "react";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div className="mb-3">
    <label className="block mb-1">{label}</label>
    {children}
  </div>
);

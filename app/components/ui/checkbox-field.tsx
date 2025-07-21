interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  name?: string;
  id?: string;
}

export default function CheckboxField({ 
  checked, 
  onChange, 
  label, 
  name, 
  id 
}: CheckboxFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="flex items-center mb-2">
      <input
        type="checkbox"
        className="checkbox mr-2 rtl:ml-2 rtl:mr-0"
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
      />
      <label className="tick-label" htmlFor={id}>
        <div id="tick_mark"></div>
      </label>
      <span className="ml-2 rtl:mr-2 rtl:ml-0">{label}</span>
    </div>
  );
}

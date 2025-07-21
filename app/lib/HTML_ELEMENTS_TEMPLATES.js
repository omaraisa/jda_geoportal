import Button from '../components/ui/button';
import SwitchToggle from '../components/ui/switch-toggle';
import DualLabelToggle from '../components/ui/dual-label-toggle';
import CustomCheckbox from '../components/ui/custom-checkbox';
import TextInput from '../components/ui/text-input';
import TextareaInput from '../components/ui/textarea-input';
import SelectDropdown from '../components/ui/select-dropdown';
import NumberInput from '../components/ui/number-input';

export default function HTML_ELEMENTS_TEMPLATES() {
  const selectOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Option 4' }
  ];

  return (
    <div className="h-full flex justify-center items-center text-white">
      <div className="flex flex-col justify-center items-center space-y-4 text-white">
        {/* Buttons */}
        <div>
          <div className="mb-2 font-bold">Buttons (with flex-grow)</div>
          <div className="flex gap-2 w-full">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="green">Green Button</Button>
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Button variant="danger">Danger Button</Button>
            <Button variant="gray">Gray Button</Button>
            <Button variant="primary" disabled>Disabled Button</Button>
          </div>
          
          <div className="mb-2 font-bold mt-4">Buttons (no flex)</div>
          <div className="flex gap-2 justify-center">
            <Button variant="primary" noFlex>Small</Button>
            <Button variant="secondary" noFlex>Medium Button</Button>
            <Button variant="green" noFlex>Large Button Text</Button>
          </div>
        </div>

        {/* Switch Toggle */}
        <div>
          <div className="mb-2 font-bold">Switch Toggle</div>
          <SwitchToggle id="switch" label="Toggle" />
        </div>

        {/* Dual Label Toggle */}
        <div>
          <div className="mb-2 font-bold">Dual Label Toggle</div>
          <DualLabelToggle 
            id="dual-toggle"
            leftLabel="By Layer"
            rightLabel="By Drawing"
          />
        </div>

        {/* Custom Checkbox */}
        <div>
          <div className="mb-2 font-bold">Custom Checkbox</div>
          <CustomCheckbox id="_checkbox" />
        </div>

        {/* Text Input */}
        <div>
          <div className="mb-2 font-bold">Text Input</div>
          <TextInput id="textInput" label="Enter Input" />
        </div>

        {/* Textarea Input */}
        <div>
          <div className="mb-2 font-bold">Textarea Input</div>
          <TextareaInput id="textareaInput" label="Enter Details" />
        </div>

        {/* Select Dropdown */}
        <div>
          <div className="mb-2 font-bold">Select Dropdown</div>
          <SelectDropdown 
            options={selectOptions}
            placeholder="Select an option"
          />
        </div>

        {/* Number Input */}
        <div>
          <div className="mb-2 font-bold">Number Input</div>
          <NumberInput id="numberInput" min={10} max={100} />
        </div>
      </div>
    </div>
  );
}

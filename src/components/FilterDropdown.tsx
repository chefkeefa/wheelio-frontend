"use client";

import { useState } from "react";

interface FilterDropdownProps {
  label: string;
  placeholder?: string;
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export default function FilterDropdown({ 
  label, 
  placeholder = "Any", 
  options = ["Any", "Option 1", "Option 2"], 
  value = "Any",
  onChange 
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (option: string) => {
    setSelectedValue(option);
    onChange?.(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-base font-semibold text-black mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 px-3 bg-[#d9d9d9] rounded-lg flex items-center justify-between text-base font-semibold text-[#8c8c8c] hover:bg-gray-300 transition-colors"
        >
          <span>{selectedValue}</span>
          <div className="w-8 h-10 bg-[#939393] rounded-lg flex items-center justify-center">
            <img 
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/2bd6c49b-ca5c-4f28-9786-ac5ffdca736f" 
              alt="Dropdown" 
              className="w-4 h-3"
            />
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[hsl(var(--border))] rounded-lg shadow-lg z-10">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-base hover:bg-[hsl(var(--muted))] transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

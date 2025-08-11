"use client";

import { useState } from "react";

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  onRangeChange?: (min: number, max: number) => void;
}

export default function PriceRangeSlider({ 
  minPrice = 0, 
  maxPrice = 100000,
  onRangeChange 
}: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);

  const handleMinChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setMinValue(numValue);
    onRangeChange?.(numValue, maxValue);
  };

  const handleMaxChange = (value: string) => {
    const numValue = parseInt(value) || 100000;
    setMaxValue(numValue);
    onRangeChange?.(minValue, numValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-base font-semibold text-black">
        Price
      </label>
      
      {/* Price Range Visual */}
      <div className="relative h-3.5">
        <img 
          src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9bac64b5-48be-456b-a718-83895127a733" 
          alt="Price Range" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Price Inputs */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="000,000"
            value={minValue === 0 ? "" : minValue.toLocaleString()}
            onChange={(e) => handleMinChange(e.target.value.replace(/,/g, ""))}
            className="w-full h-10 px-3 bg-[#d9d9d9] rounded-lg text-base font-semibold text-[#8c8c8c] placeholder-[#8c8c8c]"
          />
          <span className="text-base font-semibold text-[#8c8c8c]">€</span>
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="000,000"
            value={maxValue === 100000 ? "" : maxValue.toLocaleString()}
            onChange={(e) => handleMaxChange(e.target.value.replace(/,/g, ""))}
            className="w-full h-10 px-3 bg-[#d9d9d9] rounded-lg text-base font-semibold text-[#8c8c8c] placeholder-[#8c8c8c]"
          />
          <span className="text-base font-semibold text-[#8c8c8c]">€</span>
        </div>
      </div>
      
      {/* Price Labels */}
      <div className="flex justify-between text-base font-semibold text-black">
        <span>0€</span>
        <span>100,000€</span>
      </div>
    </div>
  );
}

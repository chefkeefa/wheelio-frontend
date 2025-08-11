// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import FilterDropdown from "../components/FilterDropdown";
import PriceRangeSlider from "../components/PriceRangeSlider";
import CarCard from "../components/CarCard";

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
};

const API = "https://pirkauto-backend.onrender.com/api/public/listings";

// Fallback-данные, если бэкенд не ответил
const mockListings: Listing[] = Array.from({ length: 13 }, (_, i) => ({
  id: (i + 1).toString(),
  title: "Text text text",
  price: Math.floor(Math.random() * 50000) + 10000,
  mileage: Math.floor(Math.random() * 200000) + 50000,
  thumbnail: `https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/${
    [
      "a7700da0-47f9-4836-b1c3-61841773096d",
      "dd77542a-044f-44a9-93c3-ccc4d1c7c0fd",
      "8002e9b2-dce7-4377-8909-2846e985a3df",
      "6505abdc-78a9-45d7-9bcd-eec3f6e46d96",
      "6b7d3f77-aa06-43b0-82e6-edb9874639af",
      "ffe88bcc-acf5-4663-b232-055be9c95abe",
      "4041c68f-8504-4e42-914c-baebb3d0cede",
      "af39d605-bcaf-45f5-a867-84c8f4879a64",
      "de102b86-6205-4ee7-8c54-801a1b99f4fe",
    ][i % 9]
  }`,
}));

export default function HomePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Фильтры (пока только UI)
  const [selectedMark, setSelectedMark] = useState("Any");
  const [selectedModel, setSelectedModel] = useState("Any");
  const [selectedRegistration, setSelectedRegistration] = useState("Any");
  const [selectedMileage, setSelectedMileage] = useState("Any");

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Listing[]) =>
        setItems([...data].sort((a, b) => Number(b.id) - Number(a.id)))
      )
      .catch(() => setItems(mockListings))
      .finally(() => setLoading(false));
  }, []);

  const display = items.length > 0 ? items : mockListings;
  const mainListings = display.slice(0, 9);
  const latestListings = display.slice(9, 13);

  return (
    <div className="space-y-12 bg-background">
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[641px] overflow-hidden rounded-2xl">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a0c5a0be-a3e7-4709-a493-1a91e67541ee"
            alt="Hero Car"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 md:left-16">
            <h1 className="max-w-xs text-4xl font-extrabold leading-tight text-white md:text-5xl">
              buy and sell a car easily!
            </h1>
          </div>
        </div>
      </section>

      {/* SEARCH FILTERS */}
      <section className="container">
        <div className="rounded-[40px] bg-[hsl(var(--muted))] p-6 md:p-8">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
            <FilterDropdown
              label="Mark"
              value={selectedMark}
              onChange={setSelectedMark}
              options={["Any", "BMW", "Mercedes", "Audi", "Volkswagen"]}
            />
            <FilterDropdown
              label="Model"
              value={selectedModel}
              onChange={setSelectedModel}
              options={["Any", "3 Series", "C-Class", "A4", "Golf"]}
            />
            <FilterDropdown
              label="1st registration form"
              value={selectedRegistration}
              onChange={setSelectedRegistration}
              options={["Any", "2020", "2019", "2018", "2017"]}
            />
            <FilterDropdown
              label="Mileage up to"
              value={selectedMileage}
              onChange={setSelectedMileage}
              options={["Any", "50,000 km", "100,000 km", "150,000 km"]}
            />
          </div>

          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            <PriceRangeSlider />
            <div className="space-y-4">
              <button className="flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#5f5f5f] font-semibold text-white transition-colors hover:bg-gray-700">
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a6cc5711-7646-4ec4-95d8-560f208b9c7c"
                  alt="Search"
                  className="h-6 w-6"
                />
                Search offers
              </button>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[#d9a339]">
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d30efceb-1604-46a0-82a1-fe94b17e79da"
                    alt="Filter"
                    className="h-3.5 w-3.5"
                  />
                  More filters
                </button>
                <button className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[#d9a339]">
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5245294e-9c33-44e9-a16e-1cc84c6da426"
                    alt="Reset"
                    className="h-3.5 w-3.5"
                  />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN LISTINGS */}
      <section className="container">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mainListings.map((item) => (
              <CarCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                imageUrl={item.thumbnail}
                size="large"
              />
            ))}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <button className="rounded-lg bg-[#5f5f5f] px-12 py-3 text-xl font-extrabold text-white transition-colors hover:bg-gray-700">
            More
          </button>
        </div>
      </section>

      {/* LATEST LISTINGS */}
      <section className="container">
        <h2 className="mb-8 text-4xl font-extrabold text-black md:text-6xl">
          Latest listings
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {latestListings.map((item) => (
            <CarCard
              key={`latest-${item.id}`}
              id={item.id}
              title={item.title}
              price={item.price}
              imageUrl={item.thumbnail}
              size="small"
            />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button className="rounded-lg bg-[#5f5f5f] px-12 py-3 text-xl font-extrabold text-white transition-colors hover:bg-gray-700">
            More
          </button>
        </div>
      </section>
    </div>
  );
}

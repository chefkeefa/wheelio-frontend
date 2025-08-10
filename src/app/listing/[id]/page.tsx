// src/app/listing/[id]/page.tsx
import Link from "next/link";

// Мок-данные (совпадают с /search)
const mock = [
  { id: "1", title: "BMW 3-Series 2016", price: 9800, mileage: 185_000, fuel: "Petrol", transmission: "Manual", power: "110 kW" },
  { id: "2", title: "VW Golf 2018",      price: 8700, mileage: 150_000, fuel: "Diesel", transmission: "Automatic", power: "90 kW" },
  { id: "3", title: "Audi A4 2015",      price: 9200, mileage: 210_000, fuel: "Petrol", transmission: "Automatic", power: "125 kW" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ListingPage(props: any) {
  const id = props?.params?.id as string | undefined;
  const car = mock.find((item) => item.id === id);

  if (!car) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Skelbimas nerastas</h1>
        <p className="text-gray-600">Šis skelbimas nebegalioja arba neegzistuoja.</p>
        <Link href="/search" className="text-blue-600 hover:underline">← Grįžti į paiešką</Link>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Галерея (заглушка) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="aspect-video w-full rounded-lg bg-gray-200" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-video rounded bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Информация справа */}
      <aside className="lg:col-span-5 space-y-4">
        <div className="rounded-lg border bg-white p-5 space-y-2">
          <h1 className="text-2xl font-bold">{car.title}</h1>
          <div className="text-2xl">{car.price.toLocaleString()} €</div>
          <div className="text-gray-600">Rida: {car.mileage.toLocaleString()} km</div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold mb-3">Pagrindinė informacija</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li><span className="text-gray-500">Kuras:</span> {car.fuel}</li>
            <li><span className="text-gray-500">Pavarų dėžė:</span> {car.transmission}</li>
            <li><span className="text-gray-500">Galia:</span> {car.power}</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold mb-3">Pardavėjas</h2>
          <div className="text-sm text-gray-700">Privatus pardavėjas</div>
          <div className="text-sm text-gray-700">Klaipėda, LT</div>
          <button className="mt-3 w-full rounded-lg bg-black text-white py-2">Siųsti žinutę</button>
        </div>

        <Link href="/search" className="block text-center text-blue-600 hover:underline">
          ← Grįžti į paiešką
        </Link>
      </aside>
    </section>
  );
}

// Для статического экспорта страниц объявлений
export function generateStaticParams() {
  return mock.map(({ id }) => ({ id }));
}

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#cecece]">
      <div className="flex flex-col items-center px-4 pt-8 pb-16">
        {/* Page Title */}
        <h1 className="text-6xl md:text-8xl lg:text-[96px] font-bold text-black text-center mb-8 leading-none">
          About us
        </h1>

        {/* Content Box */}
        <section className="w-full max-w-[974px] bg-white rounded-2xl border-2 border-[#d9a339] p-8 md:p-12 mb-8">
          {/* Centered Section Heading */}
          <h2 className="text-[48px] font-bold text-[#d9a339] mb-6 leading-[50px] text-center">
            Who we are
          </h2>

          {/* Intro */}
          <p className="text-black text-[20px] leading-8 text-center mb-6">
            <strong>PirkAuto</strong> is a modern marketplace for buying and selling cars, built to make
            the search and purchase process simple, convenient, and transparent.
          </p>

          {/* Value props */}
          <div className="text-black text-[20px] leading-8 space-y-6 text-center">
            <p>
              We know buying a car is a big decision. That’s why PirkAuto focuses on clarity and speed
              at every step for both buyers and sellers.
            </p>

            <div className="mx-auto max-w-[760px] text-left">
              <h3 className="text-[24px] font-bold text-black mb-2 text-center md:text-left">
                Why choose PirkAuto
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold">Verified listings</span> to reduce risk and save time.</li>
                <li><span className="font-semibold">Powerful filters</span> to quickly find the right car.</li>
                <li><span className="font-semibold">Direct communication</span> between buyers and sellers.</li>
                <li><span className="font-semibold">Fast and responsive UI</span> across all devices.</li>
                <li><span className="font-semibold">Constant updates</span> — new features and improvements every month.</li>
              </ul>
            </div>

            <p>
              Our mission is to build a trusted community around car buying and selling in Lithuania and beyond -
              so you spend less time searching and more time driving.
            </p>
          </div>
        </section>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 h-[60px] bg-[#d9a339] border-2 border-[#d9a339] rounded-lg text-[20px] font-bold text-white hover:opacity-90 transition-opacity"
          >
            Browse cars
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center px-8 h-[60px] bg-white border-2 border-[#d9a339] rounded-lg text-[20px] font-bold text-black hover:bg-[#d9a339] hover:text-white transition-colors"
          >
            Sell your car
          </Link>
        </div>
      </div>
    </main>
  );
}

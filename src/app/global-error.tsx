"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/pirkApi";

// Last resort when the root layout itself fails: no header, providers or translations are available here.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);
  return (
    <html lang="lt">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Kažkas nepavyko</h1>
        <p>Apie klaidą jau žinome. Bandykite dar kartą. / Something went wrong, please try again.</p>
        <button onClick={reset} style={{ padding: "0.6rem 1.2rem", fontWeight: 600 }}>
          Bandyti dar kartą
        </button>
      </body>
    </html>
  );
}

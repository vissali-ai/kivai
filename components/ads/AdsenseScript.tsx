"use client";

import Script from "next/script";

export default function AdsenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  console.log("ADSENSE CLIENT:", client);

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          zIndex: 99999,
          background: "red",
          color: "white",
          padding: "8px",
          fontSize: "12px",
        }}
      >
        ADSENSE: {client || "UNDEFINED"}
      </div>

      {client && (
       <Script
  id="google-adsense"
  strategy="afterInteractive"
  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
/>
      )}
    </>
  );
}
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberAuthReturnPath } from "@/lib/account/auth-return";

export function AuthReturnTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Remember the last public page before entering login or signup.
    // Query parameters and hash are captured at navigation time too.
    const remember = () => rememberAuthReturnPath();
    remember();
    document.addEventListener("click", remember, true);
    window.addEventListener("pagehide", remember);
    return () => {
      document.removeEventListener("click", remember, true);
      window.removeEventListener("pagehide", remember);
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";

export default function GSAPLoader() {
  useEffect(() => {
    // Load GSAP and ScrollTrigger on client side only
    const loadScripts = async () => {
      if (typeof window !== "undefined" && !window.gsap) {
        try {
          // Load GSAP core
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js");
          // Load ScrollTrigger
          await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js");
          
          // Register ScrollTrigger plugin
          if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
          }
        } catch (error) {
          console.warn("Failed to load GSAP:", error);
        }
      }
    };

    loadScripts();
  }, []);

  return null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
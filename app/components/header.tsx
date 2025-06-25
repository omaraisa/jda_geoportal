import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import LanguageSwitcher from "./ui/lang-switcher";
import LogoutButton from "./ui/logout-button";
import useStateStore from "@/stateStore";

const HIDE_DELAY = 25000; 
const AUTO_HIDE_DELAY = 5000; 

const Header: React.FC = () => {
  const language = useStateStore((state) => state.language);
  const [visible, setVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimeout = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const clearAllTimeouts = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (autoHideTimeout.current) clearTimeout(autoHideTimeout.current);
  }, []);

  const startAutoHideTimer = useCallback(() => {
    clearAllTimeouts();
    autoHideTimeout.current = setTimeout(() => {
      if (!isHovered && !isFocused) {
        setVisible(false);
      }
    }, AUTO_HIDE_DELAY);
  }, [isHovered, isFocused]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearAllTimeouts();
    setVisible(true);
  }, [clearAllTimeouts]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    clearAllTimeouts();
    
    if (!isFocused) {
      hideTimeout.current = setTimeout(() => setVisible(false), HIDE_DELAY);
    } else {
      startAutoHideTimer();
    }
  }, [isFocused, clearAllTimeouts, startAutoHideTimer]);

  const handleFocusIn = useCallback(() => {
    setIsFocused(true);
    clearAllTimeouts();
    setVisible(true);
  }, [clearAllTimeouts]);

  const handleFocusOut = useCallback(() => {
    setIsFocused(false);
    
    if (!isHovered) {
      clearAllTimeouts();
      hideTimeout.current = setTimeout(() => setVisible(false), HIDE_DELAY);
    }
  }, [isHovered, clearAllTimeouts]);

  // Focus event listeners
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    
    header.addEventListener("focusin", handleFocusIn);
    header.addEventListener("focusout", handleFocusOut);
    
    return () => {
      header.removeEventListener("focusin", handleFocusIn);
      header.removeEventListener("focusout", handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut]);

  // Initial auto-hide timer
  useEffect(() => {
    startAutoHideTimer();
    return clearAllTimeouts;
  }, [startAutoHideTimer, clearAllTimeouts]);

  return (
    <div className="absolute top-0 w-full z-10">
      {/* Background layer */}
      <div
        className={`absolute inset-0 bg-[#ffffffeb] transition-opacity duration-600 ${visible ? "opacity-100" : "opacity-0"
          }`}
      />

      {/* Content layer */}
      <div
        ref={headerRef}
        className="relative flex flex-row items-center min-h-16 m-2 transition-opacity duration-600 pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={-1}
        style={{
          justifyContent: "space-between",
        }}
      >
        {/* Header with logo */}
        <div
          className={`flex items-center transition-opacity duration-600 ${visible ? "opacity-100" : "opacity-0"
            }`}
          style={{
            justifyContent: language === "ar" ? "flex-end" : "flex-start",
          }}
        >
          {language === "ar" ? (
            <Image src="/logo-ar.png" alt="Logo AR" width={200} height={40} />
          ) : (
            <Image src="/logo-en.png" alt="Logo EN" width={200} height={40} />
          )}
        </div>

        {/* Buttons - always visible */}
        <div
          className="flex flex-row items-center gap-2"
          style={{
            zIndex: 10,
          }}
        >
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default Header;

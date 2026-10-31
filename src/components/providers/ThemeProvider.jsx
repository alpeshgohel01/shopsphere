"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * @param {React.ComponentProps<typeof NextThemesProvider>} props
 */
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

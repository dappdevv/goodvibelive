"use client";

import { ThemeProvider } from "next-themes";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem
      disableTransitionOnChange
    >
      <Theme
        appearance="dark"
        accentColor="crimson"
        grayColor="sand"
        radius="large"
        scaling="110%"
        panelBackground="solid"
      >
        {children}
      </Theme>
    </ThemeProvider>
  );
}

export default Providers;

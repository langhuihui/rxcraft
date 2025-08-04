import React from "react";
import { ThemeProvider } from "next-themes";
import Layout from "./layout";
import RxVisualizer from "./components/rx-visualizer";
import { Toaster } from "./components/ui/toaster";

const App = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Layout>
        <RxVisualizer />
        <Toaster />
      </Layout>
    </ThemeProvider>
  );
};

export default App;

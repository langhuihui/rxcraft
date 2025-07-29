import React from "react";
import { ThemeProvider } from "next-themes";
import Layout from "./layout";
import RxVisualizer from "./components/rx-visualizer";

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
      </Layout>
    </ThemeProvider>
  );
};

export default App;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  </StrictMode>,
);

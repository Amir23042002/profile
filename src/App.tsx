import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { NFCHandler } from "./pages/NFCHandler";
import { Auth } from "./pages/Auth";
import { CreateProfile } from "./pages/CreateProfile";
import { ViewProfile } from "./pages/ViewProfile";
import { EditProfile } from "./pages/EditProfile";
import { InvalidPage } from "./pages/InvalidPage";
import { ForgotPassword } from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => {
  useServiceWorker();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/nfc" element={<NFCHandler />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/profile/:userId" element={<ViewProfile />} />
            <Route path="/edit-profile/:userId" element={<EditProfile />} />
            <Route path="/invalid" element={<InvalidPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

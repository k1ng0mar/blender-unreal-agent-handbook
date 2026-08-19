/**
 * Field Manual Atelier design reminder: the app is a dark-to-ivory editorial research desk,
 * with architectural typography, olive signal accents, and deliberate asymmetric composition.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Book from "./pages/Book";
import Home from "./pages/Home";

function AppRouter() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <Router base={base || undefined}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/book" component={Book} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

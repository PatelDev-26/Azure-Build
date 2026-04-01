import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context
import { AuthProvider } from "@/hooks/use-auth";

// Components
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import Search from "@/pages/search";
import ImageDetail from "@/pages/image-detail";
import Upload from "@/pages/upload";
import CreatorProfile from "@/pages/creator-profile";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/image/:id" component={ImageDetail} />
        <Route path="/upload" component={Upload} />
        <Route path="/creator/:id" component={CreatorProfile} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster position="bottom-right" toastOptions={{ className: 'font-sans' }} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

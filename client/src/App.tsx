import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Subprojects from "@/pages/subprojects";
import Activities from "@/pages/activities";
import Calendar from "@/pages/calendar";
import Users from "@/pages/users";
import Login from "@/pages/login";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar?: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useLocation();

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  useEffect(() => {
    if (sessionData) {
      setUser(sessionData as User);
    }
  }, [sessionData]);

  // If we're trying to access a protected route and the user is not logged in, redirect to login
  useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoading, location, setLocation]);

  // If we're at login and user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user && location === "/login") {
      setLocation("/");
    }
  }, [user, location, setLocation]);

  if (isLoading && location !== "/login") {
    return <div>Loading...</div>;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Switch>
        <Route path="/login">
          <Login onLogin={setUser} />
        </Route>
        <Route path="/">
          {user ? (
            <Layout user={user}>
              <Dashboard />
            </Layout>
          ) : (
            <Login onLogin={setUser} />
          )}
        </Route>
        <Route path="/projects">
          {user ? (
            <Layout user={user}>
              <Projects />
            </Layout>
          ) : (
            <Login onLogin={setUser} />
          )}
        </Route>
        <Route path="/projects/:id">
          {(params) => 
            user ? (
              <Layout user={user}>
                <ProjectDetail id={parseInt(params.id)} />
              </Layout>
            ) : (
              <Login onLogin={setUser} />
            )
          }
        </Route>
        <Route path="/subprojects">
          {user ? (
            <Layout user={user}>
              <Subprojects />
            </Layout>
          ) : (
            <Login onLogin={setUser} />
          )}
        </Route>
        <Route path="/activities">
          {user ? (
            <Layout user={user}>
              <Activities />
            </Layout>
          ) : (
            <Login onLogin={setUser} />
          )}
        </Route>
        <Route path="/calendar">
          {user ? (
            <Layout user={user}>
              <Calendar />
            </Layout>
          ) : (
            <Login onLogin={setUser} />
          )}
        </Route>
        <Route path="/users">
          {user && user.role === "admin" ? (
            <Layout user={user}>
              <Users />
            </Layout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </TooltipProvider>
  );
}

export default App;

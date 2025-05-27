import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Simular login automático
    const mockUser = {
      id: 1,
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    };

    toast({
      title: "Login automático",
      description: `Bem-vindo, ${mockUser.name}!`,
    });

    onLogin(mockUser);
  }, [onLogin, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">RP Project Management</CardTitle>
          <CardDescription>
            Carregando o sistema...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
// ...existing code...
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";

function LoginForm() {

  // Built-in captcha state
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptcha(code);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (captchaInput.trim().toUpperCase() !== captcha) {
      toast({
        title: "Captcha Error",
        description: "Incorrect code. Please try again.",
        variant: "destructive",
      });
      generateCaptcha();
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUpMode
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          title: isSignUpMode ? "Sign Up Failed" : "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUpMode ? "Account created" : "Login successful",
          description: isSignUpMode
            ? "Your account has been created."
            : "Welcome back.",
        });
        navigate("/", { replace: true });
      }
    } catch {
      toast({
        title: "Error",
        description: "Unexpected error occurred.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center space-y-3">
          <img
            src="/msl-logo.webp"
            alt="MSL Logo"
            className="w-20 h-20 mx-auto rounded-2xl object-contain"
          />

          <div>
            <h1 className="text-2xl font-bold">MSL Pakistan ERP Portal</h1>
            <p className="text-sm text-muted-foreground">
              {isSignUpMode
                ? "Create your account to access management dashboard"
                : "Sign in to access your management dashboard"}
            </p>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isSignUpMode ? "Sign Up" : "Sign In"}
            </h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    required
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={()=>setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </Button>
                </div>
              </div>

              {/* Built-in captcha UI */}
              <div className="space-y-2">
                <Label>Enter the code</Label>
                <div className="flex items-center gap-2">
                  <div className="bg-muted px-3 py-2 rounded font-mono text-lg tracking-widest select-none">
                    {captcha}
                  </div>
                  <Button type="button" variant="outline" onClick={generateCaptcha}>
                    Refresh
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Enter the code above"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading}
              >
                <LogIn size={16}/>
                {loading
                  ? isSignUpMode
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignUpMode
                    ? "Create Account"
                    : "Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsSignUpMode((v) => !v)}
              >
                {isSignUpMode
                  ? "Already have an account? Sign In"
                  : "New user? Create an account"}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          MSL IT Department — Develop by Abdul Manan
        </p>

      </div>
    </div>
  );
}


export default function Login(){
  return <LoginForm/>;
}

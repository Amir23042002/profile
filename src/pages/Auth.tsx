import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
          toast.error("Please verify your email before logging in. Check your inbox for the verification link.");
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send email verification
        if (user) {
          await sendEmailVerification(user);
          toast.info("Verification email sent! Please check your inbox and verify your email before signing in.");
        }
      }
      // After successful auth, redirect to create profile with the code
      navigate(`/create-profile?code=${code}`, { replace: true });
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error("No account found with this email address");
          break;
        case 'auth/wrong-password':
          toast.error("Incorrect password");
          break;
        case 'auth/invalid-email':
          toast.error("Please enter a valid email address");
          break;
        case 'auth/weak-password':
          toast.error("Password should be at least 6 characters");
          break;
        case 'auth/email-already-in-use':
          toast.error("An account with this email already exists");
          break;
        case 'auth/too-many-requests':
          toast.error("Too many failed attempts. Please try again later");
          break;
        default:
          toast.error(error.message || "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md neon-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to link your T-shirt' : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          {isLogin && (
            <div className="mt-4 text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-golden transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error("No account found with this email address");
          break;
        case 'auth/invalid-email':
          toast.error("Please enter a valid email address");
          break;
        case 'auth/too-many-requests':
          toast.error("Too many requests. Please try again later");
          break;
        default:
          toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-glow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-golden" />
            </div>
            <CardTitle className="text-2xl font-bold text-glow-golden">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full"
              >
                Try Different Email
              </Button>
              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-glow-golden">
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link 
              to="/auth" 
              className="text-sm text-muted-foreground hover:text-golden transition-colors"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
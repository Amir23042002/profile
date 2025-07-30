import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { checkUsernameExists, getUserProfile, updateUserProfile } from '@/lib/firestore';
import { toast } from 'sonner';

const Index = () => {
  const [user] = useAuthState(auth);
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          setUsername(profile.username || '');
        }
      }
    };
    loadUserProfile();
  }, [user]);

  const validateUsername = (value: string) => {
    // Instagram-style username validation: lowercase letters, numbers, periods, underscores
    const instagramRegex = /^[a-z0-9._]+$/;
    return instagramRegex.test(value) && value.length >= 1 && value.length <= 30;
  };

  const handleUsernameChange = async (value: string) => {
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    setUsernameError('');

    if (!lowercaseValue) {
      return;
    }

    if (!validateUsername(lowercaseValue)) {
      setUsernameError('Username can only contain lowercase letters, numbers, periods, and underscores');
      return;
    }

    if (userProfile && lowercaseValue === userProfile.username) {
      return; // Same as current username, no need to check
    }

    setIsChecking(true);
    try {
      const exists = await checkUsernameExists(lowercaseValue, user?.uid);
      if (exists) {
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username || usernameError || isChecking) {
      return;
    }

    try {
      await updateUserProfile(user.uid, { username });
      toast.success('Username updated successfully!');
      setUserProfile(prev => prev ? { ...prev, username } : null);
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    }
  };

  const handleDemoClick = () => {
    window.location.href = '/nfc/?code=DEMO123';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="card-glow max-w-md p-8 text-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-glow-purple">OYIEE Profile</h1>
            <p className="text-glow-golden font-semibold">NFC-Based Digital Identity</p>
            <p className="text-foreground/80 leading-relaxed">
              Tap your OYIEE T-shirt's NFC tag to access your digital profile
            </p>
          </div>

          {user && (
            <div className="space-y-4">
              <div className="text-left">
                <Label htmlFor="username" className="text-golden">Your Username</Label>
                <div className="mt-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-secondary/20 border-golden/20 focus:border-golden/40 text-golden placeholder:text-golden/50"
                  />
                  {isChecking && (
                    <p className="text-sm text-golden/70 mt-1">Checking availability...</p>
                  )}
                  {usernameError && (
                    <p className="text-sm text-red-400 mt-1">{usernameError}</p>
                  )}
                  {username && !usernameError && !isChecking && userProfile?.username !== username && (
                    <p className="text-sm text-green-400 mt-1">Username is available!</p>
                  )}
                </div>
                {username && !usernameError && !isChecking && userProfile?.username !== username && (
                  <Button
                    onClick={handleSaveUsername}
                    className="mt-3 w-full bg-golden/20 hover:bg-golden/30 text-golden border border-golden/20 hover:border-golden/40 shadow-[0_0_10px_hsl(48_100%_67%/0.3)] hover:shadow-[0_0_20px_hsl(48_100%_67%/0.5)]"
                  >
                    Save Username
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This page is accessed by scanning NFC tags embedded in official OYIEE merchandise
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Buy OYIEE T-shirt to create OYIEE profile
            </p>
            
            <Button
              variant="outline"
              className="w-full border-golden/20 hover:border-golden/40 bg-secondary/20 hover:bg-secondary/30 text-golden shadow-[0_0_10px_hsl(48_100%_67%/0.3)] hover:shadow-[0_0_20px_hsl(48_100%_67%/0.5)]"
              onClick={() => window.open('https://instagram.com/oyieeofficial', '_blank')}
            >
              <Instagram className="w-4 h-4 text-golden" />
              Visit OYIEE Official
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;

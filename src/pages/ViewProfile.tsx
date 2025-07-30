import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile } from '@/lib/firestore';
import { ProfileCard } from '@/components/ProfileCard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Share2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export const ViewProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if current user owns this profile
  const isOwner = user && profile && user.uid === profile.userId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        navigate('/invalid', { replace: true });
        return;
      }

      try {
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          setProfile(userProfile);
        } else {
          navigate('/invalid', { replace: true });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        navigate('/invalid', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, navigate]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/nfc/?code=${profile?.linkedCodes[0]}`;
    
    try {
      await navigator.share({
        title: `${profile?.name}'s OYIEE Profile`,
        text: `Check out ${profile?.name}'s profile`,
        url: shareUrl,
      });
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Failed to share profile');
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-profile/${userId}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <ProfileCard profile={profile} />
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-golden/20 hover:border-golden/40 bg-secondary/20 hover:bg-secondary/30 text-golden shadow-[0_0_10px_hsl(48_100%_67%/0.3)] hover:shadow-[0_0_20px_hsl(48_100%_67%/0.5)]"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 text-golden" />
            Share Profile
          </Button>
          
          {isOwner && (
            <Button
              variant="outline"
              className="flex-1 border-golden/20 hover:border-golden/40 bg-secondary/20 hover:bg-secondary/30 text-golden shadow-[0_0_10px_hsl(48_100%_67%/0.3)] hover:shadow-[0_0_20px_hsl(48_100%_67%/0.5)]"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 text-golden" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
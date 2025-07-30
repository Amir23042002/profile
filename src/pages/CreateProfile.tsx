import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createUserProfile, linkNFCCode, checkUsernameExists, getNFCCode, getUserProfile, updateUserProfile } from '@/lib/firestore';
import { uploadImageToImgBB } from '@/lib/imgbb';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';

export const CreateProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isValidating, setIsValidating] = useState(true);
  const code = searchParams.get('code');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    email: '',
    photo: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    phone: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { updateProfileCache } = useServiceWorker();
  
  const [usernameValidation, setUsernameValidation] = useState({ isValid: false, message: '' });
  
  const { isChecking } = useUsernameValidation({
    username: formData.username,
    currentUserId: user?.uid,
    onValidationChange: (isValid, message) => {
      setUsernameValidation({ isValid, message });
    }
  });

  useEffect(() => {
    const validateCodeAndAuth = async () => {
      if (!code) {
        navigate('/invalid', { replace: true });
        return;
      }

      if (!user && !loading) {
        navigate(`/auth?code=${code}`, { replace: true });
        return;
      }

      if (loading) return;

      // Check if user's email is verified
      if (user && !user.emailVerified) {
        toast.error("Please verify your email before creating a profile. Check your inbox for the verification link.");
        navigate(`/auth?code=${code}`, { replace: true });
        return;
      }

      try {
        const nfcData = await getNFCCode(code);
        
        if (!nfcData) {
          navigate('/invalid', { replace: true });
          return;
        }

        if (nfcData.isLinked) {
          navigate('/invalid', { replace: true });
          return;
        }

        // Check if user already has a profile
        if (user) {
          const existingProfile = await getUserProfile(user.uid);
          if (existingProfile) {
            // User exists, just link the new code
            await updateUserProfile(user.uid, {
              linkedCodes: [...existingProfile.linkedCodes, code]
            });
            await linkNFCCode(code, user.uid);
            navigate(`/profile/${user.uid}`, { replace: true });
            return;
          }
          
          // Pre-fill email from auth
          setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
      } catch (error) {
        console.error('Error validating code:', error);
        navigate('/invalid', { replace: true });
      } finally {
        setIsValidating(false);
      }
    };

    validateCodeAndAuth();
  }, [searchParams, navigate, user, loading, code]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImageToImgBB(file);
      setFormData(prev => ({ ...prev, photo: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.username.trim()) {
      toast.error('Name and Username are required');
      return;
    }

    if (!code || !user) {
      navigate('/invalid', { replace: true });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check for duplicate username
      const usernameExists = await checkUsernameExists(formData.username.trim(), user.uid);

      if (usernameExists) {
        toast.error('Username already exists');
        setIsSubmitting(false);
        return;
      }

      // Create profile
      const profile = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        email: user.email || formData.email.trim(),
        photo: formData.photo,
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        whatsapp: formData.whatsapp.trim(),
        phone: formData.phone.trim(),
        linkedCodes: [code],
        userId: user.uid
      };

      await createUserProfile(profile);
      await linkNFCCode(code, user.uid);
      
      // Update service worker cache with new profile
      updateProfileCache(profile);

      toast.success('Profile created successfully!');
      navigate(`/profile/${user.uid}`, { replace: true });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="card-glow w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-glow-purple mb-2">Create Your OYIEE Profile</h1>
          <p className="text-muted-foreground">Set up your digital identity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24 ring-2 ring-neon-purple cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={formData.photo} alt="Profile" />
              <AvatarFallback className="bg-secondary">
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-neon-purple border-t-transparent"></div>
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  setFormData(prev => ({ ...prev, username: value }));
                }}
                placeholder="Choose a username (lowercase letters and numbers only)"
                required
                className={`${!usernameValidation.isValid && formData.username ? 'border-red-500' : usernameValidation.isValid ? 'border-green-500' : ''}`}
              />
              {formData.username && (
                <div className={`text-sm mt-1 ${usernameValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isChecking ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600"></div>
                      Checking availability...
                    </span>
                  ) : (
                    usernameValidation.message
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="@username or full URL"
              />
            </div>

            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="Profile URL or username"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="Phone number with country code"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="neon"
            className="w-full"
            disabled={isSubmitting || !formData.name.trim() || !formData.username.trim()}
          >
            {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
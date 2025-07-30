import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserProfile, updateUserProfile, checkUsernameExists, checkEmailExists, UserProfile } from '@/lib/firestore';
import { uploadImageToImgBB } from '@/lib/imgbb';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { Camera, ArrowLeft } from 'lucide-react';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';

export const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    email: '',
    photo: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    facebook: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [usernameValidation, setUsernameValidation] = useState({ isValid: false, message: '' });
  
  const { isChecking } = useUsernameValidation({
    username: formData.username,
    currentUserId: userId,
    onValidationChange: (isValid, message) => {
      setUsernameValidation({ isValid, message });
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        navigate('/invalid', { replace: true });
        return;
      }

      try {
        const profile = await getUserProfile(userId);
        if (profile) {
          setFormData({
            name: profile.name,
            username: profile.username,
            bio: profile.bio,
            email: profile.email,
            photo: profile.photo,
            phone: profile.phone || '',
            whatsapp: profile.whatsapp || '',
            instagram: profile.instagram || '',
            facebook: profile.facebook || ''
          });
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
    
    if (!formData.name || !formData.username || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check for duplicates (excluding current user)
      const [usernameExists, emailExists] = await Promise.all([
        checkUsernameExists(formData.username, userId),
        checkEmailExists(formData.email, userId)
      ]);

      if (usernameExists) {
        toast.error('Username already exists');
        setIsSubmitting(false);
        return;
      }

      if (emailExists) {
        toast.error('Email already exists');
        setIsSubmitting(false);
        return;
      }

      // Update profile
      await updateUserProfile(userId!, formData);

      toast.success('Profile updated successfully!');
      navigate(`/profile/${userId}`, { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="card-glow w-full max-w-md p-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-glow-purple">Edit Profile</h1>
            <p className="text-muted-foreground">Update your information</p>
          </div>
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
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="Enter your WhatsApp number"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram ID</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="Enter your Instagram username"
              />
            </div>

            <div>
              <Label htmlFor="facebook">Facebook ID</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="Enter your Facebook username"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="neon"
            className="w-full"
            disabled={isSubmitting || !formData.name || !formData.username || !formData.email}
          >
            {isSubmitting ? 'Updating Profile...' : 'Update Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
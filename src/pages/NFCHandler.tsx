import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getNFCCode, getUserProfileByCode } from '@/lib/firestore';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const NFCHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleNFCCode = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        navigate('/invalid', { replace: true });
        return;
      }

      try {
        console.log('Processing NFC code:', code);
        const nfcData = await getNFCCode(code);
        console.log('NFC data:', nfcData);
        
        if (!nfcData) {
          // Code doesn't exist in database
          console.log('Code does not exist');
          navigate('/invalid', { replace: true });
          return;
        }

        if (nfcData.isLinked && nfcData.linkedTo) {
          // Code is linked, get user profile and redirect to view
          console.log('Code is linked to:', nfcData.linkedTo);
          const userProfile = await getUserProfileByCode(code);
          console.log('User profile found:', userProfile);
          if (userProfile) {
            navigate(`/profile/${userProfile.userId}`, { replace: true });
          } else {
            navigate('/invalid', { replace: true });
          }
        } else {
          // Code exists but not linked, redirect to auth first
          console.log('Code exists but not linked');
          navigate(`/auth?code=${code}`, { replace: true });
        }
      } catch (error) {
        console.error('Error handling NFC code:', error);
        navigate('/invalid', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    handleNFCCode();
  }, [searchParams, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return null;
};
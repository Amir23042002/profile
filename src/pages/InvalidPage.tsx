import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

export const InvalidPage = () => {
  const handleInstagramClick = () => {
    window.open('https://instagram.com/oyiee', '_blank');
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="card-glow w-full max-w-md p-8 text-center">
        <div className="space-y-6">
          <div className="text-6xl mb-4">⚠️</div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-glow-purple">Invalid NFC Code</h1>
            <p className="text-foreground/80 leading-relaxed">
              Please buy an official <span className="text-neon-cyan font-semibold">OYIEE T-shirt</span> to create your profile.
            </p>
          </div>

          <Button
            variant="neon-cyan"
            className="w-full"
            onClick={handleInstagramClick}
          >
            <Instagram className="w-4 h-4" />
            Visit OYIEE on Instagram
          </Button>
        </div>
      </Card>
    </div>
  );
};
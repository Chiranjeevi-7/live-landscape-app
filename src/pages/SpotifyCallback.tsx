import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The useSpotify hook on the Index page picks up the ?code= param
    // Just redirect back to home with the code
    const params = window.location.search;
    navigate(`/${params}`, { replace: true });
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <span className="text-sm text-muted-foreground">Connecting to Spotify...</span>
    </div>
  );
}

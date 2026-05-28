import React, { useEffect } from "react";

interface SocialEmbedProps {
  url: string;
  className?: string;
}

// Detect if URL is a social media embed and return embed info
export const getSocialEmbedInfo = (url: string): { type: string; embedUrl: string | null } => {
  if (!url || url.trim() === "") {
    return { type: "none", embedUrl: null };
  }

  // 1. YouTube
  const ytMatch = url.match(
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
);
  if (ytMatch && ytMatch[1]) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  // 2. Spotify (Fixed Embed URL Endpoint)
  const spotifyMatch = url.match(/open\.spotify\.com\/(track|playlist|album|artist|episode)\/([a-zA-Z0-9]+)/i);
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    return { type: "spotify", embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}` };
  }

  // 3. Twitter/X (Fixed capture group checking)
  const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/i);
  if (twitterMatch && twitterMatch[1]) {
    return { type: "twitter", embedUrl: url };
  }

  // 4. Instagram
  const instagramMatch = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/i);
  if (instagramMatch && instagramMatch[1]) {
    return { type: "instagram", embedUrl: `https://www.instagram.com/p/${instagramMatch[1]}/embed` };
  }

  // 5. TikTok
  const tiktokMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/i);
  if (tiktokMatch && tiktokMatch[1]) {
    return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
  }

  // 6. Regular image (Fixed to safely catch images wrapped with query parameters)
  if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(?:\?.*)?$/i)) {
    return { type: "image", embedUrl: url };
  }

  return { type: "link", embedUrl: null };
};

// Main SocialEmbed component
export default function SocialEmbed({ url, className = "" }: SocialEmbedProps) {
  const { type, embedUrl } = getSocialEmbedInfo(url);

  // Dynamic script loader for Twitter widgets
  useEffect(() => {
    if (type !== "twitter") return;

    // If script doesn't exist, inject it properly to the document head
    if (!(window as any).twttr) {
      const script = document.createElement("script");
      script.setAttribute("src", "https://platform.twitter.com/widgets.js");
      script.setAttribute("async", "true");
      script.setAttribute("charset", "utf-8");
      document.head.appendChild(script);
    } else {
      // If script already loaded globally, trigger processing refresh pass
      (window as any).twttr.widgets.load();
    }
  }, [type, embedUrl]);

  if (!embedUrl) return null;

  switch (type) {
    case "youtube":
      return (
        <div className={`ratio ratio-16x9 rounded overflow-hidden shadow-sm ${className}`}>
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allowFullScreen
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          ></iframe>
        </div>
      );

    case "spotify":
      const isTrack = url.includes("/track/");
      return (
        <div className={`rounded overflow-hidden ${className}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height={isTrack ? "80" : "352"}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ border: 0 }}
            title="Spotify content player"
          ></iframe>
        </div>
      );

    case "twitter":
      return (
        <div className={`d-flex justify-content-center w-100 overflow-auto ${className}`}>
          <blockquote className="twitter-tweet" data-theme="light" style={{ width: "100%", maxWidth: "550px" }}>
            <a href={url}>View post on X</a>
          </blockquote>
        </div>
      );

    case "instagram":
      return (
        <div className={`d-flex justify-content-center ${className}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="450"
            scrolling="no"
            style={{ maxWidth: '540px', margin: '0 auto', border: '1px solid #dee2e6', borderRadius: '8px' }}
            title="Instagram post frame"
          ></iframe>
        </div>
      );

    case "tiktok":
      return (
        <div className={`d-flex justify-content-center ${className}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="600"
            allowFullScreen
            style={{ maxWidth: '325px', margin: '0 auto', border: 'none' }}
            title="TikTok container view"
          ></iframe>
        </div>
      );

    case "image":
      return (
        <div className={className}>
          <img
            src={embedUrl}
            alt="User attached file media"
            className="img-fluid rounded border"
            style={{ maxHeight: "400px", width: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );

    default:
      return null;
  }
}
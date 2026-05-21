// First, create a separate component for the SEO head
// components/SEOHead.tsx
import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEOHead: React.FC<SEOProps> = ({
  title = "Kenya eFootball Rankings | Premier eFootball Tournament Platform in Kenya",
  description = "Join the largest eFootball tournament community in Kenya. Track rankings, participate in leagues, compete with top players, and win prizes. Official eFootball rankings and leaderboards.",
  keywords = "eFootball, Kenya eFootball, eFootball tournaments, PES, eFootball Kenya, football gaming, esports Kenya, eFootball rankings, gaming tournaments Nairobi",
  image = "https://computerscience.website/assets/efkl.png",
  url = "https://efootballkenyaleague.website/",
  type = "website"
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Kenya eFootball Rankings" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Kenya eFootball Hub" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Geo Tags for Kenya */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Nairobi, Kenya" />
      <meta name="geo.position" content="-1.286389;36.817223" />
      <meta name="ICBM" content="-1.286389, 36.817223" />
      
      {/* Language */}
      <meta httpEquiv="Content-Language" content="en-KE" />
    </Helmet>
  );
};

export default SEOHead;
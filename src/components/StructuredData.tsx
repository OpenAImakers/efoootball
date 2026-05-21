// Create a JSON-LD structured data component
// components/StructuredData.tsx
import React from "react";
import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
  rows: any[];
  leagues: any[];
}

const StructuredData: React.FC<StructuredDataProps> = ({ rows, leagues }) => {
  // Generate structured data for the organization
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kenya eFootball Rankings",
    "url": "https://efootballkenyaleague.website/",
    "logo": "https://computerscience.website/assets/efkl.png",
    "description": "Premier eFootball tournament platform in Kenya",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "KE",
      "addressLocality": "Nairobi"
    },
    "sameAs": [
      "https://twitter.com/kenyaefootball",
      "https://facebook.com/kenyaefootballhub"
    ]
  };

  // Generate structured data for the leaderboard
  const leaderboardData = {
    "@context": "https://schema.org",
    "@type": "Leaderboard",
    "name": "Kenya eFootball Rankings",
    "description": "Official rankings of top eFootball players in Kenya",
    "numberOfItems": rows.length,
    "itemListElement": rows.slice(0, 10).map((row, index) => ({
      "@type": "ListItem",
      "position": row.rank,
      "item": {
        "@type": "Person",
        "name": row.display_name,
        "identifier": row.username,
        "statistics": {
          "@type": "StatisticalPopulation",
          "wins": row.w,
          "losses": row.l,
          "winPercentage": row.win_rate
        }
      }
    }))
  };

  // Generate structured data for tournaments/leagues
  const tournamentsData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "eFootball Leagues in Kenya",
    "description": "Active eFootball leagues and tournaments",
    "numberOfItems": leagues.length,
    "itemListElement": leagues.map((league, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SportsEvent",
        "name": league.name,
        "description": league.short_intro,
        "organizer": {
          "@type": "Organization",
          "name": league.organizer
        },
        "location": {
          "@type": "Place",
          "name": league.country || "Kenya",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KE"
          }
        },
        "startDate": league.season || "2024"
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(leaderboardData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(tournamentsData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
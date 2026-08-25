"use client";

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    tier: 5 | 6 | 7;
    prize: number;
    entryFee: number;
    matchCount: number;
    currentPath: string;
    isPreview?: boolean;
}

interface TierSEOConfig {
    title: string;
    description: string;
    keywords: string[];
    longTailKeywords: string[];
    kenyaVariations: string[];
}

const getTierSEOConfig = (tier: 5 | 6 | 7, prize: number, entryFee: number): TierSEOConfig => {
    const tierConfigs: Record<number, TierSEOConfig> = {
        5: {
            title: `${tier} Games Jackpot - Win KSh ${prize.toLocaleString()} | eFootball Predictions Kenya`,
            description: `Predict ${tier} matches and win up to KSh ${prize.toLocaleString()} in the ${tier} games jackpot. Entry fee KSh ${entryFee}. Play now and test your football prediction skills.`,
            keywords: [
                `${tier} games jackpot`,
                `${tier} game jackpot`,
                `${tier} matches jackpot`,
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                'eFootball jackpot',
                'football predictions',
                'sports betting Kenya',
            ],
            longTailKeywords: [
                `${tier} games jackpot Kenya today`,
                `play ${tier} games jackpot Kenya`,
                `${tier} games jackpot predictions`,
                `${tier} games jackpot matches`,
                `${tier} games jackpot results Kenya`,
                `win ${tier} games jackpot`,
                `${tier} game jackpot tips`,
                `best ${tier} games jackpot predictions`,
            ],
            kenyaVariations: [
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                `jackpot ${tier} games Kenya`,
                `Kenya ${tier} games jackpot`,
            ],
        },
        6: {
            title: `${tier} Games Jackpot - Win KSh ${prize.toLocaleString()} | eFootball Predictions Kenya`,
            description: `Predict ${tier} matches and win up to KSh ${prize.toLocaleString()} in the ${tier} games jackpot. Entry fee KSh ${entryFee}. Join thousands of Kenyan players making predictions.`,
            keywords: [
                `${tier} games jackpot`,
                `${tier} game jackpot`,
                `${tier} matches jackpot`,
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                'eFootball jackpot',
                'football predictions',
                'sports betting Kenya',
            ],
            longTailKeywords: [
                `${tier} games jackpot Kenya today`,
                `play ${tier} games jackpot Kenya`,
                `${tier} games jackpot predictions`,
                `${tier} games jackpot matches`,
                `${tier} games jackpot results Kenya`,
                `win ${tier} games jackpot`,
                `${tier} game jackpot tips`,
                `best ${tier} games jackpot predictions`,
                `how to win ${tier} games jackpot`,
            ],
            kenyaVariations: [
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                `jackpot ${tier} games Kenya`,
                `Kenya ${tier} games jackpot`,
            ],
        },
        7: {
            title: `${tier} Games Jackpot - Win KSh ${prize.toLocaleString()} | eFootball Predictions Kenya`,
            description: `Predict ${tier} matches and win up to KSh ${prize.toLocaleString()} in the ${tier} games jackpot. Entry fee KSh ${entryFee}. The ultimate challenge for serious eFootball players.`,
            keywords: [
                `${tier} games jackpot`,
                `${tier} game jackpot`,
                `${tier} matches jackpot`,
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                'eFootball jackpot',
                'football predictions',
                'sports betting Kenya',
                'premium jackpot',
            ],
            longTailKeywords: [
                `${tier} games jackpot Kenya today`,
                `play ${tier} games jackpot Kenya`,
                `${tier} games jackpot predictions`,
                `${tier} games jackpot matches`,
                `${tier} games jackpot results Kenya`,
                `win ${tier} games jackpot`,
                `${tier} game jackpot tips`,
                `best ${tier} games jackpot predictions`,
                `how to win ${tier} games jackpot`,
                `${tier} game jackpot strategy`,
            ],
            kenyaVariations: [
                `${tier} games jackpot Kenya`,
                `${tier} game jackpot Kenya`,
                `${tier} matches jackpot Kenya`,
                `jackpot ${tier} games Kenya`,
                `Kenya ${tier} games jackpot`,
            ],
        },
    };

    return tierConfigs[tier] || tierConfigs[7];
};

const FootballTabSEO: React.FC<SEOProps> = ({
                                                tier,
                                                prize,
                                                entryFee,
                                                matchCount,
                                                currentPath,
                                                isPreview = true,
                                            }) => {
    const config = getTierSEOConfig(tier, prize, entryFee);

    // Build keywords string
    const allKeywords = [
        ...config.keywords,
        ...config.longTailKeywords.slice(0, 5),
        ...config.kenyaVariations,
        'eFootball Kenya',
        'jackpot predictions Kenya',
        'football jackpot',
        'sports predictions',
    ];
    const keywordsString = allKeywords.join(', ');

    // Build title with preview indicator if needed
    const title = isPreview
        ? `${config.title} (Preview)`
        : config.title;

    // Build description with match count
    const description = isPreview
        ? `Preview the ${tier} games jackpot with ${matchCount} matches. ${config.description}`
        : config.description;

    // Canonical URL
    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rankings.africa'}${currentPath}`;

    // Open Graph image URL (replace with actual image path)
    const ogImage = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rankings.africa'}/og-jackpot-${tier}.jpg`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
    <meta name="keywords" content={keywordsString} />

    {/* Canonical URL */}
    <link rel="canonical" href={canonicalUrl} />

    {/* Robots Meta (preview pages should be noindex) */}
    {isPreview ? (
        <meta name="robots" content="noindex, nofollow" />
    ) : (
        <meta name="robots" content="index, follow" />
    )}

    {/* Open Graph Meta Tags */}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Rankings Kenya" />
    <meta property="og:locale" content="en_KE" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
    <meta name="twitter:site" content="@RankingsKenya" />

        {/* Additional SEO Meta Tags */}
        <meta name="author" content="Rankings Kenya" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#030A1A" />

        {/* Geo/Location Meta Tags */}
        <meta name="geo.region" content="KE" />
    <meta name="geo.placename" content="Kenya" />
    <meta name="language" content="English" />

        {/* Structured Data - BreadcrumbList */}
        <script type="application/ld+json">
        {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rankings.africa'}`
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Jackpots",
                        "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rankings.africa'}/jackpots`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": `${tier} Games Jackpot`,
                        "item": canonicalUrl
                    }
                ]
            })}
        </script>

    {/* Structured Data - Product (Jackpot Prize) */}
    <script type="application/ld+json">
        {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": `${tier} Games Jackpot`,
                "description": `Predict ${tier} matches and win up to KSh ${prize.toLocaleString()}`,
                "offers": {
                    "@type": "Offer",
                    "price": entryFee,
                    "priceCurrency": "KES",
                    "availability": "https://schema.org/InStock",
                    "validFrom": new Date().toISOString()
                },
                "brand": {
                    "@type": "Brand",
                    "name": "Rankings Kenya"
                }
            })}
        </script>

    {/* Structured Data - SportsEvent for each match if available */}
    <script type="application/ld+json">
        {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SportsEvent",
                "name": `${tier} Games Jackpot`,
                "description": `Predict the outcome of ${tier} football matches`,
                "organizer": {
                    "@type": "Organization",
                    "name": "Rankings Kenya"
                },
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                "location": {
                    "@type": "VirtualLocation",
                    "url": canonicalUrl
                },
                "offers": {
                    "@type": "Offer",
                    "price": entryFee,
                    "priceCurrency": "KES"
                }
            })}
        </script>

    {/* Alternate language versions if needed */}
    <link rel="alternate" hrefLang="en" href={canonicalUrl} />
    </Helmet>
);
};

export default FootballTabSEO;
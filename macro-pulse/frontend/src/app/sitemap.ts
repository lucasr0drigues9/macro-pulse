import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://macroworldview.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/terafab`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/regimetracker`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/europe`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/china`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/world-order`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/disclaimer`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}

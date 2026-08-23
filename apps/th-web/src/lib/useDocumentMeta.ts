import { useEffect } from "react";

const SITE_NAME = "AssertQuest";

function setMetaTag(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setPropertyTag(property: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(path: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `https://assertquest.dev${path}`);
}

/** Sets the page title, meta description, canonical URL, and Open Graph tags for the current route. */
export function useDocumentMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
    document.title = fullTitle;
    setMetaTag("description", description);
    setCanonical(path);
    setPropertyTag("og:title", fullTitle);
    setPropertyTag("og:description", description);
    setPropertyTag("og:url", `https://assertquest.dev${path}`);
    setPropertyTag("og:type", "website");
    setPropertyTag("og:site_name", SITE_NAME);
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", description);
  }, [title, description, path]);
}

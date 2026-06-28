// Recebe um link comum de YouTube/Vimeo (o que a pessoa cola no navegador)
// e devolve o link de "embed" (formato que dá pra exibir dentro da página).
export function paraEmbedUrl(url: string): string {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (u.pathname.startsWith("/embed/")) {
        return url;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
    }

    if (u.hostname.includes("vimeo.com")) {
      if (u.hostname.includes("player.vimeo.com")) {
        return url;
      }
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }

    return url;
  } catch {
    return url;
  }
}

// Diz se o link é de um site externo (YouTube/Vimeo) — esses precisam de
// <iframe>. Um arquivo de vídeo enviado direto usa a tag <video> normal.
export function ehLinkExterno(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be") || u.hostname.includes("vimeo.com");
  } catch {
    return false;
  }
}

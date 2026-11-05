"""Server-only SaveAPI adapter for Instagram Stories and Facebook media."""

import os
from typing import Any
from urllib.parse import urlsplit

import httpx


class MediaProviderError(Exception):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def configured() -> bool:
    return bool(os.getenv("KIVAI_STORIES_API_KEY", "").strip())


def fetch_media(url: str, *, platform: str) -> list[dict[str, Any]]:
    """Return the ordered media list. Never expose credentials/upstream errors."""
    if platform not in {"instagram", "facebook"}:
        raise ValueError("Unsupported media platform")
    key = os.getenv("KIVAI_STORIES_API_KEY", "").strip()
    if not key:
        raise MediaProviderError("A consulta de mídias está temporariamente indisponível.", 503)
    try:
        with httpx.Client(timeout=httpx.Timeout(25, connect=5), follow_redirects=False) as client:
            response = client.get(
                f"https://api.saveapi.org/v1/{platform}",
                params={"url": url}, headers={"Authorization": f"Bearer {key}"},
            )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise MediaProviderError("Não foi possível consultar as mídias agora. Tente novamente.") from exc
    if not isinstance(payload, dict):
        raise MediaProviderError("O serviço de mídias retornou uma resposta inválida.")
    if response.status_code != 200 or payload.get("success") is not True:
        error = payload.get("error")
        code = error.get("code") if isinstance(error, dict) else None
        if code == "PRIVATE_CONTENT":
            raise MediaProviderError("Este conteúdo é privado. Apenas publicações públicas são compatíveis.", 403)
        if code == "MEDIA_NOT_FOUND":
            raise MediaProviderError("Não há mídias disponíveis neste link. Os arquivos podem ter expirado ou sido removidos.", 404)
        if code == "RATE_LIMITED":
            raise MediaProviderError("A consulta de mídias está ocupada. Tente novamente em alguns instantes.", 429)
        raise MediaProviderError("A consulta de mídias está temporariamente indisponível.", 503)

    medias = payload.get("medias")
    if not isinstance(medias, list) or not medias:
        raise MediaProviderError("Não há conteúdos públicos disponíveis neste link agora.", 404)
    # Fail closed instead of displaying a partial gallery or signing arbitrary URLs.
    for media in medias:
        if not isinstance(media, dict) or media.get("type") not in {"image", "video"}:
            raise MediaProviderError("O serviço de mídias retornou uma mídia incompatível.")
        try:
            parsed = urlsplit(media.get("url", ""))
            valid = parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password and parsed.port in (None, 443)
        except (TypeError, ValueError):
            valid = False
        if not valid:
            raise MediaProviderError("O serviço de mídias retornou uma origem inválida.")
    return medias


def fetch_stories(url: str) -> list[dict[str, Any]]:
    return fetch_media(url, platform="instagram")

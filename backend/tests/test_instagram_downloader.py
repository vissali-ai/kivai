import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from backend.instagram_downloader import (
    InstagramResolveError,
    MAX_VIDEO_BYTES,
    RemoteMedia,
    _photo_result_from_html,
    create_media_token,
    instagram_download_error,
    normalize_instagram_url,
    read_media_token,
)
from backend.main import app


class InstagramDownloaderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_normalizes_supported_public_urls(self):
        url, shortcode = normalize_instagram_url(
            "https://instagram.com/reel/ABC_123/?igsh=tracking#fragment"
        )
        self.assertEqual(url, "https://www.instagram.com/reel/ABC_123/")
        self.assertEqual(shortcode, "ABC_123")

    def test_rejects_private_profiles_and_unrelated_hosts(self):
        invalid = [
            "https://instagram.com/conta-privada/",
            "https://instagram.com/stories/perfil/123/",
            "https://instagram.com.example/reel/ABC123/",
            "http://instagram.com/reel/ABC123/",
            "https://user:password@instagram.com/reel/ABC123/",
        ]
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(InstagramResolveError):
                normalize_instagram_url(value)

    def test_explains_when_a_publication_has_no_video(self):
        error = instagram_download_error("ERROR: There is no video in this post")
        self.assertEqual(error.status_code, 422)
        self.assertIn("não encontramos um vídeo", error.detail.lower())

    def test_builds_download_for_public_photo_metadata(self):
        result = _photo_result_from_html(
            '<meta property="og:title" content="Foto de teste">'
            '<meta property="og:image" content="https://cdn.example.com/photo.jpg">'
            '<meta property="og:image:type" content="image/jpeg">'
            '<meta property="og:image:width" content="1080">'
            '<meta property="og:image:height" content="1350">',
            "PHOTO123",
        )
        self.assertEqual(result["items"][0]["format"], "JPG")
        self.assertEqual(result["items"][0]["width"], 1080)
        media = read_media_token(result["items"][0]["downloadToken"])
        self.assertEqual(media.kind, "image")
        self.assertEqual(media.filename, "instagram-PHOTO123.jpg")

    def test_signed_media_token_rejects_tampering(self):
        token = create_media_token(
            RemoteMedia(
                url="https://cdn.example.com/video.mp4",
                filename="instagram-ABC123.mp4",
                media_type="video/mp4",
                kind="video",
                headers={"Referer": "https://www.instagram.com/"},
                max_bytes=MAX_VIDEO_BYTES,
            )
        )
        media = read_media_token(token)
        self.assertEqual(media.filename, "instagram-ABC123.mp4")
        self.assertEqual(media.kind, "video")
        with self.assertRaises(InstagramResolveError):
            read_media_token(token[:-1] + ("A" if token[-1] != "A" else "B"))

    def test_resolve_requires_authorization_confirmation(self):
        response = self.client.post(
            "/instagram/resolve",
            json={"url": "https://www.instagram.com/reel/ABC123/", "authorized": False},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("autorização", response.json()["detail"])

    @patch("backend.main.resolve_instagram_public", new_callable=AsyncMock)
    def test_resolve_returns_extractor_result(self, resolve_mock):
        resolve_mock.return_value = {
            "source": "instagram",
            "shortcode": "ABC123",
            "title": "Vídeo público",
            "author": "perfil",
            "thumbnailToken": None,
            "items": [{"id": "ABC123-1", "filename": "instagram-ABC123.mp4", "downloadToken": "token"}],
            "expiresIn": 600,
        }
        response = self.client.post(
            "/instagram/resolve",
            json={"url": "https://www.instagram.com/reel/ABC123/", "authorized": True},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["filename"], "instagram-ABC123.mp4")


if __name__ == "__main__":
    unittest.main(verbosity=2)

import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from backend.instagram_downloader import (
    InstagramResolveError,
    MAX_VIDEO_BYTES,
    RemoteMedia,
    _og_media_result_from_html,
    _story_media_result_from_html,
    _extract_instagram_sync,
    _largest_image_candidate,
    create_media_token,
    instagram_download_error,
    normalize_instagram_url,
    read_media_token,
)
from backend.main import app


class InstagramDownloaderTests(unittest.TestCase):
    @patch("yt_dlp.YoutubeDL")
    def test_photo_and_mixed_carousel_preserve_every_item(self, downloader_class):
        downloader = downloader_class.return_value.__enter__.return_value
        photo = {"formats": [], "thumbnails": [
            {"url": "https://cdn.example.com/small.jpg", "width": 150, "height": 150},
            {"url": "https://cdn.example.com/original.jpg", "width": 1080, "height": 1350},
        ]}
        video = {"formats": [{"url": "https://cdn.example.com/movie.mp4", "height": 1080}]}
        downloader.sanitize_info.side_effect = lambda value: value
        for entries in ([photo], [photo, video] * 10):
            with self.subTest(count=len(entries)):
                downloader.extract_info.return_value = entries[0] if len(entries) == 1 else {"entries": entries}
                result = _extract_instagram_sync("https://www.instagram.com/p/PHOTO123/", "PHOTO123")
                self.assertEqual(len(result["items"]), len(entries))
                self.assertEqual(result["items"][0]["kind"], "image")
                self.assertEqual(read_media_token(result["items"][0]["downloadToken"]).url,
                                 "https://cdn.example.com/original.jpg")
        self.assertTrue(downloader_class.call_args.args[0]["ignore_no_formats_error"])
        self.assertFalse(downloader.extract_info.call_args.kwargs["process"])

    @patch("yt_dlp.YoutubeDL")
    def test_video_with_only_dash_does_not_download_cover_as_photo(self, downloader_class):
        downloader = downloader_class.return_value.__enter__.return_value
        downloader.extract_info.return_value = {"formats": [{
            "url": "https://cdn.example.com/segment.mp4", "protocol": "http_dash_segments",
            "format_id": "dash-video", "vcodec": "avc1", "acodec": "none",
        }], "thumbnail": "https://cdn.example.com/cover.jpg"}
        downloader.sanitize_info.side_effect = lambda value: value
        with self.assertRaises(InstagramResolveError):
            _extract_instagram_sync("https://www.instagram.com/p/VIDEO123/", "VIDEO123")

    def test_thumbnail_without_dimensions_uses_extractor_preference(self):
        self.assertEqual(_largest_image_candidate({"thumbnails": [
            {"url": "https://cdn.example.com/small.jpg"},
            {"url": "https://cdn.example.com/original.jpg"},
        ]})["url"], "https://cdn.example.com/original.jpg")

    def test_story_never_returns_an_unrelated_single_item(self):
        import json
        payload = {"reels_media": [{"items": [{"pk": "123456", "image_versions2": {
            "candidates": [{"url": "https://cdn.example.com/unrelated.jpg"}]
        }}]}]}
        with self.assertRaises(InstagramResolveError) as raised:
            _story_media_result_from_html(json.dumps({"xdt_api__v1__feed__reels_media": payload}), "perfil", "999999")
        self.assertEqual(raised.exception.status_code, 410)

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_normalizes_supported_public_urls(self):
        url, shortcode = normalize_instagram_url(
            "https://instagram.com/reel/ABC_123/?igsh=tracking#fragment"
        )
        self.assertEqual(url, "https://www.instagram.com/reel/ABC_123/")
        self.assertEqual(shortcode, "ABC_123")

    def test_normalizes_specific_story_url(self):
        url, story_id = normalize_instagram_url(
            "https://www.instagram.com/stories/perfil.teste/4015891499522208385/?utm_source=ig_story_item_share"
        )
        self.assertEqual(
            url,
            "https://www.instagram.com/stories/perfil.teste/4015891499522208385/",
        )
        self.assertEqual(story_id, "4015891499522208385")

    def test_rejects_private_profiles_and_unrelated_hosts(self):
        invalid = [
            "https://instagram.com/conta-privada/",
            "https://instagram.com/stories/perfil/",
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
        result = _og_media_result_from_html(
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

    def test_builds_download_for_story_html_metadata(self):
        payload = {
            "reels_media": [{
                "items": [{
                    "pk": "4015891499522208385",
                    "video_duration": 8.5,
                    "user": {"username": "perfil.teste"},
                    "video_versions": [{
                        "url": "https://cdn.example.com/story.mp4",
                        "width": 1080,
                        "height": 1920,
                    }],
                    "image_versions2": {"candidates": []},
                }],
            }],
        }
        html = (
            '<script type="application/json">'
            + '{"xdt_api__v1__feed__reels_media":'
            + __import__("json").dumps(payload)
            + "}</script>"
        )
        result = _story_media_result_from_html(
            html,
            "perfil.teste",
            "4015891499522208385",
        )
        self.assertEqual(result["contentType"], "story")
        self.assertEqual(result["items"][0]["format"], "MP4")
        media = read_media_token(result["items"][0]["downloadToken"])
        self.assertEqual(media.kind, "video")
        self.assertIn("instagram-story-", media.filename)

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

    @patch("backend.api.instagram.resolve_instagram_public", new_callable=AsyncMock)
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

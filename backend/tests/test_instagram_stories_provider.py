import json
import os
import unittest
from unittest.mock import patch

import httpx

from backend import instagram_stories_provider as provider
from backend.instagram_downloader import (
    _extract_instagram_sync, _story_media_result_from_html,
    normalize_instagram_url, read_media_token,
)


class StoriesTests(unittest.TestCase):
    def test_accepts_profile_stories_and_removes_tracking(self):
        self.assertEqual(normalize_instagram_url("https://www.instagram.com/stories/ivetesangalo/?igsh=abc"),
                         ("https://www.instagram.com/stories/ivetesangalo/", "ivetesangalo"))

    def test_html_profile_returns_all_images_and_videos_in_order(self):
        entries = [{"pk": str(100000 + i), "image_versions2": {"candidates": [
            {"url": f"https://cdn.example.com/{i}.jpg"}]}} for i in range(25)]
        entries[1]["video_versions"] = [{"url": "https://cdn.example.com/1.mp4"}]
        html = json.dumps({"xdt_api__v1__feed__reels_media": {"reels_media": [{"items": entries}]}})
        result = _story_media_result_from_html(html, "ivetesangalo", None)
        self.assertEqual(len(result["items"]), 25)
        self.assertEqual([i["kind"] for i in result["items"][:3]], ["image", "video", "image"])
        single = _story_media_result_from_html(html, "ivetesangalo", "100001")
        self.assertEqual(len(single["items"]), 1)
        self.assertEqual(single["items"][0]["kind"], "video")

    @patch.dict(os.environ, {"KIVAI_STORIES_API_KEY": "test-secret"})
    @patch("backend.instagram_stories_provider.httpx.Client")
    def test_provider_preserves_all_stories_and_single_url(self, client_class):
        client = client_class.return_value.__enter__.return_value
        medias = [{"type": "image", "ext": "jpg", "url": f"https://cdn.example.com/{i}.jpg"} for i in range(25)]
        medias[1] = {"type": "video", "ext": "mp4", "url": "https://cdn.example.com/1.mp4"}
        client.get.return_value = httpx.Response(200, json={"success": True, "medias": medias})
        url, identifier = normalize_instagram_url("https://www.instagram.com/stories/ivetesangalo/")
        result = _extract_instagram_sync(url, identifier)
        self.assertEqual(len(result["items"]), 25)
        self.assertEqual(result["items"][1]["kind"], "video")
        media = read_media_token(result["items"][1]["downloadToken"])
        self.assertEqual(media.url, medias[1]["url"])
        self.assertNotIn("Authorization", media.headers)
        self.assertNotIn("test-secret", json.dumps(result))
        client.get.return_value = httpx.Response(200, json={"success": True, "medias": [medias[1]]})
        single = "https://www.instagram.com/stories/ivetesangalo/402244464116218070/"
        result = _extract_instagram_sync(single, "402244464116218070")
        self.assertEqual(len(result["items"]), 1)
        self.assertEqual(client.get.call_args.kwargs["params"], {"url": single})

    @patch.dict(os.environ, {"KIVAI_STORIES_API_KEY": "test-secret"})
    @patch("backend.instagram_stories_provider.httpx.Client")
    def test_errors_do_not_leak_provider_response(self, client_class):
        client = client_class.return_value.__enter__.return_value
        for code, expected in [("PRIVATE_CONTENT", 403), ("MEDIA_NOT_FOUND", 404),
                               ("QUOTA_EXCEEDED", 503), ("INVALID_API_KEY", 503), ("RATE_LIMITED", 429)]:
            with self.subTest(code=code):
                client.get.return_value = httpx.Response(400, json={"success": False, "error": {"code": code, "message": "test-secret"}})
                with self.assertRaises(provider.StoriesProviderError) as raised:
                    provider.fetch_stories("https://www.instagram.com/stories/ivetesangalo/")
                self.assertEqual(raised.exception.status_code, expected)
                self.assertNotIn("test-secret", str(raised.exception))

    @patch.dict(os.environ, {"KIVAI_STORIES_API_KEY": "test-secret"})
    @patch("backend.instagram_stories_provider.httpx.Client")
    def test_rejects_bad_media_and_empty_results(self, client_class):
        client = client_class.return_value.__enter__.return_value
        for medias in ([], [{"type": "audio", "url": "https://cdn.example.com/audio.mp3"}],
                       [{"type": "image", "url": "http://cdn.example.com/image.jpg"}]):
            with self.subTest(medias=medias):
                client.get.return_value = httpx.Response(200, json={"success": True, "medias": medias})
                with self.assertRaises(provider.StoriesProviderError):
                    provider.fetch_stories("https://www.instagram.com/stories/ivetesangalo/")


if __name__ == "__main__":
    unittest.main()

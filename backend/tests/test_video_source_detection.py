"""Tests for platform auto-detection without making external requests."""
import unittest

from backend.api.video_sources import detect_video_source


class VideoSourceDetectionTests(unittest.TestCase):
    def test_detects_supported_platforms(self):
        cases = {
            "https://www.youtube.com/watch?v=abcdefghijk": ("youtube", "summary"),
            "https://www.instagram.com/reel/ABC123xyz/": ("instagram", "resolve"),
            "https://www.facebook.com/watch/?v=123456": ("facebook", "resolve"),
            "https://www.tiktok.com/@creator/video/123456789": ("tiktok", "resolve"),
            "https://vimeo.com/123456789": ("vimeo", "not_available"),
            "https://cdn.example.com/video.mp4": ("direct", "not_validated"),
        }
        for url, expected in cases.items():
            with self.subTest(url=url):
                result = detect_video_source(url)
                self.assertEqual((result["source"], result["capability"]), expected)

    def test_unknown_host_is_not_treated_as_direct_video(self):
        result = detect_video_source("https://example.com/watch/123")
        self.assertEqual(result["source"], "unknown")
        self.assertEqual(result["capability"], "not_supported")

    def test_rejects_http_and_credentials(self):
        for url in (
            "http://www.youtube.com/watch?v=abcdefghijk",
            "https://user:pass@www.youtube.com/watch?v=abcdefghijk",
            "https://www.youtube.com:8443/watch?v=abcdefghijk",
        ):
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    detect_video_source(url)


if __name__ == "__main__":
    unittest.main()

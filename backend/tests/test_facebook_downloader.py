import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.api.facebook import router
from backend.facebook_downloader import normalize_facebook_url, _resolve_facebook
from backend.instagram_downloader import InstagramResolveError, read_media_token
from backend.saveapi_provider import MediaProviderError


class FacebookTests(unittest.TestCase):
    def test_preserves_identifiers_and_accepts_short_links(self):
        self.assertEqual(normalize_facebook_url('https://www.facebook.com/watch/?v=123&fbclid=tracking#x'),
                         'https://www.facebook.com/watch/?v=123')
        self.assertEqual(normalize_facebook_url('https://m.facebook.com/story.php?id=12&story_fbid=34'),
                         'https://m.facebook.com/story.php?id=12&story_fbid=34')
        self.assertEqual(normalize_facebook_url('https://fb.watch/abc/'), 'https://fb.watch/abc/')

    def test_rejects_untrusted_links(self):
        for url in ['https://facebook.com.evil.test/video', 'http://facebook.com/video',
                    'https://user:pass@facebook.com/video', 'https://facebook.com:123/video',
                    'https://facebook.com:bad/video', 'https://facebook.com/', 'https://127.0.0.1/video']:
            with self.subTest(url=url), self.assertRaises(InstagramResolveError):
                normalize_facebook_url(url)

    @patch.dict(os.environ, {'KIVAI_DOWNLOAD_TOKEN_SECRET': 'test-only-secret'})
    @patch('backend.saveapi_provider.fetch_media')
    def test_returns_videos_without_thumbnail_and_scoped_signed_download(self, fetch):
        fetch.return_value = [{'type': 'image', 'url': 'https://cdn.example.com/thumb.jpg'},
                              {'type': 'video', 'url': 'https://cdn.example.com/video.mp4', 'ext': 'mp4', 'size_mb': 2}]
        result = _resolve_facebook('https://fb.watch/abc/')
        fetch.assert_called_once_with('https://fb.watch/abc/', platform='facebook')
        self.assertEqual(len(result['items']), 1)
        item = result['items'][0]
        self.assertEqual(item['size'], 2 * 1024 * 1024)
        media = read_media_token(item['downloadToken'])
        self.assertTrue(media.filename.startswith('facebook-'))
        self.assertEqual(media.headers, {})
        self.assertEqual(media.url, 'https://cdn.example.com/video.mp4')

    @patch('backend.saveapi_provider.fetch_media')
    def test_handles_private_images_only_and_oversized_videos(self, fetch):
        fetch.side_effect = MediaProviderError('Conteúdo privado', 403)
        with self.assertRaises(InstagramResolveError) as error:
            _resolve_facebook('https://fb.watch/abc/')
        self.assertEqual(error.exception.status_code, 403)
        fetch.side_effect = None
        for media, status in [({'type': 'image', 'url': 'https://cdn.example.com/a.jpg'}, 422),
                              ({'type': 'video', 'url': 'https://cdn.example.com/a.mp4', 'size_mb': 201}, 413)]:
            fetch.return_value = [media]
            with self.assertRaises(InstagramResolveError) as error:
                _resolve_facebook('https://fb.watch/abc/')
            self.assertEqual(error.exception.status_code, status)

    def test_http_validation_and_invalid_download(self):
        app = FastAPI()
        app.include_router(router)
        with TestClient(app) as client:
            self.assertEqual(client.post('/facebook/resolve', json={'url': 'https://evil.test/video'}).status_code, 422)
            self.assertEqual(client.get('/facebook/media/invalid').status_code, 410)


if __name__ == '__main__':
    unittest.main()

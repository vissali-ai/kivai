import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from imageio_ffmpeg import get_ffmpeg_exe

from backend.main import app, detailed_video_metadata


class Mp4ToAviTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.ffmpeg = get_ffmpeg_exe()
        cls.temporary_directory = tempfile.TemporaryDirectory(prefix="kivai-mp4-avi-tests-")
        cls.fixtures = Path(cls.temporary_directory.name)
        cls.horizontal = cls.fixtures / "horizontal-com-audio.mp4"
        cls.vertical = cls.fixtures / "vertical-sem-audio.mp4"
        cls.compatible = cls.fixtures / "mpeg4-mp3.mp4"
        cls._create_video(cls.horizontal, "640x360", 30, video_codec="libx264", audio_codec="aac")
        cls._create_video(cls.vertical, "360x640", 24, video_codec="libx264", audio_codec=None)
        cls._create_video(cls.compatible, "320x240", 25, video_codec="mpeg4", audio_codec="libmp3lame")

    @classmethod
    def tearDownClass(cls):
        cls.temporary_directory.cleanup()

    @classmethod
    def _create_video(cls, path: Path, size: str, fps: int, *, video_codec: str, audio_codec: str | None):
        command = [
            cls.ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", f"testsrc2=size={size}:rate={fps}:duration=1",
        ]
        if audio_codec:
            command.extend(["-f", "lavfi", "-i", "sine=frequency=1000:duration=1", "-shortest"])
        command.extend(["-c:v", video_codec, "-pix_fmt", "yuv420p"])
        if audio_codec:
            command.extend(["-c:a", audio_codec])
        else:
            command.append("-an")
        command.extend(["-movflags", "+faststart", os.fspath(path)])
        subprocess.run(command, check=True, capture_output=True)

    def _upload(self, endpoint: str, path: Path, *, data=None):
        with path.open("rb") as source:
            return self.client.post(
                endpoint,
                data=data or {},
                files={"file": (path.name, source, "video/mp4")},
            )

    def _probe_result(self, content: bytes):
        output = self.fixtures / "resultado.avi"
        output.write_bytes(content)
        completed = subprocess.run(
            [self.ffmpeg, "-hide_banner", "-i", os.fspath(output)],
            check=False,
            capture_output=True,
        )
        return detailed_video_metadata(completed.stderr.decode("utf-8", errors="replace"))

    def test_transcodes_h264_aac_to_valid_avi(self):
        inspected = self._upload("/video/mp4-to-avi/inspect", self.horizontal)
        self.assertEqual(inspected.status_code, 200)
        self.assertEqual(inspected.json()["strategy"], "transcode")

        converted = self._upload("/video/mp4-to-avi", self.horizontal)
        self.assertEqual(converted.status_code, 200)
        self.assertEqual(converted.headers["content-type"], "video/x-msvideo")
        self.assertEqual(converted.headers["x-conversion-strategy"], "transcode")
        self.assertEqual(converted.content[:4], b"RIFF")
        self.assertEqual(converted.content[8:12], b"AVI ")
        metadata = self._probe_result(converted.content)
        self.assertEqual(metadata["format"], "avi")
        self.assertEqual((metadata["width"], metadata["height"]), (640, 360))
        self.assertEqual(metadata["videoCodec"], "mpeg4")
        self.assertEqual(metadata["audioCodec"], "mp3")

    def test_remuxes_compatible_mpeg4_mp3(self):
        inspected = self._upload("/video/mp4-to-avi/inspect", self.compatible)
        self.assertEqual(inspected.status_code, 200)
        self.assertEqual(inspected.json()["strategy"], "remux")

        converted = self._upload("/video/mp4-to-avi", self.compatible)
        self.assertEqual(converted.status_code, 200)
        self.assertEqual(converted.headers["x-conversion-strategy"], "remux")
        metadata = self._probe_result(converted.content)
        self.assertEqual(metadata["videoCodec"], "mpeg4")
        self.assertEqual(metadata["audioCodec"], "mp3")

    def test_preserves_vertical_video_without_audio_and_reduces_resolution(self):
        converted = self._upload(
            "/video/mp4-to-avi",
            self.vertical,
            data={"quality": "small", "resolution": "480", "fps": "24"},
        )
        self.assertEqual(converted.status_code, 200)
        self.assertEqual(converted.headers["x-audio-codec"], "none")
        metadata = self._probe_result(converted.content)
        self.assertEqual((metadata["width"], metadata["height"]), (270, 480))
        self.assertFalse(metadata["hasAudio"])

    def test_rejects_corrupted_mp4(self):
        corrupted = self.fixtures / "corrompido.mp4"
        corrupted.write_bytes(b"not-an-mp4")
        response = self._upload("/video/mp4-to-avi/inspect", corrupted)
        self.assertEqual(response.status_code, 415)


if __name__ == "__main__":
    unittest.main(verbosity=2)

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from imageio_ffmpeg import get_ffmpeg_exe

from backend.main import app, detailed_video_metadata


class Mp4ToMovTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.ffmpeg = get_ffmpeg_exe()
        cls.temporary_directory = tempfile.TemporaryDirectory(prefix="kivai-mp4-mov-tests-")
        cls.fixtures = Path(cls.temporary_directory.name)
        cls.sample = cls.fixtures / "horizontal-com-audio.mp4"
        cls.vertical = cls.fixtures / "vertical-sem-audio.mp4"
        cls._create_video(cls.sample, "640x360", 30, with_audio=True)
        cls._create_video(cls.vertical, "360x640", 24, with_audio=False)

    @classmethod
    def tearDownClass(cls):
        cls.temporary_directory.cleanup()

    @classmethod
    def _create_video(cls, path: Path, size: str, fps: int, *, with_audio: bool):
        command = [
            cls.ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"testsrc2=size={size}:rate={fps}:duration=1",
        ]
        if with_audio:
            command.extend(["-f", "lavfi", "-i", "sine=frequency=1000:duration=1", "-shortest"])
        command.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p"])
        if with_audio:
            command.extend(["-c:a", "aac"])
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
        output = self.fixtures / "resultado.mov"
        output.write_bytes(content)
        completed = subprocess.run(
            [self.ffmpeg, "-hide_banner", "-i", os.fspath(output)],
            check=False,
            capture_output=True,
        )
        return detailed_video_metadata(completed.stderr.decode("utf-8", errors="replace"))

    def test_inspect_and_remux_preserve_video_and_audio(self):
        inspected = self._upload("/video/mp4-to-mov/inspect", self.sample)
        self.assertEqual(inspected.status_code, 200)
        self.assertEqual(inspected.json()["strategy"], "remux")
        self.assertEqual(inspected.json()["videoCodec"], "h264")
        self.assertEqual(inspected.json()["audioCodec"], "aac")

        converted = self._upload("/video/mp4-to-mov", self.sample)
        self.assertEqual(converted.status_code, 200)
        self.assertEqual(converted.headers["content-type"], "video/quicktime")
        self.assertEqual(converted.headers["x-conversion-strategy"], "remux")
        self.assertIn(b"ftypqt  ", converted.content[:64])
        metadata = self._probe_result(converted.content)
        self.assertEqual((metadata["width"], metadata["height"]), (640, 360))
        self.assertEqual(metadata["videoCodec"], "h264")
        self.assertEqual(metadata["audioCodec"], "aac")

    def test_transcode_reduces_resolution_and_supports_video_without_audio(self):
        converted = self._upload(
            "/video/mp4-to-mov",
            self.vertical,
            data={"quality": "small", "resolution": "480", "fps": "24"},
        )
        self.assertEqual(converted.status_code, 200)
        self.assertEqual(converted.headers["x-conversion-strategy"], "transcode")
        self.assertEqual(converted.headers["x-audio-codec"], "none")
        metadata = self._probe_result(converted.content)
        self.assertEqual((metadata["width"], metadata["height"]), (270, 480))
        self.assertFalse(metadata["hasAudio"])

    def test_rejects_corrupted_mp4(self):
        corrupted = self.fixtures / "corrompido.mp4"
        corrupted.write_bytes(b"not-an-mp4")
        response = self._upload("/video/mp4-to-mov/inspect", corrupted)
        self.assertEqual(response.status_code, 415)


if __name__ == "__main__":
    unittest.main(verbosity=2)

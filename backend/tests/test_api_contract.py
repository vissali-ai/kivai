"""Protect the public contract and both supported ASGI import modes."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

from fastapi.testclient import TestClient

from backend.main import app


class ApiContractTests(unittest.TestCase):
    def test_openapi_matches_contract_before_module_extraction(self):
        baseline = Path(__file__).parent / "fixtures" / "openapi.json"
        self.assertEqual(app.openapi(), json.loads(baseline.read_text(encoding="utf-8")))

    def test_health_and_cors_remain_available(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/").json(), {"status": "online", "servico": "Kivai Backend"})
            response = client.get("/health", headers={"Origin": "https://kivai.com.br"})
            self.assertEqual(response.json(), {"status": "ok", "device": "cpu"})
            self.assertEqual(response.headers["access-control-allow-origin"], "https://kivai.com.br")
            self.assertIn("X-Conversion-Strategy", response.headers["access-control-expose-headers"])
            denied = client.get("/health", headers={"Origin": "https://example.com"})
            self.assertNotIn("access-control-allow-origin", denied.headers)

    def test_railway_entry_point_has_same_contract_without_loading_model(self):
        result = subprocess.run(
            [sys.executable, "-c", "import json, sys; from main import app; assert 'torch' not in sys.modules; print(json.dumps(app.openapi()))"],
            cwd=Path(__file__).resolve().parents[1],
            capture_output=True, text=True, check=True, timeout=30,
        )
        self.assertEqual(json.loads(result.stdout), app.openapi())

    def test_html_validation_rejects_invalid_margins_before_browser_start(self):
        with TestClient(app) as client:
            response = client.post("/html-to-pdf", json={"html": "<p>Teste</p>", "margins": {"top": -1}})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["detail"], "Margens inválidas.")

    def test_background_validation_rejects_invalid_image_before_model_load(self):
        with TestClient(app) as client:
            response = client.post("/remove-background", files={"file": ("broken.png", b"invalid", "image/png")})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["detail"], "O arquivo enviado não é uma imagem válida.")


if __name__ == "__main__":
    unittest.main()

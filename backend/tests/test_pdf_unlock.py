import io
import unittest

from fastapi.testclient import TestClient
from pypdf import PdfReader, PdfWriter
from pypdf.constants import UserAccessPermissions

from backend.main import app


class PdfUnlockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @staticmethod
    def _pdf(*, user_password=None, owner_password=None, restrictions=False, algorithm=None):
        writer = PdfWriter()
        writer.add_blank_page(width=200, height=200)
        if user_password is not None:
            kwargs = {}
            if restrictions:
                kwargs["permissions_flag"] = UserAccessPermissions.PRINT
            if algorithm:
                kwargs["algorithm"] = algorithm
            writer.encrypt(
                user_password=user_password,
                owner_password=owner_password,
                **kwargs,
            )
        output = io.BytesIO()
        writer.write(output)
        return output.getvalue()

    def _inspect(self, content):
        return self.client.post(
            "/pdf-unlock/inspect",
            files={"file": ("documento.pdf", content, "application/pdf")},
        )

    def _unlock(self, content, password=""):
        return self.client.post(
            "/pdf-unlock",
            data={"password": password},
            files={"file": ("documento.pdf", content, "application/pdf")},
        )

    def test_identifies_unprotected_pdf(self):
        response = self._inspect(self._pdf())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "protection": "none",
            "passwordRequired": False,
            "pageCount": 1,
        })

    def test_rejects_wrong_password_and_unlocks_with_correct_password(self):
        content = self._pdf(user_password="segredo", owner_password="proprietario")
        inspected = self._inspect(content)
        self.assertEqual(inspected.status_code, 200)
        self.assertEqual(inspected.json()["protection"], "password")
        self.assertTrue(inspected.json()["passwordRequired"])

        wrong = self._unlock(content, "incorreta")
        self.assertEqual(wrong.status_code, 401)

        unlocked = self._unlock(content, "segredo")
        self.assertEqual(unlocked.status_code, 200)
        self.assertEqual(unlocked.headers["content-type"], "application/pdf")
        self.assertEqual(unlocked.headers["x-pdf-page-count"], "1")
        result = PdfReader(io.BytesIO(unlocked.content), strict=False)
        self.assertFalse(result.is_encrypted)
        self.assertEqual(len(result.pages), 1)

    def test_unlocks_permission_restrictions_without_open_password(self):
        content = self._pdf(
            user_password="",
            owner_password="proprietario",
            restrictions=True,
        )
        inspected = self._inspect(content)
        self.assertEqual(inspected.status_code, 200)
        self.assertEqual(inspected.json()["protection"], "restrictions")
        self.assertFalse(inspected.json()["passwordRequired"])

        unlocked = self._unlock(content)
        self.assertEqual(unlocked.status_code, 200)
        result = PdfReader(io.BytesIO(unlocked.content), strict=False)
        self.assertFalse(result.is_encrypted)
        self.assertEqual(len(result.pages), 1)

    def test_supported_encryption_algorithms_generate_unencrypted_output(self):
        for algorithm in ("RC4-40", "RC4-128", "AES-128", "AES-256"):
            with self.subTest(algorithm=algorithm):
                content = self._pdf(
                    user_password="segredo",
                    owner_password="proprietario",
                    algorithm=algorithm,
                )
                unlocked = self._unlock(content, "segredo")
                self.assertEqual(unlocked.status_code, 200)
                result = PdfReader(io.BytesIO(unlocked.content), strict=False)
                self.assertFalse(result.is_encrypted)
                self.assertEqual(len(result.pages), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)

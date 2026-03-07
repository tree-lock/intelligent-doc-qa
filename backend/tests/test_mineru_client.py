"""MinerU 客户端单元测试。"""

import unittest
from app.services.mineru_client import (
    is_mineru_supported,
    validate_mineru_file,
)


class MinerUClientTests(unittest.TestCase):
    def test_is_mineru_supported_pdf(self) -> None:
        self.assertTrue(is_mineru_supported("doc.pdf"))
        self.assertTrue(is_mineru_supported("DOC.PDF"))

    def test_is_mineru_supported_word(self) -> None:
        self.assertTrue(is_mineru_supported("report.docx"))
        self.assertTrue(is_mineru_supported("old.doc"))

    def test_is_mineru_supported_ppt(self) -> None:
        self.assertTrue(is_mineru_supported("slides.pptx"))
        self.assertTrue(is_mineru_supported("slides.ppt"))

    def test_is_mineru_supported_images(self) -> None:
        self.assertTrue(is_mineru_supported("img.png"))
        self.assertTrue(is_mineru_supported("photo.jpg"))
        self.assertTrue(is_mineru_supported("photo.jpeg"))

    def test_is_mineru_supported_html(self) -> None:
        self.assertTrue(is_mineru_supported("page.html"))

    def test_is_mineru_supported_rejects_txt_md(self) -> None:
        self.assertFalse(is_mineru_supported("note.txt"))
        self.assertFalse(is_mineru_supported("readme.md"))

    def test_is_mineru_supported_rejects_unknown(self) -> None:
        self.assertFalse(is_mineru_supported("data.csv"))
        self.assertFalse(is_mineru_supported("archive.zip"))

    def test_validate_mineru_file_ok(self) -> None:
        validate_mineru_file("doc.pdf", 1024)

    def test_validate_mineru_file_unsupported_format(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            validate_mineru_file("data.csv", 1024)
        self.assertIn("格式不支持", str(ctx.exception))

    def test_validate_mineru_file_exceeds_size(self) -> None:
        max_bytes = 200 * 1024 * 1024
        with self.assertRaises(ValueError) as ctx:
            validate_mineru_file("large.pdf", max_bytes + 1)
        self.assertIn("200MB", str(ctx.exception))

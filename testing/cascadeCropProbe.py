#!/usr/bin/env python3
"""Headless cascade mask bounds probe + screenshot capture."""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HASHES = {
    "1444": "0xe2f57b77fd2aa05a6d292faf2b787a05717986b5b63d4683aae4d14401d97c91",
    "1514": "0x508b062cb1b54f90c9a3ba1fcae9de76d67a2bd507fb5bdbb18a795456172e65",
    "1515": "0x2d4b2b637069b8f0fd9210fbd309c75bbbfcb7cfcf15374d119e867f376c9f21",
    "1517": "0xf601062047508e6c3ccfa0cdda83180c1d7248c7c429debbbc47c1c7313c234b",
    "1519": "0x9dc995ab1bf1ddc93ebfacc9f627329a2b85cfb6c9e55c784ee33116c76e6bb5",
    "1520": "0xa6efe5a2ebefcff2df942e3a7ccb491bff95a650647b1eed7852d55f535eeefd",
}
ARTWORK = {"x": "0", "y": "0", "width": "100", "height": "200"}
OUT = ROOT / "testing" / "cascade-crop-screenshots"
OUT.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def start_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, server.server_address[1]


def probe(page, label, hash_value, port):
    page.goto(f"http://127.0.0.1:{port}/index.html", wait_until="networkidle", timeout=120000)
    page.wait_for_function("typeof GRID !== 'undefined'", timeout=120000)
    page.evaluate(
        """async (h) => {
            if (typeof protoBatch?.teardown === 'function') protoBatch.teardown()
            await new Promise(r => setTimeout(r, 100))
            protoBatch.buildFromHash(h)
            await new Promise(r => setTimeout(r, 2000))
        }""",
        hash_value,
    )

    data = page.evaluate(
        """() => {
            const artwork = { x: '0', y: '0', width: '100', height: '200' }
            const maskRects = [...document.querySelectorAll('[id$="-maskRect"]')].map(el => ({
                id: el.id,
                x: el.getAttribute('x'), y: el.getAttribute('y'),
                width: el.getAttribute('width'), height: el.getAttribute('height'),
            }))
            const finalMasks = [...document.querySelectorAll('mask[id$="-mask"]')].map(el => ({
                id: el.id,
                x: el.getAttribute('x'), y: el.getAttribute('y'),
                width: el.getAttribute('width'), height: el.getAttribute('height'),
            }))
            const cellTight = maskRects.filter(r =>
                !(r.x === artwork.x && r.y === artwork.y && r.width === artwork.width && r.height === artwork.height)
            )
            const comboSvgs = [...document.querySelectorAll('svg.masked')].map(el => ({
                id: el.id,
                viewBox: el.getAttribute('viewBox'),
                width: el.getAttribute('width'),
                height: el.getAttribute('height'),
                overflow: el.getAttribute('overflow'),
            }))
            return { maskRects, finalMasks, cellTight, comboSvgs, maskRectCount: maskRects.length }
        }"""
    )

    page.locator("#BG").screenshot(path=str(OUT / f"{label}-BG.png"))
    data["screenshot"] = str(OUT / f"{label}.png")
    data["allMaskRectsArtworkSized"] = len(data.get("cellTight", [])) == 0
    return data


def main():
    server, port = start_server()
    results = {}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 800, "height": 1400})
            for label, hash_value in HASHES.items():
                try:
                    results[label] = probe(page, label, hash_value, port)
                except Exception as exc:
                    results[label] = {"error": str(exc)}

            browser.close()
    finally:
        server.shutdown()

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

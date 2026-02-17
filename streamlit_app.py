from __future__ import annotations

import atexit
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import streamlit as st
import streamlit.components.v1 as components


APP_ROOT = Path(__file__).resolve().parent
DEFAULT_URL = os.getenv("LIFEOS_URL", "http://127.0.0.1:3001")
AUTO_START = os.getenv("LIFEOS_AUTOSTART", "1") == "1"


def url_is_live(url: str, timeout: float = 1.5) -> bool:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout):
            return True
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False


def start_next_dev(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 3001

    if parsed.hostname not in {"127.0.0.1", "localhost"}:
        return False

    existing = st.session_state.get("next_proc")
    if existing is not None and existing.poll() is None:
        return True

    cmd = [
        "npm",
        "run",
        "dev",
        "--workspaces=false",
        "--",
        "-H",
        host,
        "-p",
        str(port),
    ]

    proc = subprocess.Popen(
        cmd,
        cwd=str(APP_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    st.session_state["next_proc"] = proc

    def _shutdown() -> None:
        p = st.session_state.get("next_proc")
        if p is not None and p.poll() is None:
            p.terminate()

    atexit.register(_shutdown)
    return True


st.set_page_config(page_title="LifeOS on Streamlit", page_icon="⚡", layout="wide")

st.markdown("## LifeOS")
st.caption("Interactive operating system for values, habits, decisions, and goals.")

target_url = DEFAULT_URL

if AUTO_START and not url_is_live(target_url):
    started = start_next_dev(target_url)
    if started:
        for _ in range(45):
            if url_is_live(target_url):
                break
            time.sleep(0.4)

is_live = url_is_live(target_url)

toolbar = st.columns([1, 1, 4])
with toolbar[0]:
    if st.button("Reload"):
        st.rerun()
with toolbar[1]:
    st.link_button("Open Direct", target_url)
with toolbar[2]:
    if is_live:
        st.success(f"LifeOS is live at {target_url}")
    else:
        st.warning(
            "LifeOS backend is not reachable. "
            "If running in Streamlit Cloud, set LIFEOS_URL to a hosted web URL."
        )

if is_live:
    components.iframe(target_url, height=1400, scrolling=True)
else:
    st.info(
        "Could not load LifeOS app automatically. "
        "Start Next.js manually with `npm run dev -- -- -H 127.0.0.1 -p 3001` "
        "or set `LIFEOS_URL` to a deployed URL."
    )

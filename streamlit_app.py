from __future__ import annotations

import atexit
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import streamlit as st
import streamlit.components.v1 as components


APP_ROOT = Path(__file__).resolve().parent
IS_STREAMLIT_CLOUD = str(APP_ROOT).startswith("/mount/src")
DEFAULT_GH_OWNER = os.getenv("LIFEOS_GH_OWNER", "navybrown1").strip()


def infer_github_pages_url() -> str:
    repo = os.getenv("GITHUB_REPOSITORY", "").strip()
    owner = ""
    name = ""
    if repo and "/" in repo:
        owner, name = repo.split("/", 1)
    if not owner or not name:
        try:
            remote = (
                subprocess.check_output(
                    ["git", "config", "--get", "remote.origin.url"],
                    cwd=str(APP_ROOT),
                    text=True,
                )
                .strip()
            )
        except Exception:
            remote = ""
        match = re.search(r"github\.com[:/]([^/]+)/([^/.]+)(?:\.git)?$", remote)
        if match:
            owner, name = match.group(1), match.group(2)
    if not owner:
        owner = os.getenv("GITHUB_ACTOR", "").strip() or DEFAULT_GH_OWNER
    if not name:
        name = APP_ROOT.name
    if owner and name:
        return f"https://{owner}.github.io/{name}/"
    return ""


def resolve_target_url() -> str:
    env_url = os.getenv("LIFEOS_URL", "").strip()
    if env_url:
        return env_url
    try:
        secret_url = str(st.secrets.get("LIFEOS_URL", "")).strip()
        if secret_url:
            return secret_url
    except Exception:
        pass
    if IS_STREAMLIT_CLOUD:
        pages_url = infer_github_pages_url()
        if pages_url:
            return pages_url
    return "http://127.0.0.1:3001"


DEFAULT_URL = resolve_target_url()
AUTO_START = os.getenv("LIFEOS_AUTOSTART", "0" if IS_STREAMLIT_CLOUD else "1") == "1"


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

    npm_bin = shutil.which("npm")
    if not npm_bin:
        st.session_state["start_error"] = "npm not found in this runtime."
        return False

    existing = st.session_state.get("next_proc")
    if existing is not None and existing.poll() is None:
        return True

    cmd = [
        npm_bin,
        "run",
        "dev",
        "--workspaces=false",
        "--",
        "-H",
        host,
        "-p",
        str(port),
    ]

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(APP_ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
        )
    except (FileNotFoundError, OSError) as exc:
        st.session_state["start_error"] = f"Could not start Next.js ({exc})."
        return False

    st.session_state["next_proc"] = proc
    st.session_state.pop("start_error", None)

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
start_error = ""

if AUTO_START and not url_is_live(target_url):
    started = start_next_dev(target_url)
    start_error = st.session_state.get("start_error", "")
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

if start_error:
    st.error(start_error)

if is_live:
    components.iframe(target_url, height=1400, scrolling=True)
else:
    if IS_STREAMLIT_CLOUD:
        st.info(
            "Streamlit Cloud cannot run this Next.js app directly in this wrapper environment. "
            "Deploy the web app to a public URL (Vercel/Netlify/etc.), then set `LIFEOS_URL` "
            "in Streamlit app Secrets and redeploy."
        )
        st.code('LIFEOS_URL = "https://your-lifeos-web-url.example.com"')
    else:
        st.info(
            "Could not load LifeOS app automatically. "
            "Start Next.js manually with `npm run dev -- -- -H 127.0.0.1 -p 3001` "
            "or set `LIFEOS_URL` to a deployed URL."
        )

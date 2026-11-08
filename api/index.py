import sys
import os

# Add backend directory to sys.path so app.main and all internal modules resolve cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Vercel Serverless Function entrypoint
# The ASGI application 'app' is detected automatically by Vercel's Python runtime

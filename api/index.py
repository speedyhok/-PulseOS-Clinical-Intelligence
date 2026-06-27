import sys
from pathlib import Path

# Append root directory to sys.path so app and mcp_servers can be imported
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.server import app

# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for SQLingo backend
Bundles FastAPI + all dependencies into a single executable
"""

import os
import sys

block_cipher = None

# Collect all data files
datas = []

# Include .env if it exists (user may place it next to the executable)
if os.path.exists('.env'):
    datas.append(('.env', '.'))

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[
        # FastAPI & ASGI
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'starlette',
        'starlette.routing',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.responses',
        'starlette.requests',
        'anyio',
        'anyio._backends',
        'anyio._backends._asyncio',
        'sniffio',

        # Pydantic
        'pydantic',
        'pydantic.deprecated',
        'pydantic.deprecated.decorator',
        'pydantic_settings',
        'pydantic_core',

        # Database drivers
        'sqlalchemy',
        'sqlalchemy.dialects',
        'sqlalchemy.dialects.mssql',
        'sqlalchemy.dialects.mssql.pymssql',
        'sqlalchemy.dialects.postgresql',
        'sqlalchemy.dialects.postgresql.psycopg2',
        'sqlalchemy.dialects.mysql',
        'sqlalchemy.dialects.mysql.pymysql',
        'pymssql',
        'psycopg2',
        'PyMySQL',

        # AI providers
        'anthropic',
        'openai',
        'google.generativeai',
        'boto3',
        'botocore',

        # HTTP
        'httpx',
        'httpcore',
        'h11',

        # Security
        'cryptography',
        'cryptography.fernet',
        'cryptography.hazmat',
        'cryptography.hazmat.primitives',
        'cryptography.hazmat.primitives.kdf',
        'cryptography.hazmat.primitives.kdf.pbkdf2',

        # Environment
        'dotenv',

        # Standard library used
        'sqlite3',
        'multiprocessing',
        'xml.etree.ElementTree',
        'email.mime.text',

        # Local modules
        'api',
        'api.routes',
        'api.models_routes',
        'api.ollama_routes',
        'ai',
        'ai.base',
        'ai.client',
        'ai.providers',
        'ai.claude_provider',
        'ai.openai_provider',
        'ai.gemini_provider',
        'ai.bedrock_provider',
        'ai.ollama_provider',
        'ai.ollama_catalog',
        'database',
        'database.connection',
        'database.schema_extractor',
        'database.storage',
        'encryption',
        'encryption.cipher',
        'encryption.cipher_dev',
        'encryption.connection_encryption',
        'execution_plan',
        'execution_plan.parser',
        'execution_plan.analyzer',
        'execution_plan.insights',
        'execution_plan.models',
        'utils',
        'utils.permission_helper',
        'utils.hardware_detector',
        'psutil',
        'local_database',
        'device_id',
        'startup',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'scipy',
        'numpy',
        'pandas',
        'PIL',
        'cv2',
        'torch',
        'tensorflow',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='db-chat-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Keep console for logging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

#!/usr/bin/env python3
"""
Migration Script: Encrypt plain-text accountNumbers in local_db.json
─────────────────────────────────────────────────────────────────────
Run ONCE before deploying the 4_database_encryption feature to production.

Usage (from project root):
    python scripts/migrate_encrypt_db.py

What it does:
  1. Loads local_db.json.
  2. For each record where accountNumber is plain-text (doesn't start with 'v1:'),
     encrypts it using AES-256-GCM with the key from .env.
  3. Writes the updated local_db.json back.
  4. Prints a summary of how many records were migrated.

For production DynamoDB:
  Replace load_db() / save_db() with boto3 scan + batch_write calls.
  The encrypt_field() logic is identical.
"""

import json
import os
import sys
import secrets as _secrets

# ── Resolve project root and load .env ───────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DB_FILE = os.path.join(PROJECT_ROOT, 'local_db.json')
ENV_FILE = os.path.join(PROJECT_ROOT, '.env')

def load_dotenv():
    if not os.path.exists(ENV_FILE):
        print(f"[ERROR] .env file not found at: {ENV_FILE}")
        sys.exit(1)
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            os.environ.setdefault(key.strip(), value.strip())

load_dotenv()

# ── AES-256-GCM helpers (mirrors local_server.py) ────────────────────────────
KEY_VERSION = 'v1'

def get_key() -> bytes:
    key_hex = os.environ.get('ENCRYPTION_KEY', '')
    if len(key_hex) != 64:
        print("[ERROR] ENCRYPTION_KEY must be a 64-character hex string. Check your .env file.")
        sys.exit(1)
    return bytes.fromhex(key_hex)

def encrypt_field(plaintext: str) -> str:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = get_key()
    iv = _secrets.token_bytes(12)
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
    ciphertext = ct_with_tag[:-16]
    tag = ct_with_tag[-16:]
    return f'{KEY_VERSION}:{iv.hex()}:{tag.hex()}:{ciphertext.hex()}'

def is_encrypted(value: str) -> bool:
    return isinstance(value, str) and value.startswith(f'{KEY_VERSION}:')

# ── Migration ─────────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(DB_FILE):
        print(f"[INFO] No local_db.json found at {DB_FILE} — nothing to migrate.")
        return

    with open(DB_FILE, 'r', encoding='utf-8') as f:
        db = json.load(f)

    total = len(db)
    migrated = 0
    skipped = 0

    for slug, record in db.items():
        bank = record.get('bankDetails', {})
        if not bank:
            skipped += 1
            continue

        acc = bank.get('accountNumber', '')
        if not acc:
            skipped += 1
            continue

        if is_encrypted(str(acc)):
            print(f"  [SKIP] {slug} — already encrypted")
            skipped += 1
            continue

        # Encrypt plain-text value
        db[slug]['bankDetails']['accountNumber'] = encrypt_field(str(acc))
        print(f"  [OK]   {slug} — encrypted (was: {str(acc)[:4]}****)")
        migrated += 1

    # Write back
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] Migration complete: {migrated} encrypted, {skipped} skipped, {total} total records.")
    print(f"       File updated: {DB_FILE}")

if __name__ == '__main__':
    main()

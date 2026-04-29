import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


SQL = """
DELETE FROM post_replies;
DELETE FROM posts;
"""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Delete all posts and associated comments from the AURI database.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip confirmation prompt.",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parents[1]
    schema_path = backend_dir / "prisma" / "schema.prisma"

    if not schema_path.exists():
        print(f"Prisma schema not found: {schema_path}", file=sys.stderr)
        return 1

    if not args.yes:
        answer = input("This will delete all posts and comments. Continue? [y/N] ")
        if answer.strip().lower() not in {"y", "yes"}:
            print("Aborted.")
            return 0

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".sql",
        delete=False,
        encoding="utf-8",
    ) as sql_file:
        sql_file.write(SQL)
        sql_path = Path(sql_file.name)

    try:
        npx = shutil.which("npx") or shutil.which("npx.cmd")
        if not npx:
            print("npx was not found in PATH.", file=sys.stderr)
            return 1

        command = [
            npx,
            "prisma",
            "db",
            "execute",
            "--schema",
            str(schema_path),
            "--file",
            str(sql_path),
        ]
        subprocess.run(command, cwd=backend_dir, check=True)
    finally:
        sql_path.unlink(missing_ok=True)

    print("Deleted all posts and comments.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

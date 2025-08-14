import asyncio
from dnd_backend.imports.actions import import_actions
from dnd_backend.imports.backgrounds import import_backgrounds


def main():
    asyncio.run(import_actions())
    asyncio.run(import_backgrounds())


if __name__ == "__main__":
    main()
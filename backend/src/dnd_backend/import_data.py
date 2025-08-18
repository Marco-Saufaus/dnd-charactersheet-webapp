import asyncio
from dnd_backend.imports.actions import import_actions
from dnd_backend.imports.backgrounds import import_backgrounds
from dnd_backend.imports.feats import import_feats
from dnd_backend.imports.conditions import import_conditions


def main():
    asyncio.run(import_actions())
    asyncio.run(import_backgrounds())
    asyncio.run(import_feats())
    asyncio.run(import_conditions())


if __name__ == "__main__":
    main()
import asyncio
from dnd_backend.imports.actions import import_actions
from dnd_backend.imports.backgrounds import import_backgrounds
from dnd_backend.imports.feats import import_feats
from dnd_backend.imports.conditions import import_conditions
from dnd_backend.imports.skills import import_skills
from dnd_backend.imports.variants import import_variants


def main():
    asyncio.run(import_actions())
    asyncio.run(import_backgrounds())
    asyncio.run(import_feats())
    asyncio.run(import_conditions())
    asyncio.run(import_skills())
    asyncio.run(import_variants())


if __name__ == "__main__":
    main()
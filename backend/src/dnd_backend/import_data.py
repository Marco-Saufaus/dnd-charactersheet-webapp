import asyncio
from dnd_backend.config.database import MongoManager
from dnd_backend.imports.actions import import_actions
from dnd_backend.imports.backgrounds import import_backgrounds
from dnd_backend.imports.conditions import import_conditions
from dnd_backend.imports.feats import import_feats
from dnd_backend.imports.optionalfeatures import import_optionalfeatures
from dnd_backend.imports.races import import_races
from dnd_backend.imports.senses import import_senses
from dnd_backend.imports.skills import import_skills
from dnd_backend.imports.variants import import_variants


async def _run_import_tasks() -> dict:
    """Run all import tasks concurrently and collect their return values.

    Returns a mapping of dataset name to the list (or value) returned by each importer.
    This is the internal async function; a synchronous wrapper `main()` is provided
    for invocation through the Poetry script entry point, preventing 'coroutine was
    never awaited' runtime warnings.
    """
    (actions, backgrounds, conditions, feats, optionalfeatures, races, senses, skills, variants,) = await asyncio.gather(
        import_actions(),
        import_backgrounds(),
        import_conditions(),
        import_feats(),
        import_optionalfeatures(),
        import_races(),
        import_senses(),
        import_skills(),
        import_variants(),
    )

    results: dict = {
        "actions": actions,
        "backgrounds": backgrounds,
        "conditions": conditions,
        "feats": feats,
        "optionalfeatures": optionalfeatures,
        "races": races,
        "senses": senses,
        "skills": skills,
        "variants": variants,
    }

    # Overwrite aggregated search index (single doc) in MongoDB
    MongoManager.connect_to_database()
    try:
        await MongoManager.overwrite_one("search_index", {"_id": "search_index"}, results)
    finally:
        MongoManager.close_database_connection()

    return results


def main() -> dict:  # pragma: no cover - thin wrapper
    """Synchronous entry point for Poetry script.

    Returns the collected results dictionary.
    """
    return asyncio.run(_run_import_tasks())
    
    

if __name__ == "__main__":  # pragma: no cover
    main()
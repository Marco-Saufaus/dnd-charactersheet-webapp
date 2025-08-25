import asyncio
from dnd_backend.config.database import MongoManager
from dnd_backend.imports.actions_import import import_actions
from dnd_backend.imports.backgrounds_import import import_backgrounds
from dnd_backend.imports.bestiary_import import import_bestiary
from dnd_backend.imports.conditions_import import import_conditions
from dnd_backend.imports.feats_import import import_feats
from dnd_backend.imports.baseitems_import import import_baseitems
from dnd_backend.imports.items_import import import_items
from dnd_backend.imports.item_masteries_import import import_masteries
from dnd_backend.imports.item_properties_import import import_properties
from dnd_backend.imports.item_group_import import import_itemgroups
from dnd_backend.imports.languages_import import import_languages
from dnd_backend.imports.optionalfeatures_import import import_optionalfeatures
from dnd_backend.imports.races_import import import_races
from dnd_backend.imports.senses_import import import_senses
from dnd_backend.imports.skills_import import import_skills
from dnd_backend.imports.spells_import import import_spells
from dnd_backend.imports.status_import import import_status
from dnd_backend.imports.variants_import import import_variants



async def _run_import_tasks() -> dict:
    """Run all import tasks concurrently and collect their return values.

    Returns a mapping of dataset name to the list (or value) returned by each importer.
    This is the internal async function; a synchronous wrapper `main()` is provided
    for invocation through the Poetry script entry point, preventing 'coroutine was
    never awaited' runtime warnings.
    """
    (actions, backgrounds, bestiary, conditions, feats, baseitems, items, masteries, properties, itemgroups, languages, optionalfeatures, races, senses, skills, spells, status, variants,) = await asyncio.gather(
        import_actions(),
        import_backgrounds(),
        import_bestiary(),
        import_conditions(),
        import_feats(),
        import_baseitems(),
        import_items(),
        import_masteries(),
        import_properties(),
        import_itemgroups(),
        import_languages(),
        import_optionalfeatures(),
        import_races(),
        import_senses(),
        import_skills(),
        import_spells(),
        import_status(),
        import_variants(),
    )

    results: dict = {
        "actions": actions,
        "backgrounds": backgrounds,
        "bestiary": bestiary,
        "conditions": conditions,
        "feats": feats,
        "baseitems": baseitems,
        "items": items,
        "masteries": masteries,
        "properties": properties,
        "itemgroups": itemgroups,
        "languages": languages,
        "optionalfeatures": optionalfeatures,
        "races": races,
        "senses": senses,
        "skills": skills,
        "spells": spells,
        "status": status,
        "variants": variants,
    }

    # Overwrite aggregated search index (single doc) in MongoDB
    MongoManager.connect_to_database()
    try:
        await MongoManager.overwrite_one("search_index", {"_id": "search_index"}, results)
    finally:
        MongoManager.close_database_connection()


def get_conditions():
    # Return all Status objects from the Conditions collection
    return []


def get_condition_by_name(name: str):
    # Return a Status object by name from the Conditions collection
    return None


def main() -> dict:
    """Synchronous entry point for Poetry script.

    Returns the collected results dictionary.
    """
    return asyncio.run(_run_import_tasks())
    
    

if __name__ == "__main__":
    main()
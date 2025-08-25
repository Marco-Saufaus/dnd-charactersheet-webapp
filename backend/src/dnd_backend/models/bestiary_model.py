from typing import Optional
from pydantic import BaseModel, Field

class Bestiary(BaseModel):
    id: str = Field(alias="_id")
    name: str
    source: Optional[str] = None
    page: Optional[int] = None
    basicRules: Optional[bool] = None
    summonedBySpell: Optional[str] = None
    summonedBySpellLevel: Optional[int] = None
    size: Optional[str] = None
    type: Optional[str] = None
    ac: Optional[int] = None
    hp: Optional[dict] = None
    speed: Optional[dict] = None
    senses: Optional[dict] = None

    # Ability scores with aliases for reserved words
    strength: Optional[int] = Field(None, alias="str")
    dexterity: Optional[int] = Field(None, alias="dex")
    constitution: Optional[int] = Field(None, alias="con")
    intelligence: Optional[int] = Field(None, alias="int")
    wisdom: Optional[int] = Field(None, alias="wis")
    charisma: Optional[int] = Field(None, alias="cha")
    senses: Optional[dict] = None

    # Additional fields from bestiary-xphb.json
    alignment: Optional[str] = None
    cr: Optional[str] = None
    environment: Optional[list[str]] = None
    trait: Optional[list[dict]] = None
    action: Optional[list[dict]] = None
    legendary: Optional[list[dict]] = None
    legendaryGroup: Optional[str] = None
    language: Optional[list[str]] = None
    proficiency: Optional[list[dict]] = None
    vulnerability: Optional[list[str]] = None
    resistance: Optional[list[str]] = None
    immunity: Optional[list[str]] = None
    conditionImmune: Optional[list[str]] = None
    spellcasting: Optional[list[dict]] = None
    group: Optional[str] = None
    soundClip: Optional[dict] = None
    isNpc: Optional[bool] = None
    isNamedCreature: Optional[bool] = None
    reprintedAs: Optional[list[str]] = None
    familiar: Optional[bool] = None
    additionalSources: Optional[list[dict]] = None
    pageEntry: Optional[str] = None
    altArt: Optional[list[dict]] = None
    tokenUrl: Optional[str] = None
    hasToken: Optional[bool] = None
    miscTags: Optional[list[str]] = None
    spellcastingTags: Optional[list[str]] = None
    damageTags: Optional[list[str]] = None
    conditionInflict: Optional[list[str]] = None
    senseTags: Optional[list[str]] = None
    languageTags: Optional[list[str]] = None
    creatureTypeTags: Optional[list[str]] = None
    lootTables: Optional[list[str]] = None
    isSwarm: Optional[bool] = None
    swarmSize: Optional[str] = None
    traitTags: Optional[list[str]] = None
    actionTags: Optional[list[str]] = None
    legendaryGroupSource: Optional[str] = None
    variant: Optional[list[dict]] = None
    altName: Optional[list[str]] = None
    altArtName: Optional[list[str]] = None
    copy: Optional[dict] = None
    companion: Optional[dict] = None
    dragonCastingColor: Optional[str] = None
    mythic: Optional[bool] = None
    lair: Optional[dict] = None
    lairActions: Optional[list[dict]] = None
    regional: Optional[list[dict]] = None
    regionalActions: Optional[list[dict]] = None
    info: Optional[dict] = None
    spellcastingEntry: Optional[dict] = None
    passive: Optional[int] = None
    immune: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    pbNote: Optional[str] = None
    trait: Optional[list[dict]] = None


    class Config:
        populate_by_name = True

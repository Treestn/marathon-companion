export const QuestConditionConst = {
    COMPLETE: {displayName:"Complete Quest", name:"complete"},
    ACTIVE: {displayName:"Accept Quest", name:"active"},
    FAILED: {displayName:"Fail Quest", name:"failed"},
}

export const QuestConditionList = [
    QuestConditionConst.COMPLETE,
    QuestConditionConst.ACTIVE,
    QuestConditionConst.FAILED
]

export const ObjectiveTypeConst = {
    VISIT: {type: "visit", typename: "TaskObjectiveBasic", text: "Visit"},
    GIVE_ITEM: {type: "giveItem", typename: "TaskObjectiveItem", text: "Give Item"},
    SHOOT: {type: "shoot", typename: "TaskObjectiveShoot", text: "Shoot"},
    EXTRACT: {type: "extract", typename: "TaskObjectiveExtract", text: "Extract"},
    FIND_QUEST_ITEM: {type: "findQuestItem", typename: "TaskObjectiveQuestItem", text: "Find Quest Item"},
    GIVE_QUEST_ITEM: {type: "giveQuestItem", typename: "TaskObjectiveQuestItem", text: "Give Quest Item"},
    FIND_ITEM: {type: "findItem", typename: "TaskObjectiveItem", text: "Find Item"},
    BUILD_WEAPON: {type: "buildWeapon", typename: "TaskObjectiveBuildItem", text: "Build Weapon"},
    PLANT_ITEM: {type: "plantItem", typename: "TaskObjectiveItem", text: "Plant Item"},
    // EXPERIENCE: {type: "experience", text: "Experience"},
    // SKILL: {type: "skill", text: "Skill"},
    PLANT_QUEST_ITEM: {type: "plantQuestItem", typename: "TaskObjectiveQuestItem", text: "Plant Quest Item"},
    MARK: {type: "mark", typename: "TaskObjectiveMark", text: "Mark"},
    TASK_STATUS: {type: "taskStatus", typename: "TaskObjectiveTaskStatus", text: "Task Status"},
    // TRADER_LEVEL: {type: "traderLevel", text: "Trader Level"},
    USE_ITEM: {type: "useItem", typename: "TaskObjectiveUseItem", text: "Use Item"},
    SELL_ITEM: {type: "sellItem", typename: "TaskObjectiveItem", text: "Sell Item"},
}

export const ObjectiveTypeList = [
    ObjectiveTypeConst.VISIT,
    ObjectiveTypeConst.SHOOT,
    ObjectiveTypeConst.MARK,
    ObjectiveTypeConst.PLANT_ITEM,
    ObjectiveTypeConst.PLANT_QUEST_ITEM,
    ObjectiveTypeConst.FIND_ITEM,
    ObjectiveTypeConst.GIVE_ITEM,
    ObjectiveTypeConst.FIND_QUEST_ITEM,
    ObjectiveTypeConst.GIVE_QUEST_ITEM,
    ObjectiveTypeConst.EXTRACT,
    ObjectiveTypeConst.USE_ITEM,
    ObjectiveTypeConst.SELL_ITEM,
    ObjectiveTypeConst.BUILD_WEAPON
]
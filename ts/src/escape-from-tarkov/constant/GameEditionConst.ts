export const GameEditionConst = {
    NONE: {name: "", normalizedName: ""},
    UNHEARD_EDITION: {name: "Unheard Edition", normalizedName: "unheard_edition"},
    EOD_EDITION: {name: "Edge of Darkness Edition", normalizedName: "eod_edition"},
    PREPARE_FOR_ESCAPE_EDITION: {name: "Prepare for Escape Edition", normalizedName: "prepare_for_escape_edition"},
    LEFT_BEHIND_EDITION: {name: "Left Behind Edition", normalizedName: "left_behind_edition"},
    STANDARD_EDITION: {name: "Standard Edition", normalizedName: "standard_edition"}
}

export const GameEditionList = [
    GameEditionConst.NONE,
    GameEditionConst.STANDARD_EDITION,
    GameEditionConst.LEFT_BEHIND_EDITION,
    GameEditionConst.PREPARE_FOR_ESCAPE_EDITION,
    GameEditionConst.EOD_EDITION,
    GameEditionConst.UNHEARD_EDITION
]
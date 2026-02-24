export function rarityToColor(rarity:string):string {
    switch(rarity) {
        case "common":
            return "#6C6B6A";
        case "uncommon":
            return "#25BB55";
        case "rare":
            return "#01abf4";
        case "epic":
            return "#C43198";
        case "legendary":
            return "#FFCC00";
        default:
            return "black";
    }
}
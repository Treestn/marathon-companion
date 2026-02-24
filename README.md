# Marathon Companion

This repository implements the Overwolf overlay manager for Escape From Arc Raiders:

- The app has a interactive maps will all the maps from EFT. These maps have dynamic floors that can be clicked on cycle through them.
- THere is a quest page that has all the necessary information for completion and when active, the quest will appear on the maps if necessary
- There is an ammo chart page where all the ammo information is listed by caliber

This app is using NodeJs and Typescript. All the logic is handled through typescript

For all images related to items, the app calls the Arc Raidersdev api to retrieve the name/icon link.

Next step will be to create a second manager for the coming game: Arena

A backend server will also be created to retrieve all the json configuration

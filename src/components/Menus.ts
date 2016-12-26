import { IMove } from "battlemovr/lib/IBattleMovr";
import { Component } from "eightbittr/lib/Component";
import { IGridCell, IMenuSchema, IMenuWordSchema } from "menugraphr/lib/IMenuGraphr";

import { KeysLowercase, KeysUppercase } from "../Constants";
import { FullScreenPokemon } from "../FullScreenPokemon";
import {
    IHMMoveSchema, IItemSchema, IItemsMenuSettings, IKeyboardMenuSettings,
    IKeyboardResultsMenu, ILevelUpStatsMenuSettings, IListMenu, IMenu,
    IPlayer, IPokedexInformation, IPokedexListing, IPokemon, IThing
} from "../IFullScreenPokemon";

/**
 * Menu functions used by FullScreenPokemon instances.
 */
export class Menus<TGameStartr extends FullScreenPokemon> extends Component<TGameStartr> {
    /**
     * Opens the Pause menu.
     */
    public openPauseMenu(): void {
        const options: any[] = [
            {
                text: "%%%%%%%POKEMON%%%%%%%",
                callback: (): void => this.openPokemonMenu({
                    // "onSwitch": ...
                })
            }, {
                text: "ITEM",
                callback: (settings: IItemsMenuSettings): void => this.openItemsMenu(settings)
            }, {
                text: "%%%%%%%PLAYER%%%%%%%",
                callback: (): void => this.openPlayerMenu()
            }, {
                text: "SAVE",
                callback: (): void => this.openSaveMenu()
            }, {
                text: "OPTION"
            }, {
                text: "Exit",
                callback: (): void => this.closePauseMenu()
            }];

        // The Pokedex option is only shown if the Player has one
        if (this.gameStarter.itemsHolder.getItem("hasPokedex") === true) {
            const attributes: any = {
                "size": {
                    "height": 64
                }
            };

            options.unshift({
                text: "%%%%%%%POKEDEX%%%%%%%",
                callback: (): void => this.openPokedexMenu()
            });

            this.gameStarter.menuGrapher.createMenu("Pause", attributes);
        } else {
            this.gameStarter.menuGrapher.createMenu("Pause");
        }

        this.gameStarter.menuGrapher.addMenuList("Pause", {
            options: options
        });
        this.gameStarter.menuGrapher.setActiveMenu("Pause");
    }

    /**
     * Closes the Pause menu.
     */
    public closePauseMenu(): void {
        this.gameStarter.menuGrapher.deleteMenu("Pause");
    }

    /**
     * Toggles whether the Pause menu is open. If there is an active menu, A
     * Start key trigger is registered in the MenuGraphr instead.
     */
    public togglePauseMenu(): void {
        if (this.gameStarter.menuGrapher.getActiveMenu()) {
            this.gameStarter.menuGrapher.registerStart();
            return;
        }

        let cutsceneSettings: any = this.gameStarter.scenePlayer.getCutsceneSettings();
        if (cutsceneSettings && cutsceneSettings.disablePauseMenu) {
            return;
        }

        this.gameStarter.menuGrapher.getMenu("Pause")
            ? this.closePauseMenu()
            : this.openPauseMenu();
    }

    /**
     * Opens the Pokedex menu.
     */
    public openPokedexMenu(): void {
        const listings: (IPokedexInformation | undefined)[] = this.gameStarter.saves.getPokedexListingsOrdered();
        let currentListing: IPokedexInformation;

        this.gameStarter.menuGrapher.createMenu("Pokedex");
        this.gameStarter.menuGrapher.addMenuList("Pokedex", {
            options: listings.map((listing: IPokedexInformation, i: number): any => {
                const characters: any[] = this.gameStarter.utilities.makeDigit(i + 1, 3, 0).split("");
                const output: any = {
                    text: characters,
                    callback: (): void => {
                        currentListing = listing;
                        this.gameStarter.menuGrapher.setActiveMenu("PokedexOptions");
                    }
                };

                characters.push({
                    command: true,
                    y: 4
                });

                if (listing) {
                    if (listing.caught) {
                        characters.push({
                            command: true,
                            x: -4,
                            y: 1
                        });
                        characters.push("Ball");
                        characters.push({
                            command: true,
                            y: -1
                        });
                    }

                    characters.push(...listing.title);
                } else {
                    characters.push(..."----------".split(""));
                }

                characters.push({
                    command: true,
                    y: -4
                });

                return output;
            })
        });
        this.gameStarter.menuGrapher.setActiveMenu("Pokedex");

        this.gameStarter.menuGrapher.createMenu("PokedexOptions");
        this.gameStarter.menuGrapher.addMenuList("PokedexOptions", {
            options: [
                {
                    text: "DATA",
                    callback: (): void => {
                        this.openPokedexListing(
                            currentListing.title,
                            (): void => this.gameStarter.menuGrapher.setActiveMenu("PokedexOptions"));
                    }
                }, {
                    text: "CRY"
                }, {
                    text: "AREA",
                    callback: (): void => {
                        this.openTownMapMenu({
                            backMenu: "PokedexOptions"
                        });
                        this.showTownMapPokemonLocations(currentListing.title);
                    }
                }, {
                    text: "QUIT",
                    callback: this.gameStarter.menuGrapher.registerB
                }
            ]
        });
    }

    /**
     * Opens the context menu within the Pokedex menu for the selected Pokemon.
     *
     * @param settings   Settings for the selected Pokemon, including its HM moves.
     */
    public openPokemonMenuContext(settings: any): void {
        const moves: IMove[] = settings.pokemon.moves;
        const options: any[] = [];

        for (const action of moves) {
            const move: IHMMoveSchema = this.gameStarter.mathDecider.getConstant("moves")[action.title];
            if (move.partyActivate && move.requiredBadge && this.gameStarter.itemsHolder.getItem("badges")[move.requiredBadge]) {
                options.push({
                    text: action.title.toUpperCase(),
                    callback: (): void => {
                        this.gameStarter.actions.partyActivateCheckThing(this.gameStarter.players[0], settings.pokemon, move);
                    }
                });
            }
        }

        options.push(
            {
                text: "STATS",
                callback: (): void => this.openPokemonMenuStats(settings.pokemon)
            },
            {
                text: "SWITCH",
                callback: settings.onSwitch
            },
            {
                text: "CANCEL",
                callback: this.gameStarter.menuGrapher.registerB
            });

        this.gameStarter.menuGrapher.createMenu("PokemonMenuContext", {
            backMenu: "Pokemon"
        });
        this.gameStarter.menuGrapher.addMenuList("PokemonMenuContext", {
            options: options
        });
        this.gameStarter.menuGrapher.setActiveMenu("PokemonMenuContext");
    }

    /**
     * Opens a statistics menu for a Pokemon.
     * 
     * @param pokemon   A Pokemon to show statistics of.
     */
    public openPokemonMenuStats(pokemon: IPokemon): void {
        const schemas: any = this.gameStarter.mathDecider.getConstant("pokemon");
        const schema: any = schemas[pokemon.title.join("")];
        const barWidth: number = 25;
        const health: number = this.gameStarter.mathDecider.compute(
            "widthHealthBar", barWidth, pokemon.HP, pokemon.HPNormal);

        this.gameStarter.menuGrapher.createMenu("PokemonMenuStats", {
            backMenu: "PokemonMenuContext",
            callback: (): void => this.openPokemonMenuStatsSecondary(pokemon),
            container: "Pokemon"
        });

        this.openPokemonLevelUpStats({
            pokemon: pokemon,
            container: "PokemonMenuStats",
            size: {
                width: 40,
                height: 40
            },
            position: {
                vertical: "bottom",
                horizontal: "left",
                offset: {
                    left: 3,
                    top: -3
                }
            },
            textXOffset: 4
        });

        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsTitle", [pokemon.nickname]);
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsLevel", pokemon.level.toString());
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsHP", pokemon.HP + "/ " + pokemon.HPNormal);
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsNumber", this.gameStarter.utilities.makeDigit(schema.number, 3, 0));
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsStatus", "OK");
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsType1", pokemon.types[0]);
        if (pokemon.types.length >= 2) {
            this.gameStarter.menuGrapher.createMenu("PokemonMenuStatsType2");
            this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsType2", pokemon.types[1]);
        }
        this.gameStarter.menuGrapher.addMenuDialog("PokemonMenuStatsID", "31425");
        this.gameStarter.menuGrapher.addMenuDialog(
            "PokemonMenuStatsOT",
            [
                "%%%%%%%PLAYER%%%%%%%"
            ]
        );

        this.gameStarter.menuGrapher.createMenuThing("PokemonMenuStatsHPBar", {
            type: "thing",
            thing: "LightGraySquare",
            position: {
                horizontal: "left",
                offset: {
                    top: 0.5,
                    left: 8.5
                }
            },
            args: {
                width: Math.max(health, 1),
                height: 1,
                hidden: health === 0
            }
        });

        this.gameStarter.menuGrapher.createMenuThing("PokemonMenuStats", {
            type: "thing",
            thing: pokemon.title.join("") + "Front",
            args: {
                flipHoriz: true
            },
            position: {
                vertical: "bottom",
                offset: {
                    left: 9,
                    top: -48
                }
            }
        });

        this.gameStarter.menuGrapher.setActiveMenu("PokemonMenuStats");
    }

    /**
     * Opens the LevelUpStats menu for a Pokemon to view its statistics.
     * 
     * @param settings   Settings to open the menu.
     */
    public openPokemonLevelUpStats(settings: ILevelUpStatsMenuSettings): void {
        const pokemon: IPokemon = settings.pokemon;
        const statistics: string[] = this.gameStarter.mathDecider.getConstant("statisticNamesDisplayed").slice();
        const numStatistics: number = statistics.length;
        const textXOffset: number = settings.textXOffset || 8;
        const menuSchema: IMenuSchema = {
            callback: (): void => this.gameStarter.menuGrapher.deleteMenu("LevelUpStats"),
            onMenuDelete: settings.onMenuDelete,
            position: settings.position || {
                horizontal: "center",
                vertical: "center"
            }
        };
        let top: number;
        let left: number;

        for (let i: number = 0; i < numStatistics; i += 1) {
            statistics.push(this.gameStarter.utilities.makeDigit((pokemon as any)[statistics[i] + "Normal"], 3, "\t"));
            statistics[i] = statistics[i].toUpperCase();
        }

        menuSchema.childrenSchemas = statistics.map((text: string, i: number): IMenuWordSchema => {
            if (i < numStatistics) {
                top = i * 8 + 4;
                left = textXOffset;
            } else {
                top = (i - numStatistics + 1) * 8;
                left = textXOffset + 20;
            }

            return {
                type: "text",
                words: [text],
                position: {
                    offset: {
                        top: top - .5,
                        left: left
                    }
                }
            };
        });

        if (settings.container) {
            menuSchema.container = settings.container;
        }

        if (settings.size) {
            menuSchema.size = settings.size;
        }

        this.gameStarter.menuGrapher.createMenu("LevelUpStats", menuSchema);
    }

    /**
     * Open the secondary statistics menu from the LevelUpStats menu.
     * 
     * @param pokemon   The Pokemon to open the menu for.
     */
    public openPokemonMenuStatsSecondary(pokemon: IPokemon): void {
        const options: any[] = pokemon.moves.map(
            (move: IMove): any => {
                const characters: any[] = [" "];
                const output: any = {
                    text: characters
                };

                characters.push({
                    command: true,
                    x: 40,
                    y: 4
                });

                characters.push({
                    command: true,
                    y: .5
                });
                characters.push("PP", " ");
                characters.push({
                    command: true,
                    y: -.5
                });
                characters.push(...this.gameStarter.utilities.makeDigit(move.remaining, 2, " ").split(""));
                characters.push("/");
                characters.push(
                    ...this.gameStarter.utilities.makeDigit(
                        this.gameStarter.mathDecider.getConstant("moves")[move.title].PP, 2, " ")
                            .split(""));

                characters.push({
                    command: true,
                    x: -75,
                    y: -4
                });

                // TODO: Moves should always be uppercase...
                characters.push(...move.title.toUpperCase().split(""));

                return output;
            });

        // Fill any remaining options with "-" and "--" for move and PP, respectively
        for (let i: number = options.length; i < 4; i += 1) {
            options.push({
                text: [
                    "-",
                    {
                        command: true,
                        x: 40,
                        y: 4
                    },
                    "-",
                    "-"
                ]
            });
        }

        this.gameStarter.menuGrapher.createMenu("PokemonMenuStatsExperience");

        this.gameStarter.menuGrapher.addMenuDialog(
            "PokemonMenuStatsExperience",
            this.gameStarter.utilities.makeDigit(pokemon.experience.current, 10, "\t"));

        this.gameStarter.menuGrapher.addMenuDialog(
            "PokemonMenuStatsExperienceFrom",
            this.gameStarter.utilities.makeDigit(
                (pokemon.experience.next - pokemon.experience.current), 3, "\t"));

        this.gameStarter.menuGrapher.addMenuDialog(
            "PokemonMenuStatsExperienceNext",
            pokemon.level === 99 ? "" : (pokemon.level + 1).toString());

        this.gameStarter.menuGrapher.createMenu("PokemonMenuStatsMoves");
        this.gameStarter.menuGrapher.addMenuList("PokemonMenuStatsMoves", {
            options: options
        });

        this.gameStarter.menuGrapher.getMenu("PokemonMenuStats").callback = (): void => {
            this.gameStarter.menuGrapher.deleteMenu("PokemonMenuStats");
        };
    }

    /**
     * Opens a Pokedex listing for a Pokemon.
     *
     * @param title   The title of the Pokemon to open the listing for.
     * @param callback   A callback for when the menu is closed.
     */
    public openPokedexListing(title: string[], callback?: (...args: any[]) => void, menuSettings?: any): void {
        const pokemon: IPokedexListing = this.gameStarter.mathDecider.getConstant("pokemon")[title.join("")];
        const height: string[] = pokemon.height;
        const feet: string = [].slice.call(height[0]).reverse().join("");
        const inches: string = [].slice.call(height[1]).reverse().join("");
        const onCompletion: () => any = (): void => {
            this.gameStarter.menuGrapher.deleteMenu("PokedexListing");
            if (callback) {
                callback();
            }
        };

        this.gameStarter.menuGrapher.createMenu("PokedexListing", menuSettings);
        this.gameStarter.menuGrapher.createMenuThing("PokedexListingSprite", {
            thing: title.join("") + "Front",
            type: "thing",
            args: {
                flipHoriz: true
            }
        });
        this.gameStarter.menuGrapher.addMenuDialog("PokedexListingName", [[title]]);
        this.gameStarter.menuGrapher.addMenuDialog("PokedexListingLabel", pokemon.label);
        this.gameStarter.menuGrapher.addMenuDialog("PokedexListingHeightFeet", feet);
        this.gameStarter.menuGrapher.addMenuDialog("PokedexListingHeightInches", inches);
        this.gameStarter.menuGrapher.addMenuDialog("PokedexListingWeight", pokemon.weight.toString());
        this.gameStarter.menuGrapher.addMenuDialog(
            "PokedexListingNumber",
            this.gameStarter.utilities.makeDigit(pokemon.number, 3, "0"));

        this.gameStarter.menuGrapher.addMenuDialog(
            "PokedexListingInfo",
            pokemon.info[0],
            (): void => {
                if (pokemon.info.length < 2) {
                    onCompletion();
                    return;
                }

                this.gameStarter.menuGrapher.createMenu("PokedexListingInfo");
                this.gameStarter.menuGrapher.addMenuDialog("PokedexListingInfo", pokemon.info[1], onCompletion);
                this.gameStarter.menuGrapher.setActiveMenu("PokedexListingInfo");
            });

        this.gameStarter.menuGrapher.setActiveMenu("PokedexListingInfo");
    }

    /**
     * Opens a Pokemon menu for the Pokemon in the player's party.
     * 
     * @param settings   Custom attributes to apply to the menu.
     */
    public openPokemonMenu(settings: IMenuSchema): void {
        const listings: IPokemon[] = this.gameStarter.itemsHolder.getItem("PokemonInParty");
        if (!listings || !listings.length) {
            return;
        }

        const references: any = this.gameStarter.mathDecider.getConstant("pokemon");

        this.gameStarter.menuGrapher.createMenu("Pokemon", settings);
        this.gameStarter.menuGrapher.addMenuList("Pokemon", {
            options: listings.map((listing: IPokemon): any => {
                const sprite: string = references[listing.title.join("")].sprite + "Pokemon";
                const barWidth: number = 25;
                const health: number = this.gameStarter.mathDecider.compute(
                    "widthHealthBar", barWidth, listing.HP, listing.HPNormal);

                return {
                    text: listing.title,
                    callback: (): void => this.openPokemonMenuContext({
                        pokemon: listing
                        // "onSwitch": (): void => settings.onSwitch("player", i)
                    }),
                    things: [
                        {
                            thing: sprite,
                            position: {
                                offset: {
                                    left: 7.5,
                                    top: .5
                                }
                            }
                        },
                        {
                            thing: "CharLevel",
                            position: {
                                offset: {
                                    left: 56,
                                    top: 1.5
                                }
                            }
                        },
                        {
                            thing: "CharHP",
                            position: {
                                offset: {
                                    left: 20,
                                    top: 5.5
                                }
                            }
                        },
                        {
                            thing: "HPBar",
                            args: {
                                width: barWidth
                            },
                            position: {
                                offset: {
                                    left: 27,
                                    top: 5.5
                                }
                            }
                        },
                        {
                            thing: "LightGraySquare",
                            args: {
                                width: Math.max(health, 1),
                                height: 1,
                                hidden: health === 0
                            },
                            position: {
                                offset: {
                                    left: 27.5,
                                    top: 6
                                }
                            }
                        }],
                    textsFloating: [
                        {
                            text: listing.level.toString(),
                            x: 44.25,
                            y: 0
                        },
                        {
                            text: listing.HP + "/ " + listing.HPNormal,
                            x: 43.75,
                            y: 4
                        }]
                };
            })
        });
        this.gameStarter.menuGrapher.setActiveMenu("Pokemon");
    }

    /**
     * Opens the Items menu for the items in the player's inventory.
     * 
     * @param settings   Custom attributes to apply to the menu, as well as items
     *                   to optionally override the player's inventory.
     */
    public openItemsMenu(settings: IItemsMenuSettings): void {
        let items: IItemSchema[] = settings.items || this.gameStarter.itemsHolder.getItem("items").slice();

        this.gameStarter.modAttacher.fireEvent("onOpenItemsMenu", items);

        this.gameStarter.menuGrapher.createMenu("Items", settings);
        this.gameStarter.menuGrapher.addMenuList("Items", {
            options: items.map((schema: any): any => {
                return {
                    text: schema.item,
                    callback: (): void => this.openItemMenu(schema.item),
                    textsFloating: [
                        {
                            text: [["Times"]],
                            x: 32,
                            y: 4.5
                        }, {
                            text: this.gameStarter.utilities.makeDigit(schema.amount, 2, " "),
                            x: 36.5,
                            y: 4
                        }
                    ]
                };
            })
        });
        this.gameStarter.menuGrapher.setActiveMenu("Items");

        console.warn("Once math.js contains item info, react to non-stackable items...");
    }

    /**
     * Opens the Item menu for the item the player selected from the inventory.
     * 
     * @param settings   Custom attributes to apply to the menu, as well as items
     *                   to optionally override the player's inventory.
     * 
     * @todo Fix #364.
     */
    public openItemMenu(itemName: string, settings?: any): void {
        const options: any[] = [{
                text: "USE",
                callback: (): void => console.log("Use " + itemName)
            }, {
                text: "TOSS",
                callback: (): void => console.log("Toss " + itemName)
            }];

        this.gameStarter.modAttacher.fireEvent("onOpenItemMenu", itemName);

        this.gameStarter.menuGrapher.createMenu("Item", settings);
        this.gameStarter.menuGrapher.addMenuList("Item", {
            options: options
        });
        this.gameStarter.menuGrapher.setActiveMenu("Item");
    }

    /**
     * Opens the Player menu.
     */
    public openPlayerMenu(): void {
        this.gameStarter.menuGrapher.createMenu("Player", {
            callback: (): void => this.gameStarter.menuGrapher.registerB()
        });
        this.gameStarter.menuGrapher.setActiveMenu("Player");
    }

    /**
     * Opens the Save menu.
     */
    public openSaveMenu(): void {
        this.gameStarter.menuGrapher.createMenu("Save");

        this.gameStarter.menuGrapher.createMenu("GeneralText");
        this.gameStarter.menuGrapher.addMenuDialog("GeneralText", "Would you like to SAVE the game?");

        this.gameStarter.menuGrapher.createMenu("Yes/No", {
            backMenu: "Pause"
        });
        this.gameStarter.menuGrapher.addMenuList("Yes/No", {
            options: [
                {
                    text: "YES",
                    callback: (): void => this.gameStarter.saves.downloadSaveGame()
                }, {
                    text: "NO",
                    callback: (): void => this.gameStarter.menuGrapher.registerB()
                }]
        });
        this.gameStarter.menuGrapher.setActiveMenu("Yes/No");

        this.gameStarter.saves.autoSave();
    }

    /**
     * Opens the Keyboard menu and binds it to some required callbacks.
     * 
     * @param settings   Settings to apply to the menu and for callbacks.
     */
    public openKeyboardMenu(settings: IKeyboardMenuSettings = {}): void {
        const value: string[][] = [settings.value || ["_", "_", "_", "_", "_", "_", "_"]];
        const onKeyPress: () => void = (): void => this.addKeyboardMenuValue();
        const onBPress: () => void = (): void => this.removeKeyboardMenuValue();
        const onComplete: (...args: any[]) => void = (settings.callback || onKeyPress).bind(this);
        const lowercase: boolean = !!settings.lowercase;
        const letters: string[] = lowercase
            ? KeysLowercase
            : KeysUppercase;
        const options: any[] = letters.map((letter: string): any => {
            return {
                text: [letter],
                value: letter,
                callback: letter !== "ED"
                    ? onKeyPress
                    : onComplete
            };
        });

        this.gameStarter.menuGrapher.createMenu("Keyboard", {
            settings: settings,
            onKeyPress: onKeyPress,
            onComplete: onComplete,
            ignoreB: false
        } as IMenuSchema);

        const menuResults: IKeyboardResultsMenu = this.gameStarter.menuGrapher.getMenu("KeyboardResult") as IKeyboardResultsMenu;

        this.gameStarter.menuGrapher.addMenuDialog("KeyboardTitle", [[
            settings.title || "",
        ]]);

        this.gameStarter.menuGrapher.addMenuDialog("KeyboardResult", value);

        this.gameStarter.menuGrapher.addMenuList("KeyboardKeys", {
            options: options,
            selectedIndex: settings.selectedIndex,
            bottom: {
                text: lowercase ? "UPPER CASE" : "lower case",
                callback: (): void => this.switchKeyboardCase(),
                position: {
                    top: 40,
                    left: 0
                }
            }
        });
        this.gameStarter.menuGrapher.getMenu("KeyboardKeys").onBPress = onBPress;
        this.gameStarter.menuGrapher.setActiveMenu("KeyboardKeys");

        menuResults.displayedValue = value.slice()[0];
        menuResults.completeValue = settings.completeValue || [];
        menuResults.selectedChild = settings.selectedChild || 0;
        menuResults.blinker = this.gameStarter.things.add(
            "CharMDash",
            menuResults.children[menuResults.selectedChild].left,
            menuResults.children[menuResults.selectedChild].top);
        menuResults.children.push(menuResults.blinker);
        menuResults.children[menuResults.selectedChild].hidden = true;
    }

    /**
     * Adds a value to the keyboard menu from the currently selected item.
     */
    public addKeyboardMenuValue(): void {
        const menuKeys: IListMenu = this.gameStarter.menuGrapher.getMenu("KeyboardKeys") as IListMenu;
        const menuResult: IKeyboardResultsMenu = this.gameStarter.menuGrapher.getMenu("KeyboardResult") as IKeyboardResultsMenu;
        let child: IThing = menuResult.children[menuResult.selectedChild];
        if (!child) {
            return;
        }

        const selected: IGridCell = this.gameStarter.menuGrapher.getMenuSelectedOption("KeyboardKeys");

        this.gameStarter.physics.killNormal(child);
        menuResult.children[menuResult.selectedChild] = this.gameStarter.things.add(
            selected.title!, child.left, child.top);

        menuResult.displayedValue[menuResult.selectedChild] = selected.text[0] as string;
        menuResult.completeValue.push(selected.value);
        menuResult.selectedChild += 1;

        if (menuResult.selectedChild < menuResult.children.length - 1) {
            child = menuResult.children[menuResult.selectedChild];
            child.hidden = true;
        } else {
            menuResult.blinker.hidden = true;
            this.gameStarter.menuGrapher.setSelectedIndex(
                "KeyboardKeys",
                menuKeys.gridColumns - 1,
                menuKeys.gridRows - 2); // assume there's a bottom option
        }

        this.gameStarter.physics.setLeft(menuResult.blinker, child.left);
        this.gameStarter.physics.setTop(menuResult.blinker, child.top);
    }

    /**
     * Removes the rightmost keyboard menu value.
     */
    public removeKeyboardMenuValue(): void {
        let menuResult: IKeyboardResultsMenu = this.gameStarter.menuGrapher.getMenu("KeyboardResult") as IKeyboardResultsMenu;
        if (menuResult.selectedChild <= 0) {
            return;
        }

        let child: IThing = menuResult.children[menuResult.selectedChild - 1];

        menuResult.selectedChild -= 1;
        menuResult.completeValue = menuResult.completeValue.slice(
            0, menuResult.completeValue.length - 1);
        menuResult.displayedValue[menuResult.selectedChild] = "_";

        this.gameStarter.physics.killNormal(child);

        child = menuResult.children[menuResult.selectedChild];

        menuResult.children[menuResult.selectedChild + 1] = this.gameStarter.things.add(
            "CharUnderscore", child.right, child.top);

        this.gameStarter.physics.setLeft(menuResult.blinker, child.left);
        this.gameStarter.physics.setTop(menuResult.blinker, child.top);
    }

    /**
     * Switches the keyboard menu's case.
     */
    public switchKeyboardCase(): void {
        const keyboard: IMenu = this.gameStarter.menuGrapher.getMenu("Keyboard") as IMenu;
        const keyboardKeys: IListMenu = this.gameStarter.menuGrapher.getMenu("KeyboardKeys") as IListMenu;
        const keyboardResult: IKeyboardResultsMenu = this.gameStarter.menuGrapher.getMenu("KeyboardResult") as IKeyboardResultsMenu;
        const settings: any = keyboard.settings;

        settings.lowercase = !settings.lowercase;
        settings.value = keyboardResult.displayedValue;
        settings.selectedChild = keyboardResult.selectedChild;
        settings.displayedValue = keyboardResult.displayedValue;
        settings.completeValue = keyboardResult.completeValue;
        settings.selectedIndex = keyboardKeys.selectedIndex;

        this.openKeyboardMenu(settings);
    }

    /**
     * Opens the Town Map menu.
     * 
     * @param settings   Custom attributes to apply to the menu.
     */
    public openTownMapMenu(settings?: IMenuSchema): void {
        const playerPosition: number[] = this.gameStarter.mathDecider.getConstant("townMapLocations")["Pallet Town"];
        const playerSize: any = this.gameStarter.objectMaker.getFullPropertiesOf("Player");

        this.gameStarter.menuGrapher.createMenu("Town Map", settings);
        this.gameStarter.menuGrapher.createMenuThing("Town Map Inside", {
            type: "thing",
            thing: "Player",
            args: {
                nocollide: true
            },
            position: {
                offset: {
                    left: playerPosition[0] - (playerSize.width / 2),
                    top: playerPosition[1] - (playerSize.height / 2)
                }
            }
        });
        this.gameStarter.menuGrapher.setActiveMenu("Town Map");
    }

    /**
     * Shows allowed flying locations on the Town Map menu.
     */
    public showTownMapFlyLocations(): void {
        console.warn("Map fly locations not implemented.");
    }

    /**
     * Shows a Pokemon's nest locations on the Town Map menu.
     * 
     * @param title   The title of the Pokemon to show nest locations of.
     */
    public showTownMapPokemonLocations(title: string[]): void {
        let dialog: string[] = [].slice.call(title);

        dialog.push(..."'s NEST".split(""));

        this.gameStarter.menuGrapher.addMenuDialog("Town Map", [dialog]);

        console.warn("Pokemon map locations not implemented.");
    }

    /**
     * Displays message when a Player tries to use an item that cannot be used.
     *
     * @param player   A Player who cannot use an item.
     */
    public cannotDoThat(player: IPlayer): void {
        this.displayMessage(player, "OAK: %%%%%%%PLAYER%%%%%%%! \n This isn't the \n time to use that!");
    }

    /**
     * Displays a message to the user.
     *
     * @param _thing   The Thing that triggered the error.
     * @param message   The message to be displayed.
     */
    public displayMessage(_thing: IThing, message: string): void {
        if (this.gameStarter.menuGrapher.getActiveMenu()) {
            return;
        }

        this.gameStarter.menuGrapher.createMenu("GeneralText", {
            deleteOnFinish: true
        });
        this.gameStarter.menuGrapher.addMenuDialog(
            "GeneralText",
            [
                message
            ]
        );
        this.gameStarter.menuGrapher.setActiveMenu("GeneralText");
    }
}
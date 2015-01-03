(function () {
    FullScreenPokemon.prototype.settings.objects = {
        "onMake": "onMake",
        "indexMap": ["width", "height"],
        "doPropertiesFull": true,
        "inheritance": {
            "Quadrant": {},
            "Map": {},
            "Area": {},
            "Location": {},
            "Thing": {
                "Character": {
                    "Mother": {},
                    "Player": {}
                },
                "Solid": {
                    "BedSingle": {},
                    "Bookshelf": {},
                    "ComputerDesk": {},
                    "ConsoleAndController": {},
                    "InvisibleWall": {},
                    "PottedPalmTree": {},
                    "StairsDown": {},
                    "StairsUp": {},
                    "Table3x2": {},
                    "Table3x3": {},
                    "TelevisionMonitor": {}
                },
                "Scenery": {
                    "Doormat": {},
                    "FlowerVase": {},
                    "Stool": {},
                    "WindowBlinds": {}
                },
                "Terrain": {
                    "FloorTiledDiagonal": {},
                    "TerrainSmall": {
                        "TerrainSmallRepeating": {
                            "WallIndoorHorizontalBands": {}
                        }
                    }
                }
            }
        },
        "properties": {
            "Quadrant": {
                "tolx": 0,
                "toly": 0
            },
            "Map": {
                "initialized": false
            },
            "Area": {
                "background": "black"
            },
            "Location": {
                "entry": "Normal"
            },
            "Thing": {
                // Sizing
                "width": 8,
                "height": 8,
                // Placement
                "alive": true,
                "placed": false,
                "maxquads": 4,
                // Sprites
                "sprite": "",
                "spriteType": "neither",
                "opacity": 1,
                // Movements
                "direction": 2, // top,right,bottom,left is 0,1,2,3
                "isMoving": false,
                "movement": undefined,
                // Triggered Functions
                "onMake": FullScreenPokemon.prototype.thingProcess,
            },
            "Character": {
                "groupType": "Character",
                "speed": FullScreenPokemon.unitsize / 4
            },
            "Player": {
                "player": true
            },
            "Solid": {
                "groupType": "Solid",
                "repeat": true
            },
            "BedSingle": [8, 16],
            "Bookshelf": [8, 16],
            "ComputerDesk": [8, 16],
            "ConsoleController": [8, 5],
            "InvisibleWall": {
                "hidden": true
            },
            "PottedPalmTree": [8, 16],
            "Table3x2": [16, 16],
            "Table3x3": [16, 16],
            "Scenery": {
                "groupType": "Scenery",
                "repeat": true
            },
            "FlowerVase": [6, 6],
            "Terrain": {
                "groupType": "Terrain",
                "repeat": true
            },
            "TerrainSmall": [2, 2],
            "TerrainSmallRepeating": {
                "width": 8,
                "height": 8,
                "spritewidth": 2,
                "spriteheight": 2
            }
        }
    };
})();
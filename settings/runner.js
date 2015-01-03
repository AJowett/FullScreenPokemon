FullScreenPokemon.prototype.settings.runner = {
    "upkeepScheduler": setTimeout,
    "upkeepCanceller": clearTimeout,
    "interval": 1000 / 60,
    "adjustFramerate": true,
    "games": [
        function () {
            this.PixelDrawer.refillGlobalCanvas(this.MapsHandler.getArea().background);
        },
        function () {
            this.maintainCharacters(this, this.GroupHolder.getCharacterGroup());
        },
        function () {
            this.TimeHandler.handleEvents();
        }
    ]
}
// Parses compact string-based map definitions into 2D tile arrays for Phaser
window.Game = window.Game || {};

Game.MapLoader = {
    /**
     * Parse an area's string map rows into a 2D array of tile indices.
     * Each character in the map string is looked up in the area's legend.
     * @param {Object} area - Area definition with .map (string[]) and .legend ({char: tileId})
     * @returns {number[][]} 2D tile index array for Phaser tilemap
     */
    parse(area) {
        const { map, legend, width } = area;
        return map.map((row, y) => {
            const tiles = [];
            for (let x = 0; x < width; x++) {
                const ch = row[x];
                if (ch && legend[ch] !== undefined) {
                    tiles.push(legend[ch]);
                } else {
                    // Default to grass for unmapped or missing characters
                    tiles.push(Game.Tiles.G);
                }
            }
            return tiles;
        });
    }
};

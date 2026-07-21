// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};

Game.TILE_SIZE = 16;
Game.SCALE = 3;
Game.TWEEN_DURATION = 160;
Game.TAP_DELAY = 45;

// Tile IDs (derived from tileset grid positions)
// Tileset is 1024px wide = 64 tiles per row
// Index formula: (row - 1) * 64 + (col - 1)  (1-based coords)
Game.Tiles = {
    G: 0,     // Grass (1,1)
    P: 1,     // Dirt Path (2,1)
    TT: 66,   // Pine Tree Top (3,2)
    TB: 130,  // Tree Trunk / Stump (3,3)
    R: 192,   // Rock (1,4) — reserved for future use
    S: 288    // Stairs / Door placeholder (33,5)
};

// Compact string-based area definitions
// Each character in a map row maps to a tile ID via the legend
window.Game = window.Game || {};

Game.Areas = {
    overworld: {
        id: 'overworld',
        name: 'Neulamäki Outskirts',
        width: 24,
        height: 18,
        legend: { G: Game.Tiles.G, P: Game.Tiles.P, T: Game.Tiles.TT, B: Game.Tiles.TB, S: Game.Tiles.S, R: Game.Tiles.R },
        solidTiles: [Game.Tiles.TT, Game.Tiles.TB, Game.Tiles.R],
        // 24 chars per row — verified against original tile arrays
        map: [
            'TTTTTTTTTTTTTTTTTTTTTTTT', // row 0:  all tree tops
            'BBBBBBBBBBBBBBBBBBBBBBBB', // row 1:  all trunks
            'TGGGGGGGGGGGSGGGGGGGGGGT', // row 2:  S at col 12
            'BGPPPPPPPPPPPPPPPPPPPPGB', // row 3
            'TGPGGGGGPGGGGGPGGGGGPGGT', // row 4
            'BGPGTGGGPGTGGGPGTGGGPGGB', // row 5
            'TGPGBGGGPGBGGGPGBGGGPGGT', // row 6
            'BGPGGGGGPGGGGGPGGGGGPGGB', // row 7
            'TGPPPPPPPPPPPPPPPPPPPGGT', // row 8
            'BGGGGGGGGGGGGGGGGGGGGGGB', // row 9
            'TGGGTGGGGGGGGGGGGGTGGGGT', // row 10
            'BGGGBGGGGGGGGGGGGGBGGGGB', // row 11
            'TGPPPPPPPPPPPPPPPPPPPGGT', // row 12
            'BGPGGGGGGGGGGGGGGGGGPGGB', // row 13
            'TGPPPPPPPPPPPPPPPPPPPGGT', // row 14
            'BGGGGGGGGGGGGGGGGGGGGGGB', // row 15
            'TTTTTTTTTTTTTTTTTTTTTTTT', // row 16
            'BBBBBBBBBBBBBBBBBBBBBBBB'  // row 17
        ],
        doors: [
            { x: 12, y: 2, targetArea: 'house', targetX: 5, targetY: 6 }
        ]
    },
    house: {
        id: 'house',
        name: 'Research Lab',
        width: 11,
        height: 8,
        legend: { G: Game.Tiles.G, P: Game.Tiles.P, T: Game.Tiles.TT, B: Game.Tiles.TB, S: Game.Tiles.S, R: Game.Tiles.R },
        solidTiles: [Game.Tiles.TT, Game.Tiles.TB, Game.Tiles.R],
        // 11 chars per row
        map: [
            'TTTTTTTTTTT', // row 0
            'BBBBBBBBBBB', // row 1
            'TPPPPPPPPPT', // row 2
            'BPGGGGGGGPB', // row 3
            'TPGPPPPGPPT', // row 4
            'BPGPGGPGPGB', // row 5
            'TPPPPSPPPPT', // row 6: S at col 5
            'BTTTTTTTTTB'  // row 7
        ],
        doors: [
            { x: 5, y: 6, targetArea: 'overworld', targetX: 12, targetY: 2 }
        ]
    }
};

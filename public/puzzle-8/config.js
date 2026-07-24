// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};
// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};

Game.TILE_SIZE = 16;
Game.SCALE = 3;
Game.TWEEN_DURATION = 160;
Game.TAP_DELAY = 45;

Game.WALKABLE_TILES = new Set([
    0, 1, 199, 200, 288, 517, 518, 581, 582, 645, 681, 682, 683, 273, 2816, 2817, 2818, 2819, 2820, 2821, 2822, 2823, 2824, 2825, 2826, 2827, 2828, 2829,
    2830, 2831, 2832, 2833, 2880, 2881, 2882, 2883, 2884, 2885, 2886, 2887, 2888, 2889, 2890, 2891, 2892, 2893, 2894, 2895, 2896,
    2944, 2945, 2946, 2947, 3008, 3009, 3010, 3011, 2631, 436, 1370, 451, 2633, 320, 384, 448, 69, 70, 5, 6, 1829, 1831, 2021, 2023, 2024, 1317, 1318, 1319, 1320, 1445, 1446, 1447, 440, 439
]);

Game.INSPECT_MESSAGES = {
    192: ['Its a rock...'], 193: ['Its a rock...'], 194: ['Its a rock...'],
    260: ['Every Serveri loves grilling!'],
    3269: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3270: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3208: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3272: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'],
    3141: ['Audi 50 ', 'What a car!'], 3142: ['Audi 50 ', 'What a car!'], 3143: ['Audi 50 ', 'What a car!'], 3079: ['Audi 50 ', 'What a car!'],
    3077: ['Wolksvagen golf GTI'], 3078: ['Wolksvagen golf GTI'], 3144: ['Wolksvagen golf GTI'], 3080: ['Wolksvagen golf GTI'],
    3205: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3206: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3271: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3207: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'],
    3138: ['Might be related to triangle man'], 3074: ['Its good thing there is not much traffic'], 195: ['Its a barrel, or a pipe maybe?'], 132: ['Just a bush'], 2762: ['Some old tires'], 2757: ['Damn construction!'], 2758: ['Damn construction!'],
    2759: ['Damn construction!'], 225: ['It\'s locked'], 226: ['It\'s locked'], 227: ['It\'s locked'], 291: ['It\'s locked'], 671: ['It\'s a computer! I love computers :)'], 673: ['Nothing interesting ever on TV..'], 674: ['Nothing interesting ever on TV..'],
    418: ['Poster of my favourite game!', 'I play it with my friends'], 377: ['I don\'t like this weird plant']
};

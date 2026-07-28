// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};
// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};

Game.TILE_SIZE = 16;
Game.SCALE = 4;
Game.TWEEN_DURATION = 160;
Game.TAP_DELAY = 45;

// Shared Game Settings & Persistence
Game.settings = Game.settings || {
    crtEnabled: true,
    volume: 80
};

try {
    const saved = localStorage.getItem('puzzle8_settings');
    if (saved) {
        Object.assign(Game.settings, JSON.parse(saved));
    }
} catch (e) { }

Game.saveSettings = function () {
    try {
        localStorage.setItem('puzzle8_settings', JSON.stringify(Game.settings));
    } catch (e) { }
};

Game.applyCRTSettings = function () {
    const crtOverlay = document.querySelector('.crt-overlay');
    if (crtOverlay) {
        crtOverlay.style.display = Game.settings.crtEnabled ? 'block' : 'none';
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Game.applyCRTSettings());
    } else {
        setTimeout(() => Game.applyCRTSettings(), 0);
    }
}

Game.WALKABLE_TILES = new Set([
    0, 1, 199, 200, 288, 517, 518, 581, 582, 645, 681, 682, 683, 273, 2816, 2817, 2818, 2819, 2820, 2821, 2822, 2823, 2825, 2826, 2827, 2828, 2829,
    2830, 2831, 2832, 2833, 2880, 2881, 2882, 2883, 2884, 2885, 2886, 2887, 2889, 2890, 2891, 2892, 2893, 2894, 2895, 2896,
    2944, 2945, 2946, 2947, 2948, 3008, 3009, 3010, 3011, 2631, 436, 1370, 451, 2633, 320, 321, 384, 385, 448, 449, 69, 70, 5, 6, 1829, 1831, 2021, 2023, 2024, 1317, 1318, 1319, 1320, 1445, 1446, 1447, 440, 439,
    2949, 2950, 2951, 2952, 3013, 3014, 3015, 3016, 3019, 3020, 2956, 2765, 2766, 2767, 2768, 2769, 2897, 2134, 2198, 1765, 1767, 2953, 2954, 2955, 3017, 3018, 2704, 2699, 2700, 2701, 2702, 2703, 2958, 2957,
    2187, 2250, 2251, 2252, 2189, 2566, 2630, 2182, 2185, 3021, 3022
]);

Game.DOOR_BLACK_TILE = 780;
Game.DOOR_BLACK_TILES = {
    199: 781,
    200: 781,
    2182: 1036,
    2185: 1037
};
Game.DOOR_FRAMES = {
    2134: 844,
    2198: 908,
    1370: 909,
    199: 910,
    200: 911,
    2182: 972,
    2185: 973
};

Game.INSPECT_MESSAGES = {
    192: ['Its a rock...'], 193: ['Its a rock...'], 194: ['Its a rock...'],
    260: ['Every Serveri loves grilling!'],
    3269: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3270: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3208: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3272: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'],
    3141: ['Audi 50 ', 'What a car!'], 3142: ['Audi 50 ', 'What a car!'], 3143: ['Audi 50 ', 'What a car!'], 3079: ['Audi 50 ', 'What a car!'],
    3077: ['Wolksvagen golf GTI'], 3078: ['Wolksvagen golf GTI'], 3144: ['Wolksvagen golf GTI'], 3080: ['Wolksvagen golf GTI'],
    3205: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3206: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3271: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3207: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'],
    3138: ['Might be related to triangle man'], 3074: ['Its good thing there is not much traffic'], 195: ['Its a barrel, or a pipe maybe?'], 132: ['Just a bush'], 2762: ['Some old tires'], 2757: ['Damn construction!'], 2758: ['Damn construction!'],
    2759: ['Damn construction!'], 225: ['It\'s locked'], 226: ['It\'s locked'], 227: ['It\'s locked'], 291: ['It\'s locked'], 671: ['It\'s a computer! I love computers :)'], 673: ['Nothing interesting ever on TV..'], 674: ['Nothing interesting ever on TV..'],
    418: ['Poster of my favourite game!', 'I play it with my friends'], 377: ['I don\'t like this weird plant'], 3209: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3210: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3276: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3212: ['BMW E36 Cabrio', 'Clearly compensating for something'],
    3273: ['Toyota Corolla', 'Definitely not compensating for anything'], 3274: ['Toyota Corolla', 'Definitely not compensating for anything'], 3211: ['Toyota Corolla', 'Definitely not compensating for anything'], 3275: ['Toyota Corolla', 'Definitely not compensating for anything'], 2824: ['Construction around here seems to never finish'], 2888: ['Construction around here seems to never finish'],
    1750: ['Locked, I should have guessed'], 3072: ['The light bulb is burning into my eyes!'], 3136: ['Put that light away!'], 612: ['Books: Java 101: The importance of programming socks,', '..How to craft a nuclear device, in Minecraft'], 676: ['Books: Java 101: The importance of programming socks,', '..How to craft a nuclear device, in Minecraft'],
    3012: ['Its a barrel, or a pipe maybe?']
};

Game.SIGN_MESSAGES = {
    'serveriquest_66_24': ['Neulamäki karting', 'Open 10-19'],
    'serveriquest_75_48': ['Berries are a good snack!', 'Press I or E to open your inventory and eat collected berries.'],
    'serveriquest_54_21': ['Road to Neulamäki'],
    'serveriquest_55_4': ['Road to Savilahti'],
    'serveriquest_33_52': ['Serveri mouse house & grill', 'I live here!'],
    'savilahti_3_47': ['Novapolis\n \n↑ Main enterance', '→ Serveri enterance'],
    'savilahti_30_71': ['← Microkatu campus\n\n↓ Neulamäki'],
    'savilahti_4_18': ['↑ Snellmania'],
    'savilahti_51_7': ['Snellmania ↑'],
    'savilahti_37_23': ['Savonia has been closed due to too destructive AMK final projects']
    // Add more signs here as needed
};

Game.LOCKED_DOORS = {
    'savilahti': [
        { x: 14, y: 35, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain fails to open the door'] },
        { x: 41, y: 32, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain fails to open the door'] },
        { x: 14, y: 50, requiredItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: null },
        { x: 16, y: 42, requiredItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: null }
    ],
    'snellmania': [
        { x: 45, y: 58, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Its locked', 'Let\'s try the other door'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain does not in Snellmania'] },
    ]
};

Game.MAP_TRANSITIONS = {
    'serveriquest': {
        byTile: {
            2631: { targetMap: '/puzzle-8/data/NeulamaenSale.csv', targetX: 1, targetY: 2 },
            2633: { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 26, targetY: 93 },
            1370: { targetMap: '/puzzle-8/data/House.csv', targetX: 7, targetY: 11 }
        }
    },
    'NeulamaenSale': {
        byTile: {
            2021: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 13, targetY: 48 },
            2023: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 13, targetY: 48 }
        }
    },
    'savilahti': {
        byTile: {
            2631: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 57, targetY: 0 }
        },
        byCoord: {
            '14,50': { targetMap: '/puzzle-8/data/Laitos.csv', targetX: 5, targetY: 2, requiredItem: 'Nappi avain' },
            '16,42': { targetMap: '/puzzle-8/data/Laitos.csv', targetX: 5, targetY: 2, requiredItem: 'Nappi avain' },
            '53,0': { targetMap: '/puzzle-8/data/snellmania.csv', targetX: 52, targetY: 79 }
        }
    },
    'House': {
        byTile: {
            1829: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 38, targetY: 52 },
            1831: { targetMap: '/puzzle-8/data/serveriquest.csv', targetX: 38, targetY: 52 }
        }
    },
    'Laitos': {
        byTile: {
            1765: { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 14, targetY: 51 },
            1767: { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 14, targetY: 51 }
        },
        byCoord: {},
        edgeTransitions: {
            top: { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 14, targetY: 51 }
        }
    },
    'snellmania': {
        byCoord: {
            '52,79': { targetMap: '/puzzle-8/data/savilahti.csv', targetX: 53, targetY: 0 }
        }
    },
};

Game.SAME_MAP_TELEPORTS = {
    199: { dx: 3, dy: 0 },
    200: { dx: -3, dy: 0 },
    2566: { dx: -15, dy: 0 },
    2630: { dx: 15, dy: 0 },
    2185: { dx: -5, dy: 0 },
    2182: { dx: 5, dy: 0 }
};

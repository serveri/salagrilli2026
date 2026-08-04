// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};
// Shared constants and tile definitions for the puzzle-8 game engine
window.Game = window.Game || {};

Game.TILE_SIZE = 16;
Game.SCALE = 4;
Game.TWEEN_DURATION = 160;
Game.TAP_DELAY = 45;
Game.testingmode = false;

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

Game.playClickSound = function () {
    try {
        const vol = (Game.settings && Game.settings.volume !== undefined ? Game.settings.volume : 80) / 100;
        if (vol <= 0) return;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!Game._audioCtx) {
            Game._audioCtx = new AudioCtx();
        }
        if (Game._audioCtx.state === 'suspended') {
            Game._audioCtx.resume();
        }

        const ctx = Game._audioCtx;
        const now = ctx.currentTime;

        // Classic JRPG / Pokemon Menu Accept ascending dual chime (D5 -> A5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        // Step from D5 (587Hz) to A5 (880Hz)
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.setValueAtTime(880, now + 0.035);

        osc2.frequency.setValueAtTime(587.33, now);
        osc2.frequency.setValueAtTime(880, now + 0.035);

        gain.gain.setValueAtTime(vol * 0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.09);
        osc2.stop(now + 0.09);
    } catch (e) { }
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
    2187, 2250, 2251, 2252, 2189, 2566, 2630, 2182, 2185, 3021, 3022, 2694, 2695, 689, 1381, 1383, 685, 1637, 1575, 1703, 1573, 1701, 177, 351, 3082, 686, 439, 1320, 1448, 745, 687, 2078, 2014, 1574, 627, 628,
    437
]);

Game.DOOR_BLACK_TILE = 780;
Game.DOOR_BLACK_TILES = {
    199: 781,
    200: 781,
    2182: 1036,
    2185: 1037,
    2134: 782
};
Game.DOOR_FRAMES = {
    2134: 844,
    2198: 908,
    1370: 909,
    199: 910,
    200: 911,
    2182: 972,
    2185: 973,
    177: 845
};

Game.INSPECT_MESSAGES = {
    192: ['Its a rock...'], 193: ['Its a rock...'], 194: ['Its a rock...'],
    260: ['Every Serveri loves grilling!'],
    3269: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3270: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3208: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'], 3272: ['Rubbish old Skoda', 'Whats up with the RGB lights on top?'],
    3141: ['Audi 50 ', 'What a car!'], 3142: ['Audi 50 ', 'What a car!'], 3143: ['Audi 50 ', 'What a car!'], 3079: ['Audi 50 ', 'What a car!'],
    3077: ['Wolksvagen golf GTI'], 3078: ['Wolksvagen golf GTI'], 3144: ['Wolksvagen golf GTI'], 3080: ['Wolksvagen golf GTI'],
    3205: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3206: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3271: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'], 3207: ['Mercedes-Benz X 350 d 4MATIC', 'What a car!'],
    3138: ['Might be related to triangle man'], 3074: ['Its good thing there is not much traffic'], 195: ['Its a barrel, or a pipe maybe'], 132: ['Just a bush'], 2762: ['Some old tires'], 2757: ['Damn construction!'], 2758: ['Damn construction!'],
    2759: ['Damn construction!'], 225: ['It\'s locked'], 226: ['It\'s locked'], 227: ['It\'s locked'], 291: ['It\'s locked'], 671: ['It\'s a computer! I love computers :)'], 799: ['It\'s a computer! I love computers :)'], 673: ['Nothing interesting ever on TV..'], 674: ['Nothing interesting ever on TV..'],
    418: ['Poster of my favourite game!', 'I play it with my friends'], 377: ['I don\'t like this weird plant'], 3209: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3210: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3276: ['BMW E36 Cabrio', 'Clearly compensating for something'], 3212: ['BMW E36 Cabrio', 'Clearly compensating for something'],
    3273: ['Toyota Corolla', 'Definitely not compensating for anything'], 3274: ['Toyota Corolla', 'Definitely not compensating for anything'], 3211: ['Toyota Corolla', 'Definitely not compensating for anything'], 3275: ['Toyota Corolla', 'Definitely not compensating for anything'], 2824: ['Construction around here seems to never finish'], 2888: ['Construction around here seems to never finish'],
    1750: ['Locked, I should have guessed when coming here'], 3072: ['The light bulb is burning into my eyes!'], 3136: ['Put that light away!'], 612: ['Books: Tux Linux - GNU/Linux 101: The importance of programming socks,', '..How to craft a nuclear device, in Minecraft'], 676: ['Books: Tux Linux - GNU/Linux 101: The importance of programming socks,', '.. Chad.Gepede - How to craft a nuclear device, in Minecraft'],
    3012: ['Its a barrel, or a pipe maybe'], 519: ['I sniff my rose this morning, yes'], 584: ['I sniff my rose this morning, yes'], 3081: ['A flimsy bike rack'], 290: ['I sniff my rose this morning, yes'], 1056: ['That hat must have been left by one of the bussiness students'], 1120: ['That hat must have been left by one of the bussiness students'], 1057: ['M\'lady'], 1121: ['I found him!'], 1122: ['Mice don\'t wear hats'],
    1058: ['Mice don\'t wear hats'], 662: ['Restaurant Hunter has closed down for good', 'You shed a small tear'], 113: ['Locked', 'I\'m not gonna break into the offices of our nice staff!'], 228: ['Restaurant is not open right now'], 1119: ['No exam paper at this seat'], 805: ['Books: S.Javasteel - Differences of japanese and finnish binary tree gardens', '...S.Alterman: Mechanical humans and their superiority'], 869: ['Books: S.Javasteel - Differences of japanese and finnish binary tree gardens', '...S.Alterman: Mechanical humans and their superiority'],
    3264: ['Bus 4 schedule: Every 5 minutes to Neulamäki'], 3200: ['Bus 4 schedule: Every 5 minutes to Neulamäki'], 545: ['Exam paper ready to go! I\'m nervous!'],
    246: ['Smoked salmon -like sandvich'], 310: ['Smoked salmon -like sandvich'], 31: ['Looks pretty empty'], 95: ['Looks pretty empty'], 483: ['Wish I had time to play', 'But that exam is pretty soon!'], 484: ['Wish I had time to play', 'But that exam is pretty soon!']
};

Game.SIGN_MESSAGES = {
    'serveriquest_66_24': ['Neulamäki karting', 'Open 10-19'],
    'serveriquest_75_47': ['Berries are a good snack!', 'Eat them from a bush, but only once', 'Find multiple other energy restoring items, interract with items on the ground to collect them'],
    'serveriquest_54_21': ['Road to Neulamäki'],
    'serveriquest_55_4': ['Road to Savilahti'],
    'serveriquest_33_52': ['Serveri mouse house & grill', 'I live here!'],
    'serveriquest_83_23': ['Serveri tip: Check you backbag by pressing E or I', 'Some items can help you alot!'],
    'serveriquest_11_34': ['Serveri tip: conserve some energy by jumping down cliffs!'],
    'serveriquest_1_51': ['Serveri tip: You can rest on a bench if your energy is lower than 50', 'But make note of time passing!'],
    'savilahti_3_47': ['Novapolis\n \n↑ Main enterance', '→ Serveri enterance'],
    'savilahti_30_71': ['← Microkatu campus\n\n↓ Neulamäki'],
    'savilahti_5_9': ['↑ Snellmania'],
    'savilahti_51_7': ['Snellmania ↑'],
    'savilahti_37_23': ['Savonia has been closed due to too destructive AMK final projects'],
    'snellmania_11_45': ['↑ Snellmania lobby'],
    'snellmania_42_22': ['University of eastern finland'],
    'snellmania_46_47': ['Serveri tip: Remember to bring a pencil to the exam!'],
    'Exam_4_45': ['Serveri tip: The exam gets way harder if you have not slept, or if your energy is low.', 'But it is passable!'],
    // Add more signs here as needed
};

Game.LOCKED_DOORS = {
    'serveriquest': [
        { x: 38, y: 52, requiredItem: 'home_key', msgMissing: ['The door to my house is locked!', 'I need my Home Key to get inside.'], msgHasItem: null }
    ],
    'savilahti': [
        { x: 14, y: 35, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain fails to open the door'] },
        { x: 41, y: 32, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain fails to open the door'] },
        { x: 14, y: 50, requiredItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: null },
        { x: 16, y: 42, requiredItem: 'Nappi avain', msgMissing: ['Its locked'], msgHasItem: null }
    ],
    'snellmania': [
        { x: 39, y: 52, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Snellmania is locked!', 'Let\'s try the other door or wait until morning.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain does not work in Snellmania.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'] },
        { x: 7, y: 55, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Snellmania is locked!', 'Let\'s try the other door or wait until morning.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain does not work in Snellmania.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'] },
        { x: 15, y: 52, requiredItem: null, failedItem: 'Nappi avain', msgMissing: ['Snellmania is locked!', 'Let\'s try the other door or wait until morning.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'], msgHasItem: ['Light on the lock is flashing red..', 'Nappiavain does not work in Snellmania.', 'Tip: You can pass time by resting in bed at home or sitting on a bench.'] },
    ],
    'Exam': [
        { x: 18, y: 30, requiredItem: 'pencil', msgMissing: ['Oh wait! I need a pencil to enter the exam'], msgHasItem: null }
    ]
};

Game.MAP_TRANSITIONS = {
    'serveriquest': {
        byTile: {
            2631: { targetMap: 'data/NeulamaenSale.csv', targetX: 1, targetY: 2, exitDir: 'down' },
            2633: { targetMap: 'data/savilahti.csv', targetX: 26, targetY: 93 },
            1370: { targetMap: 'data/House.csv', targetX: 9, targetY: 12, requiredItem: 'Home Key' }
        }
    },
    'NeulamaenSale': {
        byTile: {
            2021: { targetMap: 'data/serveriquest.csv', targetX: 13, targetY: 48 },
            2023: { targetMap: 'data/serveriquest.csv', targetX: 13, targetY: 48 }
        }
    },
    'savilahti': {
        byTile: {
            2631: { targetMap: 'data/serveriquest.csv', targetX: 57, targetY: 0 }
        },
        byCoord: {
            '14,50': { targetMap: 'data/Laitos.csv', targetX: 45, targetY: 18, requiredItem: 'Nappi avain' },
            '16,42': { targetMap: 'data/Laitos.csv', targetX: 43, targetY: 9, requiredItem: 'Nappi avain', exitDir: 'right' },
            '53,0': { targetMap: 'data/snellmania.csv', targetX: 46, targetY: 73 },
            '0,6': { targetMap: 'data/snellmania.csv', targetX: 8, targetY: 66 },
            '75,15': { targetMap: 'data/Prisma.csv', targetX: 2, targetY: 15, exitDir: 'up' },
            '75,16': { targetMap: 'data/Prisma.csv', targetX: 2, targetY: 15, exitDir: 'up' }
        }
    },
    'House': {
        byTile: {
            1829: { targetMap: 'data/serveriquest.csv', targetX: 38, targetY: 52 },
            1831: { targetMap: 'data/serveriquest.csv', targetX: 38, targetY: 52 }
        }
    },
    'Laitos': {
        byCoord: {
            '43,9': { targetMap: 'data/savilahti.csv', targetX: 16, targetY: 42 },
            '43,8': { targetMap: 'data/savilahti.csv', targetX: 16, targetY: 42 },
            '43,10': { targetMap: 'data/savilahti.csv', targetX: 16, targetY: 42 },
            '45,18': { targetMap: 'data/savilahti.csv', targetX: 14, targetY: 50 },
            '46,18': { targetMap: 'data/savilahti.csv', targetX: 14, targetY: 50 }
        }
    },
    'snellmania': {
        byCoord: {
            '46,73': { targetMap: 'data/savilahti.csv', targetX: 53, targetY: 0 },
            '8,66': { targetMap: 'data/savilahti.csv', targetX: 0, targetY: 6 },
            '11,41': { targetMap: 'data/Exam.csv', targetX: 0, targetY: 37, exitDir: 'right' },
            '40,19': { targetMap: 'data/Exam.csv', targetX: 30, targetY: 38 },
            '40,20': { targetMap: 'data/Exam.csv', targetX: 30, targetY: 38 }
        }
    },
    'Exam': {
        byCoord: {
            '30,37': { targetMap: 'data/snellmania.csv', targetX: 40, targetY: 20 },
            '30,38': { targetMap: 'data/snellmania.csv', targetX: 40, targetY: 20 },
            '30,39': { targetMap: 'data/snellmania.csv', targetX: 40, targetY: 20 },
            '0,38': { targetMap: 'data/snellmania.csv', targetX: 11, targetY: 41 },
            '0,37': { targetMap: 'data/snellmania.csv', targetX: 11, targetY: 41 }
        }
    },
    'Prisma': {
        byCoord: {
            '1,15': { targetMap: 'data/savilahti.csv', targetX: 75, targetY: 15, exitDir: 'left' },
            '2,15': { targetMap: 'data/savilahti.csv', targetX: 75, targetY: 15, exitDir: 'left' },
            '3,15': { targetMap: 'data/savilahti.csv', targetX: 75, targetY: 15, exitDir: 'left' }
        },
        byTile: {
            1574: { targetMap: 'data/savilahti.csv', targetX: 75, targetY: 15, exitDir: 'left' }
        }
    }
};

Game.SAME_MAP_TELEPORTS = {
    'serveriquest': {
        '30,36': { targetX: 33, targetY: 36 },
        '33,36': { targetX: 30, targetY: 36 }
    },
    'snellmania': {
        '56,73': { targetX: 59, targetY: 73 }
    },
    'savilahti': {
        '40,9': { targetX: 26, targetY: 10 },
        '26,10': { targetX: 40, targetY: 9 },
        '56,13': { targetX: 61, targetY: 13 },
        '61,13': { targetX: 56, targetY: 13 },
        '56,14': { targetX: 61, targetY: 14 },
        '61,14': { targetX: 56, targetY: 14 },
        '56,15': { targetX: 61, targetY: 15 },
        '61,15': { targetX: 56, targetY: 15 },
        '56,16': { targetX: 61, targetY: 16 },
        '61,16': { targetX: 56, targetY: 16 },
        '56,17': { targetX: 61, targetY: 17 },
        '61,17': { targetX: 56, targetY: 17 },
        '56,18': { targetX: 61, targetY: 18 },
        '61,18': { targetX: 56, targetY: 18 },
        '56,19': { targetX: 61, targetY: 19 },
        '61,19': { targetX: 56, targetY: 19 }
    },
    'Laitos': {
        '43,13': { targetX: 1, targetY: 9, exitDir: 'right' },
        '1,9': { targetX: 43, targetY: 13, exitDir: 'right' }
    },
    'Exam': {
        '18,30': { targetX: 1, targetY: 7, exitDir: 'right' }
    }
};

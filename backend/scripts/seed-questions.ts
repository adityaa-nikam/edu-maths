import 'dotenv/config';
import { db } from '../src/db';
import {
    questionsEasy,
    questionsMedium,
    questionsHard,
} from '../src/db/schema';

/* ========================= EASY (50) ========================= */

const easyQuestions = [
    { question: "5 + 3 = ?", options: ["6", "7", "8", "9"], correctOption: 2 },
    { question: "7 + 4 = ?", options: ["10", "11", "12", "13"], correctOption: 1 },
    { question: "9 + 6 = ?", options: ["14", "15", "16", "17"], correctOption: 1 },
    { question: "12 + 8 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "14 + 5 = ?", options: ["17", "18", "19", "20"], correctOption: 2 },

    { question: "10 - 3 = ?", options: ["6", "7", "8", "9"], correctOption: 1 },
    { question: "15 - 6 = ?", options: ["7", "8", "9", "10"], correctOption: 2 },
    { question: "18 - 7 = ?", options: ["9", "10", "11", "12"], correctOption: 2 },
    { question: "20 - 8 = ?", options: ["10", "11", "12", "13"], correctOption: 2 },
    { question: "25 - 9 = ?", options: ["14", "15", "16", "17"], correctOption: 2 },

    { question: "4 × 3 = ?", options: ["10", "11", "12", "13"], correctOption: 2 },
    { question: "6 × 4 = ?", options: ["22", "23", "24", "25"], correctOption: 2 },
    { question: "7 × 5 = ?", options: ["33", "34", "35", "36"], correctOption: 2 },
    { question: "8 × 3 = ?", options: ["22", "23", "24", "25"], correctOption: 2 },
    { question: "9 × 4 = ?", options: ["34", "35", "36", "37"], correctOption: 2 },

    { question: "8 ÷ 4 = ?", options: ["1", "2", "3", "4"], correctOption: 1 },
    { question: "10 ÷ 5 = ?", options: ["1", "2", "3", "4"], correctOption: 1 },
    { question: "12 ÷ 3 = ?", options: ["3", "4", "5", "6"], correctOption: 1 },
    { question: "18 ÷ 6 = ?", options: ["2", "3", "4", "5"], correctOption: 1 },
    { question: "20 ÷ 4 = ?", options: ["4", "5", "6", "7"], correctOption: 1 },

    { question: "11 + 9 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "13 + 7 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "16 + 6 = ?", options: ["20", "21", "22", "23"], correctOption: 2 },
    { question: "18 + 5 = ?", options: ["21", "22", "23", "24"], correctOption: 2 },
    { question: "9 + 14 = ?", options: ["21", "22", "23", "24"], correctOption: 2 },

    { question: "30 - 12 = ?", options: ["16", "17", "18", "19"], correctOption: 2 },
    { question: "35 - 15 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "40 - 18 = ?", options: ["20", "21", "22", "23"], correctOption: 2 },
    { question: "45 - 27 = ?", options: ["16", "17", "18", "19"], correctOption: 2 },
    { question: "50 - 31 = ?", options: ["17", "18", "19", "20"], correctOption: 2 },

    { question: "5 × 7 = ?", options: ["33", "34", "35", "36"], correctOption: 2 },
    { question: "6 × 8 = ?", options: ["46", "47", "48", "49"], correctOption: 2 },
    { question: "7 × 6 = ?", options: ["40", "41", "42", "43"], correctOption: 2 },
    { question: "8 × 5 = ?", options: ["38", "39", "40", "41"], correctOption: 2 },
    { question: "9 × 5 = ?", options: ["43", "44", "45", "46"], correctOption: 2 },

    { question: "21 ÷ 7 = ?", options: ["2", "3", "4", "5"], correctOption: 1 },
    { question: "24 ÷ 6 = ?", options: ["3", "4", "5", "6"], correctOption: 1 },
    { question: "32 ÷ 8 = ?", options: ["3", "4", "5", "6"], correctOption: 1 },
    { question: "36 ÷ 6 = ?", options: ["5", "6", "7", "8"], correctOption: 1 },
    { question: "45 ÷ 9 = ?", options: ["4", "5", "6", "7"], correctOption: 1 },

    { question: "6 + 9 = ?", options: ["13", "14", "15", "16"], correctOption: 2 },
    { question: "14 + 7 = ?", options: ["19", "20", "21", "22"], correctOption: 2 },
    { question: "18 + 6 = ?", options: ["22", "23", "24", "25"], correctOption: 2 },
    { question: "22 - 9 = ?", options: ["11", "12", "13", "14"], correctOption: 2 },
    { question: "30 - 14 = ?", options: ["14", "15", "16", "17"], correctOption: 2 },

    { question: "6 × 7 = ?", options: ["40", "41", "42", "43"], correctOption: 2 },
    { question: "8 × 6 = ?", options: ["46", "47", "48", "49"], correctOption: 2 },
    { question: "24 ÷ 6 = ?", options: ["3", "4", "5", "6"], correctOption: 1 },
    { question: "28 ÷ 7 = ?", options: ["3", "4", "5", "6"], correctOption: 1 },
    { question: "17 + 8 = ?", options: ["23", "24", "25", "26"], correctOption: 2 },
];

/* ========================= MEDIUM (50) ========================= */

const mediumQuestions = [
    { question: "(15 + 27) - 12 = ?", options: ["28", "29", "30", "31"], correctOption: 2 },
    { question: "(32 + 18) - 20 = ?", options: ["28", "29", "30", "31"], correctOption: 2 },
    { question: "(45 + 35) - 40 = ?", options: ["38", "39", "40", "41"], correctOption: 2 },
    { question: "(50 + 40) - 35 = ?", options: ["53", "54", "55", "56"], correctOption: 2 },
    { question: "(60 + 25) - 30 = ?", options: ["53", "54", "55", "56"], correctOption: 2 },

    { question: "9 × (8 - 2) = ?", options: ["48", "50", "54", "56"], correctOption: 2 },
    { question: "8 × (10 - 3) = ?", options: ["54", "56", "58", "60"], correctOption: 1 },
    { question: "7 × (9 - 3) = ?", options: ["40", "42", "44", "46"], correctOption: 1 },
    { question: "6 × (12 - 5) = ?", options: ["40", "42", "44", "46"], correctOption: 1 },
    { question: "5 × (14 - 6) = ?", options: ["38", "40", "42", "44"], correctOption: 1 },

    { question: "(64 ÷ 8) × 7 = ?", options: ["54", "56", "58", "60"], correctOption: 1 },
    { question: "(72 ÷ 9) × 8 = ?", options: ["62", "64", "66", "68"], correctOption: 1 },
    { question: "(81 ÷ 9) × 7 = ?", options: ["61", "63", "65", "67"], correctOption: 1 },
    { question: "(90 ÷ 10) × 6 = ?", options: ["52", "54", "56", "58"], correctOption: 1 },
    { question: "(100 ÷ 5) × 3 = ?", options: ["58", "60", "62", "64"], correctOption: 1 },

    { question: "125 - 48 + 23 = ?", options: ["98", "99", "100", "101"], correctOption: 2 },
    { question: "200 - 75 + 25 = ?", options: ["148", "149", "150", "151"], correctOption: 2 },
    { question: "180 - 60 + 30 = ?", options: ["148", "149", "150", "151"], correctOption: 2 },
    { question: "160 - 45 + 15 = ?", options: ["128", "130", "132", "134"], correctOption: 1 },
    { question: "140 - 50 + 20 = ?", options: ["108", "110", "112", "114"], correctOption: 1 },

    { question: "(25 + 35) ÷ 2 = ?", options: ["28", "29", "30", "31"], correctOption: 2 },
    { question: "(48 + 32) ÷ 4 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "(60 + 40) ÷ 5 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "(72 + 48) ÷ 6 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "(90 + 30) ÷ 6 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },

    { question: "(36 + 24) ÷ 3 = ?", options: ["18", "19", "20", "21"], correctOption: 2 },
    { question: "(84 ÷ 7) × 6 = ?", options: ["70", "72", "74", "76"], correctOption: 1 },
    { question: "(120 ÷ 6) + 10 = ?", options: ["28", "30", "32", "34"], correctOption: 1 },
    { question: "(96 ÷ 8) × 5 = ?", options: ["55", "60", "65", "70"], correctOption: 1 },
    { question: "(150 ÷ 5) - 10 = ?", options: ["18", "20", "22", "24"], correctOption: 1 },

    { question: "(48 + 36) - 24 = ?", options: ["58", "59", "60", "61"], correctOption: 2 },
    { question: "(75 + 25) - 40 = ?", options: ["58", "59", "60", "61"], correctOption: 2 },
    { question: "(90 + 30) - 45 = ?", options: ["73", "74", "75", "76"], correctOption: 2 },
    { question: "(120 + 80) - 150 = ?", options: ["48", "49", "50", "51"], correctOption: 2 },
    { question: "(200 + 150) - 275 = ?", options: ["73", "74", "75", "76"], correctOption: 2 },

    { question: "6 × (15 - 7) = ?", options: ["46", "48", "50", "52"], correctOption: 1 },
    { question: "7 × (14 - 6) = ?", options: ["54", "56", "58", "60"], correctOption: 1 },
    { question: "8 × (13 - 5) = ?", options: ["62", "64", "66", "68"], correctOption: 1 },
    { question: "9 × (12 - 4) = ?", options: ["70", "72", "74", "76"], correctOption: 1 },
    { question: "5 × (18 - 10) = ?", options: ["38", "40", "42", "44"], correctOption: 1 },

    { question: "(96 ÷ 8) × 9 = ?", options: ["96", "99", "108", "112"], correctOption: 2 },
    { question: "(81 ÷ 9) × 11 = ?", options: ["88", "99", "108", "121"], correctOption: 1 },
    { question: "(72 ÷ 6) × 8 = ?", options: ["88", "96", "104", "112"], correctOption: 1 },
    { question: "(90 ÷ 5) × 6 = ?", options: ["96", "102", "108", "114"], correctOption: 2 },
    { question: "(64 ÷ 4) × 7 = ?", options: ["98", "105", "112", "119"], correctOption: 1 },

    { question: "250 - 125 + 50 = ?", options: ["165", "170", "175", "180"], correctOption: 2 },
    { question: "300 - 180 + 60 = ?", options: ["170", "175", "180", "185"], correctOption: 2 },
    { question: "400 - 240 + 80 = ?", options: ["235", "240", "245", "250"], correctOption: 1 },
    { question: "360 - 150 + 30 = ?", options: ["235", "240", "245", "250"], correctOption: 1 },
    { question: "500 - 275 + 25 = ?", options: ["245", "250", "255", "260"], correctOption: 1 },
];

/* ========================= HARD (50) ========================= */

const hardQuestions = [
    { question: "(125 + 375) ÷ 10 × 6 = ?", options: ["250", "280", "300", "320"], correctOption: 2 },
    { question: "999 - (48 × 7) = ?", options: ["663", "665", "669", "671"], correctOption: 0 },
    { question: "(84 ÷ 7) + (36 ÷ 6) × 5 = ?", options: ["42", "44", "46", "48"], correctOption: 0 },
    { question: "(240 + 360) ÷ 12 = ?", options: ["48", "50", "52", "54"], correctOption: 1 },
    { question: "(900 ÷ 9) + (80 ÷ 4) = ?", options: ["120", "130", "140", "150"], correctOption: 1 },

    { question: "(720 ÷ 8) + (90 ÷ 3) = ?", options: ["120", "130", "140", "150"], correctOption: 1 },
    { question: "(1000 - 400) ÷ 12 = ?", options: ["48", "50", "52", "54"], correctOption: 1 },
    { question: "(840 ÷ 7) - 40 = ?", options: ["80", "90", "100", "110"], correctOption: 2 },
    { question: "(900 ÷ 15) × 4 = ?", options: ["220", "240", "260", "280"], correctOption: 1 },
    { question: "(144 ÷ 12) × (18 ÷ 6) = ?", options: ["30", "32", "36", "40"], correctOption: 2 },

    { question: "(360 ÷ 9) + (120 ÷ 6) = ?", options: ["56", "58", "60", "62"], correctOption: 2 },
    { question: "(480 ÷ 8) - (60 ÷ 6) = ?", options: ["46", "48", "50", "52"], correctOption: 1 },
    { question: "(150 × 4) ÷ 12 = ?", options: ["45", "48", "50", "52"], correctOption: 2 },
    { question: "(625 ÷ 5) + (75 ÷ 3) = ?", options: ["140", "150", "160", "170"], correctOption: 1 },
    { question: "(540 ÷ 6) - (30 ÷ 3) = ?", options: ["80", "85", "90", "95"], correctOption: 2 },

    { question: "(360 ÷ 12) × (20 ÷ 5) = ?", options: ["96", "100", "108", "120"], correctOption: 2 },
    { question: "(100 + 200 + 300) ÷ 6 = ?", options: ["90", "95", "100", "105"], correctOption: 2 },
    { question: "(800 ÷ 16) + (60 ÷ 3) = ?", options: ["60", "70", "80", "90"], correctOption: 2 },
    { question: "(960 ÷ 12) - (48 ÷ 6) = ?", options: ["68", "72", "76", "80"], correctOption: 1 },
    { question: "(1440 ÷ 18) + 20 = ?", options: ["90", "100", "110", "120"], correctOption: 1 },

    { question: "(500 + 700) ÷ 20 = ?", options: ["55", "60", "65", "70"], correctOption: 1 },
    { question: "(1350 ÷ 15) - 10 = ?", options: ["70", "80", "90", "100"], correctOption: 2 },
    { question: "(420 ÷ 7) × 3 = ?", options: ["160", "170", "180", "190"], correctOption: 2 },
    { question: "(1080 ÷ 12) + 15 = ?", options: ["95", "105", "115", "125"], correctOption: 1 },
    { question: "(2000 ÷ 25) - 20 = ?", options: ["60", "70", "80", "90"], correctOption: 2 },

    { question: "(1800 ÷ 12) + (120 ÷ 6) = ?", options: ["160", "170", "180", "190"], correctOption: 2 },
    { question: "(1440 ÷ 18) × 4 = ?", options: ["300", "320", "340", "360"], correctOption: 3 },
    { question: "(900 ÷ 15) + (72 ÷ 6) = ?", options: ["68", "70", "72", "74"], correctOption: 1 },
    { question: "(1250 ÷ 25) × 6 = ?", options: ["240", "270", "300", "330"], correctOption: 2 },
    { question: "(2100 ÷ 21) + 45 = ?", options: ["135", "145", "155", "165"], correctOption: 1 },

    { question: "(3600 ÷ 24) - (60 ÷ 5) = ?", options: ["130", "140", "150", "160"], correctOption: 2 },
    { question: "(840 ÷ 14) × (18 ÷ 6) = ?", options: ["150", "160", "170", "180"], correctOption: 1 },
    { question: "(2700 ÷ 30) + (90 ÷ 9) = ?", options: ["100", "110", "120", "130"], correctOption: 1 },
    { question: "(1920 ÷ 16) - 20 = ?", options: ["80", "90", "100", "110"], correctOption: 2 },
    { question: "(150 × 8) ÷ 12 = ?", options: ["80", "90", "100", "110"], correctOption: 2 },

    { question: "(2250 ÷ 15) - (75 ÷ 3) = ?", options: ["110", "120", "130", "140"], correctOption: 1 },
    { question: "(960 ÷ 8) + (144 ÷ 12) = ?", options: ["120", "132", "144", "156"], correctOption: 1 },
    { question: "(3000 ÷ 25) + 28 = ?", options: ["128", "138", "148", "158"], correctOption: 2 },
    { question: "(1680 ÷ 14) × 2 = ?", options: ["220", "240", "260", "280"], correctOption: 1 },
    { question: "(2000 ÷ 20) + (180 ÷ 6) = ?", options: ["120", "130", "140", "150"], correctOption: 1 },

    { question: "(144 × 25) ÷ 12 = ?", options: ["250", "275", "300", "325"], correctOption: 2 },
    { question: "(3600 ÷ 18) - 40 = ?", options: ["140", "150", "160", "170"], correctOption: 2 },
    { question: "(1120 ÷ 8) + (96 ÷ 6) = ?", options: ["150", "156", "160", "166"], correctOption: 1 },
    { question: "(2500 ÷ 50) × 7 = ?", options: ["300", "320", "350", "370"], correctOption: 2 },
    { question: "(900 ÷ 10) + (360 ÷ 12) = ?", options: ["110", "120", "130", "140"], correctOption: 1 },

    { question: "(1750 ÷ 25) + (80 ÷ 4) = ?", options: ["90", "100", "110", "120"], correctOption: 2 },
    { question: "(2880 ÷ 24) - (120 ÷ 6) = ?", options: ["80", "90", "100", "110"], correctOption: 2 },
    { question: "(1320 ÷ 11) × 2 = ?", options: ["220", "240", "260", "280"], correctOption: 1 },
    { question: "(4500 ÷ 30) + 35 = ?", options: ["155", "165", "175", "185"], correctOption: 1 },
    { question: "(960 ÷ 12) + (150 ÷ 5) = ?", options: ["100", "110", "120", "130"], correctOption: 2 },
];

/* ========================= SEED ========================= */

async function seedQuestions() {
    try {
        console.log("🌱 Seeding 150 questions...");
        await db.delete(questionsEasy);
        await db.delete(questionsMedium);
        await db.delete(questionsHard);

        await db.insert(questionsEasy).values(easyQuestions);
        await db.insert(questionsMedium).values(mediumQuestions);
        await db.insert(questionsHard).values(hardQuestions);

        console.log("✅ Done: 50 Easy, 50 Medium, 50 Hard");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedQuestions();

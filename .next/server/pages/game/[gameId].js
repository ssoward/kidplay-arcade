/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/game/[gameId]";
exports.ids = ["pages/game/[gameId]"];
exports.modules = {

/***/ "(pages-dir-node)/./components/GamePage.tsx":
/*!*********************************!*\
  !*** ./components/GamePage.tsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_dynamic__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dynamic */ \"(pages-dir-node)/./node_modules/next/dynamic.js\");\n/* harmony import */ var next_dynamic__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dynamic__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/router */ \"(pages-dir-node)/./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nconst gameComponentMap = {\n    chess: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Chess_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Chess */ \"(pages-dir-node)/./games/Chess.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Chess\"\n            ]\n        },\n        ssr: false\n    }),\n    checkers: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Checkers_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Checkers */ \"(pages-dir-node)/./games/Checkers.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Checkers\"\n            ]\n        },\n        ssr: false\n    }),\n    'tic-tac-toe': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_TicTacToe_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/TicTacToe */ \"(pages-dir-node)/./games/TicTacToe.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/TicTacToe\"\n            ]\n        },\n        ssr: false\n    }),\n    hangman: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Hangman_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Hangman */ \"(pages-dir-node)/./games/Hangman.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Hangman\"\n            ]\n        },\n        ssr: false\n    }),\n    'memory-match': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_MemoryMatch_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/MemoryMatch */ \"(pages-dir-node)/./games/MemoryMatch.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/MemoryMatch\"\n            ]\n        },\n        ssr: false\n    }),\n    'dots-and-boxes': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_DotsAndBoxes_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/DotsAndBoxes */ \"(pages-dir-node)/./games/DotsAndBoxes.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/DotsAndBoxes\"\n            ]\n        },\n        ssr: false\n    }),\n    'connect-four': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_ConnectFour_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/ConnectFour */ \"(pages-dir-node)/./games/ConnectFour.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/ConnectFour\"\n            ]\n        },\n        ssr: false\n    }),\n    solitaire: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Solitaire_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Solitaire */ \"(pages-dir-node)/./games/Solitaire.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Solitaire\"\n            ]\n        },\n        ssr: false\n    }),\n    'rock-paper-scissors': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_RockPaperScissors_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/RockPaperScissors */ \"(pages-dir-node)/./games/RockPaperScissors.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/RockPaperScissors\"\n            ]\n        },\n        ssr: false\n    }),\n    'slide-puzzle': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_SlidePuzzle_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/SlidePuzzle */ \"(pages-dir-node)/./games/SlidePuzzle.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/SlidePuzzle\"\n            ]\n        },\n        ssr: false\n    }),\n    pong: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Pong_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Pong */ \"(pages-dir-node)/./games/Pong.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Pong\"\n            ]\n        },\n        ssr: false\n    }),\n    'quick-math': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_QuickMath_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/QuickMath */ \"(pages-dir-node)/./games/QuickMath.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/QuickMath\"\n            ]\n        },\n        ssr: false\n    }),\n    sudoku: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Sudoku_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Sudoku */ \"(pages-dir-node)/./games/Sudoku.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Sudoku\"\n            ]\n        },\n        ssr: false\n    }),\n    blackjack: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Blackjack_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Blackjack */ \"(pages-dir-node)/./games/Blackjack.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Blackjack\"\n            ]\n        },\n        ssr: false\n    }),\n    'trivia-blitz': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_TriviaBlitz_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/TriviaBlitz */ \"(pages-dir-node)/./games/TriviaBlitz.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/TriviaBlitz\"\n            ]\n        },\n        ssr: false\n    }),\n    'spot-difference': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_SpotDifference_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/SpotDifference */ \"(pages-dir-node)/./games/SpotDifference.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/SpotDifference\"\n            ]\n        },\n        ssr: false\n    }),\n    'maze-escape': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_MazeEscape_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/MazeEscape */ \"(pages-dir-node)/./games/MazeEscape.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/MazeEscape\"\n            ]\n        },\n        ssr: false\n    }),\n    'mind-sweep': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_MindSweep_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/MindSweep */ \"(pages-dir-node)/./games/MindSweep.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/MindSweep\"\n            ]\n        },\n        ssr: false\n    }),\n    'twenty-questions': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_TwentyQuestions_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/TwentyQuestions */ \"(pages-dir-node)/./games/TwentyQuestions.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/TwentyQuestions\"\n            ]\n        },\n        ssr: false\n    }),\n    'word-guess': next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_WordGuess_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/WordGuess */ \"(pages-dir-node)/./games/WordGuess.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/WordGuess\"\n            ]\n        },\n        ssr: false\n    }),\n    storyteller: next_dynamic__WEBPACK_IMPORTED_MODULE_2___default()(()=>__webpack_require__.e(/*! import() */ \"_pages-dir-node_games_Storyteller_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../games/Storyteller */ \"(pages-dir-node)/./games/Storyteller.tsx\")), {\n        loadableGenerated: {\n            modules: [\n                \"components/GamePage.tsx -> \" + \"../games/Storyteller\"\n            ]\n        },\n        ssr: false\n    })\n};\nconst GamePage = ()=>{\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();\n    const { gameId } = router.query;\n    if (!gameId || typeof gameId !== 'string') {\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"text-center mt-8\",\n            children: \"Loading...\"\n        }, void 0, false, {\n            fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/components/GamePage.tsx\",\n            lineNumber: 34,\n            columnNumber: 12\n        }, undefined);\n    }\n    const GameComponent = gameComponentMap[gameId];\n    if (!GameComponent) {\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"text-center mt-8 text-red-500\",\n            children: \"Game not found.\"\n        }, void 0, false, {\n            fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/components/GamePage.tsx\",\n            lineNumber: 40,\n            columnNumber: 12\n        }, undefined);\n    }\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"container mx-auto px-4 py-8\",\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(GameComponent, {}, void 0, false, {\n            fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/components/GamePage.tsx\",\n            lineNumber: 45,\n            columnNumber: 7\n        }, undefined)\n    }, void 0, false, {\n        fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/components/GamePage.tsx\",\n        lineNumber: 44,\n        columnNumber: 5\n    }, undefined);\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (GamePage);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL2NvbXBvbmVudHMvR2FtZVBhZ2UudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBMEI7QUFDUztBQUNLO0FBRXhDLE1BQU1HLG1CQUF3QztJQUM1Q0MsT0FBT0gsbURBQU9BLENBQUMsSUFBTSx3TEFBd0I7Ozs7OztRQUFJSSxLQUFLOztJQUN0REMsVUFBVUwsbURBQU9BLENBQUMsSUFBTSxpTUFBMkI7Ozs7OztRQUFJSSxLQUFLOztJQUM1RCxlQUFlSixtREFBT0EsQ0FBQyxJQUFNLG9NQUE0Qjs7Ozs7O1FBQUlJLEtBQUs7O0lBQ2xFRSxTQUFTTixtREFBT0EsQ0FBQyxJQUFNLDhMQUEwQjs7Ozs7O1FBQUlJLEtBQUs7O0lBQzFELGdCQUFnQkosbURBQU9BLENBQUMsSUFBTSwwTUFBOEI7Ozs7OztRQUFJSSxLQUFLOztJQUNyRSxrQkFBa0JKLG1EQUFPQSxDQUFDLElBQU0sNk1BQStCOzs7Ozs7UUFBSUksS0FBSzs7SUFDeEUsZ0JBQWdCSixtREFBT0EsQ0FBQyxJQUFNLDBNQUE4Qjs7Ozs7O1FBQUlJLEtBQUs7O0lBQ3JFRyxXQUFXUCxtREFBT0EsQ0FBQyxJQUFNLG9NQUE0Qjs7Ozs7O1FBQUlJLEtBQUs7O0lBQzlELHVCQUF1QkosbURBQU9BLENBQUMsSUFBTSw0TkFBb0M7Ozs7OztRQUFJSSxLQUFLOztJQUNsRixnQkFBZ0JKLG1EQUFPQSxDQUFDLElBQU0sME1BQThCOzs7Ozs7UUFBSUksS0FBSzs7SUFDckVJLE1BQU1SLG1EQUFPQSxDQUFDLElBQU0scUxBQXVCOzs7Ozs7UUFBSUksS0FBSzs7SUFDcEQsY0FBY0osbURBQU9BLENBQUMsSUFBTSxvTUFBNEI7Ozs7OztRQUFJSSxLQUFLOztJQUNqRUssUUFBUVQsbURBQU9BLENBQUMsSUFBTSwyTEFBeUI7Ozs7OztRQUFJSSxLQUFLOztJQUN4RE0sV0FBV1YsbURBQU9BLENBQUMsSUFBTSxvTUFBNEI7Ozs7OztRQUFJSSxLQUFLOztJQUM5RCxnQkFBZ0JKLG1EQUFPQSxDQUFDLElBQU0sME1BQThCOzs7Ozs7UUFBSUksS0FBSzs7SUFDckUsbUJBQW1CSixtREFBT0EsQ0FBQyxJQUFNLG1OQUFpQzs7Ozs7O1FBQUlJLEtBQUs7O0lBQzNFLGVBQWVKLG1EQUFPQSxDQUFDLElBQU0sdU1BQTZCOzs7Ozs7UUFBSUksS0FBSzs7SUFDbkUsY0FBY0osbURBQU9BLENBQUMsSUFBTSxvTUFBNEI7Ozs7OztRQUFJSSxLQUFLOztJQUNqRSxvQkFBb0JKLG1EQUFPQSxDQUFDLElBQU0sc05BQWtDOzs7Ozs7UUFBSUksS0FBSzs7SUFDN0UsY0FBY0osbURBQU9BLENBQUMsSUFBTSxvTUFBNEI7Ozs7OztRQUFJSSxLQUFLOztJQUNqRU8sYUFBYVgsbURBQU9BLENBQUMsSUFBTSwwTUFBOEI7Ozs7OztRQUFJSSxLQUFLOztBQUNwRTtBQUVBLE1BQU1RLFdBQXFCO0lBQ3pCLE1BQU1DLFNBQVNaLHNEQUFTQTtJQUN4QixNQUFNLEVBQUVhLE1BQU0sRUFBRSxHQUFHRCxPQUFPRSxLQUFLO0lBRS9CLElBQUksQ0FBQ0QsVUFBVSxPQUFPQSxXQUFXLFVBQVU7UUFDekMscUJBQU8sOERBQUNFO1lBQUlDLFdBQVU7c0JBQW1COzs7Ozs7SUFDM0M7SUFFQSxNQUFNQyxnQkFBZ0JoQixnQkFBZ0IsQ0FBQ1ksT0FBTztJQUU5QyxJQUFJLENBQUNJLGVBQWU7UUFDbEIscUJBQU8sOERBQUNGO1lBQUlDLFdBQVU7c0JBQWdDOzs7Ozs7SUFDeEQ7SUFFQSxxQkFDRSw4REFBQ0Q7UUFBSUMsV0FBVTtrQkFDYiw0RUFBQ0M7Ozs7Ozs7Ozs7QUFHUDtBQUVBLGlFQUFlTixRQUFRQSxFQUFDIiwic291cmNlcyI6WyIvVXNlcnMvc3Nvd2FyZC9zYW5kYm94L3dvcmtzcGFjZS9raWRwbGF5LWFyY2FkZS9jb21wb25lbnRzL0dhbWVQYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGR5bmFtaWMgZnJvbSAnbmV4dC9keW5hbWljJztcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJztcblxuY29uc3QgZ2FtZUNvbXBvbmVudE1hcDogUmVjb3JkPHN0cmluZywgYW55PiA9IHtcbiAgY2hlc3M6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9DaGVzcycpLCB7IHNzcjogZmFsc2UgfSksXG4gIGNoZWNrZXJzOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvQ2hlY2tlcnMnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAndGljLXRhYy10b2UnOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvVGljVGFjVG9lJyksIHsgc3NyOiBmYWxzZSB9KSxcbiAgaGFuZ21hbjogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL0hhbmdtYW4nKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAnbWVtb3J5LW1hdGNoJzogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL01lbW9yeU1hdGNoJyksIHsgc3NyOiBmYWxzZSB9KSxcbiAgJ2RvdHMtYW5kLWJveGVzJzogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL0RvdHNBbmRCb3hlcycpLCB7IHNzcjogZmFsc2UgfSksXG4gICdjb25uZWN0LWZvdXInOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvQ29ubmVjdEZvdXInKSwgeyBzc3I6IGZhbHNlIH0pLFxuICBzb2xpdGFpcmU6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9Tb2xpdGFpcmUnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAncm9jay1wYXBlci1zY2lzc29ycyc6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9Sb2NrUGFwZXJTY2lzc29ycycpLCB7IHNzcjogZmFsc2UgfSksXG4gICdzbGlkZS1wdXp6bGUnOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvU2xpZGVQdXp6bGUnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICBwb25nOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvUG9uZycpLCB7IHNzcjogZmFsc2UgfSksXG4gICdxdWljay1tYXRoJzogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL1F1aWNrTWF0aCcpLCB7IHNzcjogZmFsc2UgfSksXG4gIHN1ZG9rdTogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL1N1ZG9rdScpLCB7IHNzcjogZmFsc2UgfSksXG4gIGJsYWNramFjazogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL0JsYWNramFjaycpLCB7IHNzcjogZmFsc2UgfSksXG4gICd0cml2aWEtYmxpdHonOiBkeW5hbWljKCgpID0+IGltcG9ydCgnLi4vZ2FtZXMvVHJpdmlhQmxpdHonKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAnc3BvdC1kaWZmZXJlbmNlJzogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL1Nwb3REaWZmZXJlbmNlJyksIHsgc3NyOiBmYWxzZSB9KSxcbiAgJ21hemUtZXNjYXBlJzogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL01hemVFc2NhcGUnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAnbWluZC1zd2VlcCc6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9NaW5kU3dlZXAnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAndHdlbnR5LXF1ZXN0aW9ucyc6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9Ud2VudHlRdWVzdGlvbnMnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICAnd29yZC1ndWVzcyc6IGR5bmFtaWMoKCkgPT4gaW1wb3J0KCcuLi9nYW1lcy9Xb3JkR3Vlc3MnKSwgeyBzc3I6IGZhbHNlIH0pLFxuICBzdG9yeXRlbGxlcjogZHluYW1pYygoKSA9PiBpbXBvcnQoJy4uL2dhbWVzL1N0b3J5dGVsbGVyJyksIHsgc3NyOiBmYWxzZSB9KSxcbn07XG5cbmNvbnN0IEdhbWVQYWdlOiBSZWFjdC5GQyA9ICgpID0+IHtcbiAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XG4gIGNvbnN0IHsgZ2FtZUlkIH0gPSByb3V0ZXIucXVlcnk7XG5cbiAgaWYgKCFnYW1lSWQgfHwgdHlwZW9mIGdhbWVJZCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBtdC04XCI+TG9hZGluZy4uLjwvZGl2PjtcbiAgfVxuXG4gIGNvbnN0IEdhbWVDb21wb25lbnQgPSBnYW1lQ29tcG9uZW50TWFwW2dhbWVJZF07XG5cbiAgaWYgKCFHYW1lQ29tcG9uZW50KSB7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgbXQtOCB0ZXh0LXJlZC01MDBcIj5HYW1lIG5vdCBmb3VuZC48L2Rpdj47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiY29udGFpbmVyIG14LWF1dG8gcHgtNCBweS04XCI+XG4gICAgICA8R2FtZUNvbXBvbmVudCAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgR2FtZVBhZ2U7XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJkeW5hbWljIiwidXNlUm91dGVyIiwiZ2FtZUNvbXBvbmVudE1hcCIsImNoZXNzIiwic3NyIiwiY2hlY2tlcnMiLCJoYW5nbWFuIiwic29saXRhaXJlIiwicG9uZyIsInN1ZG9rdSIsImJsYWNramFjayIsInN0b3J5dGVsbGVyIiwiR2FtZVBhZ2UiLCJyb3V0ZXIiLCJnYW1lSWQiLCJxdWVyeSIsImRpdiIsImNsYXNzTmFtZSIsIkdhbWVDb21wb25lbnQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./components/GamePage.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fgame%2F%5BgameId%5D&preferredRegion=&absolutePagePath=.%2Fpages%2Fgame%2F%5BgameId%5D.js&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fgame%2F%5BgameId%5D&preferredRegion=&absolutePagePath=.%2Fpages%2Fgame%2F%5BgameId%5D.js&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   getServerSideProps: () => (/* binding */ getServerSideProps),\n/* harmony export */   getStaticPaths: () => (/* binding */ getStaticPaths),\n/* harmony export */   getStaticProps: () => (/* binding */ getStaticProps),\n/* harmony export */   reportWebVitals: () => (/* binding */ reportWebVitals),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   unstable_getServerProps: () => (/* binding */ unstable_getServerProps),\n/* harmony export */   unstable_getServerSideProps: () => (/* binding */ unstable_getServerSideProps),\n/* harmony export */   unstable_getStaticParams: () => (/* binding */ unstable_getStaticParams),\n/* harmony export */   unstable_getStaticPaths: () => (/* binding */ unstable_getStaticPaths),\n/* harmony export */   unstable_getStaticProps: () => (/* binding */ unstable_getStaticProps)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/pages/module.compiled */ \"(pages-dir-node)/./node_modules/next/dist/server/route-modules/pages/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(pages-dir-node)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/build/templates/helpers */ \"(pages-dir-node)/./node_modules/next/dist/build/templates/helpers.js\");\n/* harmony import */ var private_next_pages_document__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! private-next-pages/_document */ \"(pages-dir-node)/./node_modules/next/dist/pages/_document.js\");\n/* harmony import */ var private_next_pages_document__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(private_next_pages_document__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var private_next_pages_app__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! private-next-pages/_app */ \"(pages-dir-node)/./pages/_app.js\");\n/* harmony import */ var _pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./pages/game/[gameId].js */ \"(pages-dir-node)/./pages/game/[gameId].js\");\n\n\n\n// Import the app and document modules.\n\n\n// Import the userland code.\n\n// Re-export the component (should be the default export).\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'default'));\n// Re-export methods.\nconst getStaticProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'getStaticProps');\nconst getStaticPaths = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'getStaticPaths');\nconst getServerSideProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'getServerSideProps');\nconst config = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'config');\nconst reportWebVitals = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'reportWebVitals');\n// Re-export legacy methods.\nconst unstable_getStaticProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticProps');\nconst unstable_getStaticPaths = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticPaths');\nconst unstable_getStaticParams = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getStaticParams');\nconst unstable_getServerProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getServerProps');\nconst unstable_getServerSideProps = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__, 'unstable_getServerSideProps');\n// Create and export the route module that will be consumed.\nconst routeModule = new next_dist_server_route_modules_pages_module_compiled__WEBPACK_IMPORTED_MODULE_0__.PagesRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.PAGES,\n        page: \"/game/[gameId]\",\n        pathname: \"/game/[gameId]\",\n        // The following aren't used in production.\n        bundlePath: '',\n        filename: ''\n    },\n    components: {\n        // default export might not exist when optimized for data only\n        App: private_next_pages_app__WEBPACK_IMPORTED_MODULE_4__[\"default\"],\n        Document: (private_next_pages_document__WEBPACK_IMPORTED_MODULE_3___default())\n    },\n    userland: _pages_game_gameId_js__WEBPACK_IMPORTED_MODULE_5__\n});\n\n//# sourceMappingURL=pages.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL25vZGVfbW9kdWxlcy9uZXh0L2Rpc3QvYnVpbGQvd2VicGFjay9sb2FkZXJzL25leHQtcm91dGUtbG9hZGVyL2luZGV4LmpzP2tpbmQ9UEFHRVMmcGFnZT0lMkZnYW1lJTJGJTVCZ2FtZUlkJTVEJnByZWZlcnJlZFJlZ2lvbj0mYWJzb2x1dGVQYWdlUGF0aD0uJTJGcGFnZXMlMkZnYW1lJTJGJTVCZ2FtZUlkJTVELmpzJmFic29sdXRlQXBwUGF0aD1wcml2YXRlLW5leHQtcGFnZXMlMkZfYXBwJmFic29sdXRlRG9jdW1lbnRQYXRoPXByaXZhdGUtbmV4dC1wYWdlcyUyRl9kb2N1bWVudCZtaWRkbGV3YXJlQ29uZmlnQmFzZTY0PWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBd0Y7QUFDaEM7QUFDRTtBQUMxRDtBQUN5RDtBQUNWO0FBQy9DO0FBQ3FEO0FBQ3JEO0FBQ0EsaUVBQWUsd0VBQUssQ0FBQyxrREFBUSxZQUFZLEVBQUM7QUFDMUM7QUFDTyx1QkFBdUIsd0VBQUssQ0FBQyxrREFBUTtBQUNyQyx1QkFBdUIsd0VBQUssQ0FBQyxrREFBUTtBQUNyQywyQkFBMkIsd0VBQUssQ0FBQyxrREFBUTtBQUN6QyxlQUFlLHdFQUFLLENBQUMsa0RBQVE7QUFDN0Isd0JBQXdCLHdFQUFLLENBQUMsa0RBQVE7QUFDN0M7QUFDTyxnQ0FBZ0Msd0VBQUssQ0FBQyxrREFBUTtBQUM5QyxnQ0FBZ0Msd0VBQUssQ0FBQyxrREFBUTtBQUM5QyxpQ0FBaUMsd0VBQUssQ0FBQyxrREFBUTtBQUMvQyxnQ0FBZ0Msd0VBQUssQ0FBQyxrREFBUTtBQUM5QyxvQ0FBb0Msd0VBQUssQ0FBQyxrREFBUTtBQUN6RDtBQUNPLHdCQUF3QixrR0FBZ0I7QUFDL0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLGFBQWEsOERBQVc7QUFDeEIsa0JBQWtCLG9FQUFnQjtBQUNsQyxLQUFLO0FBQ0wsWUFBWTtBQUNaLENBQUM7O0FBRUQiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYWdlc1JvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9wYWdlcy9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IGhvaXN0IH0gZnJvbSBcIm5leHQvZGlzdC9idWlsZC90ZW1wbGF0ZXMvaGVscGVyc1wiO1xuLy8gSW1wb3J0IHRoZSBhcHAgYW5kIGRvY3VtZW50IG1vZHVsZXMuXG5pbXBvcnQgKiBhcyBkb2N1bWVudCBmcm9tIFwicHJpdmF0ZS1uZXh0LXBhZ2VzL19kb2N1bWVudFwiO1xuaW1wb3J0ICogYXMgYXBwIGZyb20gXCJwcml2YXRlLW5leHQtcGFnZXMvX2FwcFwiO1xuLy8gSW1wb3J0IHRoZSB1c2VybGFuZCBjb2RlLlxuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi4vcGFnZXMvZ2FtZS9bZ2FtZUlkXS5qc1wiO1xuLy8gUmUtZXhwb3J0IHRoZSBjb21wb25lbnQgKHNob3VsZCBiZSB0aGUgZGVmYXVsdCBleHBvcnQpLlxuZXhwb3J0IGRlZmF1bHQgaG9pc3QodXNlcmxhbmQsICdkZWZhdWx0Jyk7XG4vLyBSZS1leHBvcnQgbWV0aG9kcy5cbmV4cG9ydCBjb25zdCBnZXRTdGF0aWNQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAnZ2V0U3RhdGljUHJvcHMnKTtcbmV4cG9ydCBjb25zdCBnZXRTdGF0aWNQYXRocyA9IGhvaXN0KHVzZXJsYW5kLCAnZ2V0U3RhdGljUGF0aHMnKTtcbmV4cG9ydCBjb25zdCBnZXRTZXJ2ZXJTaWRlUHJvcHMgPSBob2lzdCh1c2VybGFuZCwgJ2dldFNlcnZlclNpZGVQcm9wcycpO1xuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IGhvaXN0KHVzZXJsYW5kLCAnY29uZmlnJyk7XG5leHBvcnQgY29uc3QgcmVwb3J0V2ViVml0YWxzID0gaG9pc3QodXNlcmxhbmQsICdyZXBvcnRXZWJWaXRhbHMnKTtcbi8vIFJlLWV4cG9ydCBsZWdhY3kgbWV0aG9kcy5cbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U3RhdGljUHJvcHMnKTtcbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQYXRocyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U3RhdGljUGF0aHMnKTtcbmV4cG9ydCBjb25zdCB1bnN0YWJsZV9nZXRTdGF0aWNQYXJhbXMgPSBob2lzdCh1c2VybGFuZCwgJ3Vuc3RhYmxlX2dldFN0YXRpY1BhcmFtcycpO1xuZXhwb3J0IGNvbnN0IHVuc3RhYmxlX2dldFNlcnZlclByb3BzID0gaG9pc3QodXNlcmxhbmQsICd1bnN0YWJsZV9nZXRTZXJ2ZXJQcm9wcycpO1xuZXhwb3J0IGNvbnN0IHVuc3RhYmxlX2dldFNlcnZlclNpZGVQcm9wcyA9IGhvaXN0KHVzZXJsYW5kLCAndW5zdGFibGVfZ2V0U2VydmVyU2lkZVByb3BzJyk7XG4vLyBDcmVhdGUgYW5kIGV4cG9ydCB0aGUgcm91dGUgbW9kdWxlIHRoYXQgd2lsbCBiZSBjb25zdW1lZC5cbmV4cG9ydCBjb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBQYWdlc1JvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5QQUdFUyxcbiAgICAgICAgcGFnZTogXCIvZ2FtZS9bZ2FtZUlkXVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvZ2FtZS9bZ2FtZUlkXVwiLFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGFyZW4ndCB1c2VkIGluIHByb2R1Y3Rpb24uXG4gICAgICAgIGJ1bmRsZVBhdGg6ICcnLFxuICAgICAgICBmaWxlbmFtZTogJydcbiAgICB9LFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgLy8gZGVmYXVsdCBleHBvcnQgbWlnaHQgbm90IGV4aXN0IHdoZW4gb3B0aW1pemVkIGZvciBkYXRhIG9ubHlcbiAgICAgICAgQXBwOiBhcHAuZGVmYXVsdCxcbiAgICAgICAgRG9jdW1lbnQ6IGRvY3VtZW50LmRlZmF1bHRcbiAgICB9LFxuICAgIHVzZXJsYW5kXG59KTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFnZXMuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fgame%2F%5BgameId%5D&preferredRegion=&absolutePagePath=.%2Fpages%2Fgame%2F%5BgameId%5D.js&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!\n");

/***/ }),

/***/ "(pages-dir-node)/./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n\n\n// import Header from '../components/Header';\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/pages/_app.js\",\n            lineNumber: 8,\n            columnNumber: 7\n        }, this)\n    }, void 0, false);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL19hcHAuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQStCO0FBQy9CLDZDQUE2QztBQUU5QixTQUFTQSxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ2xELHFCQUNFO2tCQUVFLDRFQUFDRDtZQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7QUFHOUIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9zc293YXJkL3NhbmRib3gvd29ya3NwYWNlL2tpZHBsYXktYXJjYWRlL3BhZ2VzL19hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnO1xuLy8gaW1wb3J0IEhlYWRlciBmcm9tICcuLi9jb21wb25lbnRzL0hlYWRlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgey8qIDxIZWFkZXIgLz4gKi99XG4gICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgPC8+XG4gICk7XG59XG4iXSwibmFtZXMiOlsiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/_app.js\n");

/***/ }),

/***/ "(pages-dir-node)/./pages/game/[gameId].js":
/*!********************************!*\
  !*** ./pages/game/[gameId].js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Game)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _components_GamePage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../components/GamePage */ \"(pages-dir-node)/./components/GamePage.tsx\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/router */ \"(pages-dir-node)/./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nfunction Game() {\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();\n    const { gameId } = router.query;\n    // Pass gameId as prop if needed by GamePage\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_GamePage__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n        gameId: gameId\n    }, void 0, false, {\n        fileName: \"/Users/ssoward/sandbox/workspace/kidplay-arcade/pages/game/[gameId].js\",\n        lineNumber: 9,\n        columnNumber: 10\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL2dhbWUvW2dhbWVJZF0uanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQTBCO0FBQ3VCO0FBQ1Q7QUFFekIsU0FBU0c7SUFDdEIsTUFBTUMsU0FBU0Ysc0RBQVNBO0lBQ3hCLE1BQU0sRUFBRUcsTUFBTSxFQUFFLEdBQUdELE9BQU9FLEtBQUs7SUFDL0IsNENBQTRDO0lBQzVDLHFCQUFPLDhEQUFDTCw0REFBUUE7UUFBQ0ksUUFBUUE7Ozs7OztBQUMzQiIsInNvdXJjZXMiOlsiL1VzZXJzL3Nzb3dhcmQvc2FuZGJveC93b3Jrc3BhY2Uva2lkcGxheS1hcmNhZGUvcGFnZXMvZ2FtZS9bZ2FtZUlkXS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEdhbWVQYWdlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvR2FtZVBhZ2UnO1xuaW1wb3J0IHsgdXNlUm91dGVyIH0gZnJvbSAnbmV4dC9yb3V0ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBHYW1lKCkge1xuICBjb25zdCByb3V0ZXIgPSB1c2VSb3V0ZXIoKTtcbiAgY29uc3QgeyBnYW1lSWQgfSA9IHJvdXRlci5xdWVyeTtcbiAgLy8gUGFzcyBnYW1lSWQgYXMgcHJvcCBpZiBuZWVkZWQgYnkgR2FtZVBhZ2VcbiAgcmV0dXJuIDxHYW1lUGFnZSBnYW1lSWQ9e2dhbWVJZH0gLz47XG59XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJHYW1lUGFnZSIsInVzZVJvdXRlciIsIkdhbWUiLCJyb3V0ZXIiLCJnYW1lSWQiLCJxdWVyeSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/game/[gameId].js\n");

/***/ }),

/***/ "(pages-dir-node)/./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("axios");;

/***/ }),

/***/ "chess.js":
/*!***************************!*\
  !*** external "chess.js" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("chess.js");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-chessboard":
/*!***********************************!*\
  !*** external "react-chessboard" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-chessboard");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(pages-dir-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES&page=%2Fgame%2F%5BgameId%5D&preferredRegion=&absolutePagePath=.%2Fpages%2Fgame%2F%5BgameId%5D.js&absoluteAppPath=private-next-pages%2F_app&absoluteDocumentPath=private-next-pages%2F_document&middlewareConfigBase64=e30%3D!")));
module.exports = __webpack_exports__;

})();
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_1 = require("@react-email/html");
const head_1 = require("@react-email/head");
const react_1 = __importDefault(require("react"));
function Email() {
    return (react_1.default.createElement(html_1.Html, null,
        react_1.default.createElement(head_1.Head, null,
            react_1.default.createElement("meta", { content: '' }))));
}
exports.default = Email;

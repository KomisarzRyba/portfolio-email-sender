"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.MessageSchema = zod_1.default.object({
    senderName: zod_1.default.string().min(1),
    senderEmail: zod_1.default.string().email(),
    messageContent: zod_1.default.string().min(1),
});

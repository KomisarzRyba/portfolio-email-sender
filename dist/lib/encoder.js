"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSafeBase64Encode = void 0;
const webSafeBase64Encode = (data) => {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_');
};
exports.webSafeBase64Encode = webSafeBase64Encode;

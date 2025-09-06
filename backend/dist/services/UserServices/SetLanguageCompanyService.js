"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Company_1 = __importDefault(require("../../models/Company"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const SetLanguageCompanyService = async (companyId, newLanguage) => {
    const company = await Company_1.default.findByPk(companyId);
    if (!company)
        throw new AppError_1.default("ERR_NO_USER_FOUND", 404);
    if (company.language === newLanguage)
        return;
    await company.update({
        language: newLanguage
    });
};
exports.default = SetLanguageCompanyService;

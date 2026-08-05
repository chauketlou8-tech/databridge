import type { Query } from "../../types/query";
import { QueryError, SchemaError, ModelError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getCouchType } from "./Types";
import type { Model } from "../../model";
import { Schema } from "../../schema";

/**
 * CouchDB query handler class
 * Translates DataBridge queries into CouchDB operations
 */
export default class CouchQuery extends BaseQuery {
    protected connection: any;
    private databaseName: string;
    private model: Model | null;

    constructor(query: Query, db: unknown, model: Model | null = null) {
        super(query);
        this.connection = db;
        this.databaseName = "";
        this.model = model;
        this.fields = {};
    }

    protected mapType(type: string): any {
        return getCouchType(type);
    }

    // ==================== CREATE HANDLER ====================

    private async handleCreate(): Promise<any> {
        switch (this.query.type) {
            case "model":
                return await this.handleCreateModel();
            case "object":
                return await this.handleCreateObject();
            default:
                throw new QueryError(`Create type "${this.query.type}" not implemented`, "D036");
        }
    }

    private async handleCreateModel(): Promise<void> {
        this.readSchema();
        // Initialize the id counter
        try {
            await this.connection.insert({
                _id: "id",
                type: "system",
                lastId: 0
            });
        } catch (error: any) {
            // If it already exists, that's fine
            if (error.statusCode !== 409) {
                throw error;
            }
        }
    }

    private async handleCreateObject(): Promise<void> {
        const row = this.data!.data as Record<string, unknown>;

        const schema = this.model?.getSchema();
        if (schema) {
            this.validateDataAgainstSchema(row, schema);
        }

        const nextId = await this.getNextId();

        const doc = {
            ...row,
            id: nextId,
            type: this.databaseName
        };
        await this.connection.insert(doc);
    }

    // ==================== ID GENERATOR ====================

    private async getNextId(): Promise<number> {
        const counterId = "id";

        try {
            // Try to get and update the counter document atomically
            const counter = await this.connection.get(counterId);
            const nextId = (counter.lastId || 0) + 1;

            // Update the counter
            await this.connection.insert({
                _id: counterId,
                _rev: counter._rev,
                type: "system",
                lastId: nextId
            });

            return nextId;
        } catch (error: any) {
            if (error.statusCode === 404) {
                // Counter doesn't exist, create it
                await this.connection.insert({
                    _id: counterId,
                    type: "system",
                    lastId: 1
                });
                return 1;
            }
            throw error;
        }
    }

    private validateDataAgainstSchema(data: Record<string, unknown>, schema: Schema): void {
        for (const field of schema.fields) {
            if (!data.hasOwnProperty(field.field)) {
                throw new ModelError(`Missing required field: "${field.field}"`, "D052");
            }
        }

        const schemaKeys = schema.fields.map((f: { field: any; }) => f.field);
        const dataKeys = Object.keys(data);

        for (const key of dataKeys) {
            if (key !== 'type' && !schemaKeys.includes(key)) {
                throw new ModelError(`Extra field "${key}" not defined in schema`, "D052");
            }
        }

        for (const field of schema.fields) {
            const value = data[field.field];

            switch (field.type) {
                case "STRING":
                    if (typeof value !== "string") {
                        throw new ModelError(`Field "${field.field}" must be a string`, "D053");
                    }
                    break;
                case "NUMBER":
                    if (typeof value !== "number") {
                        throw new ModelError(`Field "${field.field}" must be a number`, "D053");
                    }
                    break;
                case "BOOLEAN":
                    if (typeof value !== "boolean") {
                        throw new ModelError(`Field "${field.field}" must be a boolean`, "D053");
                    }
                    break;
                case "DATE":
                    if (!(value instanceof Date) && typeof value !== "string") {
                        throw new ModelError(`Field "${field.field}" must be a Date or string`, "D053");
                    }
                    break;
                case "OBJECT":
                    if (typeof value !== "object" || value === null || Array.isArray(value)) {
                        throw new ModelError(`Field "${field.field}" must be an object`, "D053");
                    }
                    break;
                case "ARRAY":
                    if (!Array.isArray(value)) {
                        throw new ModelError(`Field "${field.field}" must be an array`, "D053");
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // ==================== FIND HANDLER ====================

    private async handleFind(): Promise<any[]> {
        try {
            const where = this.getWhere();
            const typeFilter = { type: this.databaseName };

            if (!where || Object.keys(where).length === 0) {
                const result = await this.connection.find({
                    selector: typeFilter
                });
                return result.docs || [];
            }

            const needsJsFilter = this.needsJavaScriptFilter(where);

            let docs: any[];
            if (needsJsFilter) {
                const result = await this.connection.find({
                    selector: typeFilter
                });
                docs = result.docs || [];
                docs = this.filterDocs(docs, where);
            } else {
                const topLevelResult = await this.handleTopLevelOperators(false);
                if (topLevelResult !== null) {
                    return topLevelResult;
                }

                const selector = this.buildSelector(where);
                const finalSelector = { ...typeFilter, ...selector };
                const result = await this.connection.find({
                    selector: finalSelector
                });
                docs = result.docs || [];
            }

            return docs;

        } catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }
            throw new QueryError(`Failed to query database "${this.databaseName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    // ==================== FINDONE HANDLER ====================

    private async handleFindOne(): Promise<any | null> {
        try {
            const where = this.getWhere();
            const typeFilter = { type: this.databaseName };

            if (!where || Object.keys(where).length === 0) {
                const result = await this.connection.find({
                    selector: typeFilter,
                    limit: 1
                });
                return result.docs.length > 0 ? result.docs[0] : null;
            }

            const needsJsFilter = this.needsJavaScriptFilter(where);

            if (needsJsFilter) {
                const result = await this.connection.find({
                    selector: typeFilter
                });
                let docs = result.docs || [];
                docs = this.filterDocs(docs, where);
                return docs.length > 0 ? docs[0] : null;
            } else {
                const topLevelResult = await this.handleTopLevelOperators(true);
                if (topLevelResult !== null) {
                    return topLevelResult;
                }

                const selector = this.buildSelector(where);
                const finalSelector = { ...typeFilter, ...selector };
                const result = await this.connection.find({
                    selector: finalSelector,
                    limit: 1
                });
                return result.docs.length > 0 ? result.docs[0] : null;
            }

        } catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }
            throw new QueryError(`Failed to find one in database "${this.databaseName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    // ==================== DETECT IF JAVASCRIPT FILTER IS NEEDED ====================

    private needsJavaScriptFilter(where: any): boolean {
        const operatorsRequiringJsFilter = ['mod', 'elemMatch', 'size', 'any', 'all', 'dateDiff', 'expr', 'levenshtein', 'soundex', 'nthContain'];

        for (const [key, value] of Object.entries(where)) {
            if (operatorsRequiringJsFilter.includes(key)) {
                return true;
            }
            if (typeof value === 'object' && value !== null) {
                for (const op of operatorsRequiringJsFilter) {
                    if (value.hasOwnProperty(op)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // ==================== JAVASCRIPT FILTER ====================

    private filterDocs(docs: any[], where: any): any[] {
        return docs.filter((doc: any) => this.matchesFilter(doc, where));
    }

    private matchesFilter(doc: any, where: any): boolean {
        for (const [key, value] of Object.entries(where)) {
            if (key === 'or' && Array.isArray(value)) {
                for (const condition of value) {
                    if (this.matchesFilter(doc, condition)) {
                        return true;
                    }
                }
                return false;
            }

            if (key === 'not' && typeof value === 'object') {
                return !this.matchesFilter(doc, value);
            }

            if (key === 'exists' && typeof value === 'object' && value !== null && 'relation' in value) {
                continue;
            }

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const hasOperator = Object.keys(value).some(k =>
                    ['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'regex', 'startsWith', 'endsWith', 'contains', 'nthContain', 'between', 'mod', 'elemMatch', 'size', 'any', 'all', 'text', 'ilike', 'soundex', 'levenshtein', 'dateDiff', 'not', 'isNull', 'exists'].includes(k)
                );

                if (hasOperator) {
                    if (!this.evaluateOperator(doc[key], value)) {
                        return false;
                    }
                } else {
                    if (JSON.stringify(doc[key]) !== JSON.stringify(value)) {
                        return false;
                    }
                }
            } else {
                if (doc[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }

    private evaluateOperator(docValue: any, condition: any): boolean {
        for (const [op, opValue] of Object.entries(condition)) {
            switch (op) {
                case 'gt':
                    if (typeof opValue !== 'number' && typeof opValue !== 'string') return false;
                    if (!(docValue > opValue)) return false;
                    break;
                case 'gte':
                    if (typeof opValue !== 'number' && typeof opValue !== 'string') return false;
                    if (!(docValue >= opValue)) return false;
                    break;
                case 'lt':
                    if (typeof opValue !== 'number' && typeof opValue !== 'string') return false;
                    if (!(docValue < opValue)) return false;
                    break;
                case 'lte':
                    if (typeof opValue !== 'number' && typeof opValue !== 'string') return false;
                    if (!(docValue <= opValue)) return false;
                    break;
                case 'ne':
                    if (docValue === opValue) return false;
                    break;
                case 'in':
                    if (!Array.isArray(opValue)) return false;
                    if (!opValue.includes(docValue)) return false;
                    break;
                case 'nin':
                    if (!Array.isArray(opValue)) return false;
                    if (opValue.includes(docValue)) return false;
                    break;
                case 'regex':
                    if (typeof opValue !== 'string') return false;
                    if (!new RegExp(opValue).test(String(docValue))) return false;
                    break;
                case 'startsWith':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (!docValue.startsWith(opValue)) return false;
                    break;
                case 'endsWith':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (!docValue.endsWith(opValue)) return false;
                    break;
                case 'contains':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (!docValue.includes(opValue)) return false;
                    break;
                case 'nthContain':
                    if (typeof opValue !== 'object' || opValue === null) return false;
                    return this.evaluateNthContain(docValue, opValue);
                case 'between':
                    if (!Array.isArray(opValue) || opValue.length !== 2) return false;
                    if (!(docValue >= opValue[0] && docValue <= opValue[1])) return false;
                    break;
                case 'mod':
                    if (!Array.isArray(opValue) || opValue.length !== 2) return false;
                    if (typeof docValue !== 'number' || typeof opValue[0] !== 'number' || typeof opValue[1] !== 'number') return false;
                    if (docValue % opValue[0] !== opValue[1]) return false;
                    break;
                case 'elemMatch':
                    if (!Array.isArray(docValue)) return false;
                    if (typeof opValue === 'object' && opValue !== null) {
                        for (const item of docValue) {
                            if (this.matchesFilter(item, opValue)) {
                                return true;
                            }
                        }
                        return false;
                    }
                    return false;
                case 'size':
                    if (!Array.isArray(docValue)) return false;
                    if (typeof opValue !== 'number') return false;
                    if (docValue.length !== opValue) return false;
                    break;
                case 'any':
                    return typeof opValue === 'string';
                case 'all':
                    if (Array.isArray(opValue)) {
                        if (!Array.isArray(docValue)) return false;
                        for (const item of opValue) {
                            if (!docValue.includes(item)) return false;
                        }
                        return true;
                    }
                    return false;
                case 'text':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (!docValue.includes(opValue)) return false;
                    break;
                case 'ilike':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (!docValue.toLowerCase().includes(opValue.toLowerCase())) return false;
                    break;
                case 'soundex':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (this.soundex(docValue) !== this.soundex(opValue)) return false;
                    break;
                case 'levenshtein':
                    if (typeof docValue !== 'string' || typeof opValue !== 'string') return false;
                    if (this.levenshteinDistance(docValue, opValue) > 2) return false;
                    break;
                case 'dateDiff':
                    if (!Array.isArray(opValue) || opValue.length !== 2) return false;
                    const date1 = opValue[0] === 'now' ? new Date() : new Date(opValue[0]);
                    const date2 = opValue[1] === 'now' ? new Date() : new Date(opValue[1]);
                    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
                    const diff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
                    if (diff > 7) return false;
                    break;
                case 'not':
                    if (typeof opValue === 'object' && opValue !== null) {
                        const keys = Object.keys(opValue);
                        if (keys.length === 0) return false;
                        const testDoc: any = {};
                        testDoc[keys[0]] = docValue;
                        return !this.matchesFilter(testDoc, opValue);
                    }
                    return docValue !== opValue;
                case 'isNull':
                    if (typeof opValue !== 'boolean') return false;
                    if (opValue && docValue !== null && docValue !== undefined) return false;
                    if (!opValue && (docValue === null || docValue === undefined)) return false;
                    break;
                case 'exists':
                    if (typeof opValue !== 'boolean') return false;
                    if (opValue && (docValue === undefined || docValue === null)) return false;
                    if (!opValue && (docValue !== undefined && docValue !== null)) return false;
                    break;
                default:
                    break;
            }
        }
        return true;
    }

    private evaluateNthContain(docValue: any, nthConditions: any): boolean {
        if (typeof docValue !== 'string') return false;

        const posMap: Record<string, number> = {
            "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5
        };

        for (const [position, positionValue] of Object.entries(nthConditions)) {
            let pos: number;
            if (posMap[position]) {
                pos = posMap[position];
            } else {
                pos = parseInt(position);
            }
            if (isNaN(pos) || pos < 1) return false;

            const prefix = "_".repeat(pos - 1);

            if (Array.isArray(positionValue)) {
                let found = false;
                for (const val of positionValue) {
                    if (typeof val !== 'string') continue;
                    const escaped = this.escapeRegex(val);
                    const r = new RegExp(`^${prefix}${escaped}`);
                    if (r.test(docValue)) {
                        found = true;
                        break;
                    }
                }
                if (!found) return false;
            } else if (typeof positionValue === 'string') {
                const escaped = this.escapeRegex(positionValue);
                const regex = new RegExp(`^${prefix}${escaped}`);
                if (!regex.test(docValue)) return false;
            } else {
                return false;
            }
        }
        return true;
    }

    // ==================== TOP LEVEL OPERATORS ====================

    private async handleTopLevelOperators(isFindOne: boolean): Promise<any | null> {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) return null;

        const typeFilter = { type: this.databaseName };
        let selector: Record<string, any> = {};

        if (where.or && Array.isArray(where.or)) {
            selector = { $or: [] };
            for (const condition of where.or) {
                const orCondition: Record<string, any> = {};
                for (const [key, value] of Object.entries(condition)) {
                    orCondition[key] = value;
                }
                selector.$or.push(orCondition);
            }

            const finalSelector = { ...typeFilter, ...selector };
            const result = await this.connection.find({
                selector: finalSelector,
                ...(isFindOne ? { limit: 1 } : {})
            });
            return isFindOne ? (result.docs.length > 0 ? result.docs[0] : null) : (result.docs || []);
        }

        if (where.not && typeof where.not === "object") {
            const notConditions = where.not;
            selector = {};
            for (const [key, value] of Object.entries(notConditions)) {
                selector[key] = { $ne: value };
            }

            const finalSelector = { ...typeFilter, ...selector };
            const result = await this.connection.find({
                selector: finalSelector,
                ...(isFindOne ? { limit: 1 } : {})
            });
            return isFindOne ? (result.docs.length > 0 ? result.docs[0] : null) : (result.docs || []);
        }

        if (where.exists && typeof where.exists === "object" && !Array.isArray(where.exists)) {
            const existsObj = where.exists as { relation?: string; where?: Record<string, any> };
            if (existsObj.relation && existsObj.where) {
                const result = await this.connection.find({
                    selector: typeFilter
                });
                const docs = result.docs || [];

                const matchingIds = docs
                    .filter((doc: any) => {
                        for (const [key, value] of Object.entries(existsObj.where!)) {
                            if (doc[key] !== value) return false;
                        }
                        return true;
                    })
                    .map((doc: any) => doc._id);

                if (matchingIds.length === 0) {
                    return isFindOne ? null : [];
                }

                const currentResult = await this.connection.find({
                    selector: {
                        _id: { $in: matchingIds }
                    },
                    ...(isFindOne ? { limit: 1 } : {})
                });
                return isFindOne ? (currentResult.docs.length > 0 ? currentResult.docs[0] : null) : (currentResult.docs || []);
            }
        }

        return null;
    }

    // ==================== SELECTOR BUILDER ====================

    private buildSelector(where: any): Record<string, any> {
        if (!where || Object.keys(where).length === 0) {
            return {};
        }

        const selector: Record<string, any> = {};
        const skipKeys = ['or', 'not', 'between', 'in', 'exists', 'all', 'size', 'elemMatch', 'mod', 'expr', 'any', 'distinct', 'text', 'ilike', 'soundex', 'levenshtein', 'dateDiff'];

        for (const [key, value] of Object.entries(where)) {
            if (skipKeys.includes(key)) {
                continue;
            }

            if (typeof value === "object" && value !== null) {
                this.handleObjectOperator(key, value, selector);
            } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                if (value === '') {
                    throw new QueryError(`Regex pattern cannot be empty for field "${key}"`, "D036");
                }
                selector[key] = { $regex: value };
            } else {
                selector[key] = value;
            }
        }

        return selector;
    }

    // ==================== OBJECT OPERATOR ROUTER ====================

    private handleObjectOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value.any !== undefined) {
            this.handleAnyOperator(key, value.any, selector);
            return;
        }

        if (value.all !== undefined) {
            if (typeof value.all === 'string') {
                this.handleAllSubqueryOperator(key, value.all, selector);
                return;
            }
            this.handleAllOperator(key, value.all, selector);
            return;
        }

        if (value.isDistinctFrom !== undefined) {
            this.handleDistinctOperator(key, value.isDistinctFrom, selector);
            return;
        }

        if (value.text !== undefined) {
            this.handleTextOperator(key, value.text, selector);
            return;
        }

        if (value.ilike !== undefined) {
            this.handleIlikeOperator(key, value.ilike, selector);
            return;
        }

        if (value.soundex !== undefined) {
            this.handleSoundexOperator(key, value.soundex, selector);
            return;
        }

        if (value.levenshtein !== undefined) {
            this.handleLevenshteinOperator(key, value.levenshtein, selector);
            return;
        }

        if (value.dateDiff !== undefined) {
            this.handleDateDiffOperator(key, value.dateDiff, selector);
            return;
        }

        if (value.mod !== undefined) {
            this.handleModOperator(key, value.mod, selector);
            return;
        }

        if (value.elemMatch !== undefined) {
            this.handleElemMatch(key, value.elemMatch, selector);
            return;
        }

        if (value.size !== undefined) {
            this.handleSizeOperator(key, value.size, selector);
            return;
        }

        if (value.nin !== undefined) {
            this.handleNinOperator(key, value.nin, selector);
            return;
        }

        if (value.exists !== undefined) {
            this.handleExistsOperator(key, value.exists, selector);
            return;
        }

        if (value.isNull !== undefined) {
            this.handleIsNullOperator(key, value.isNull, selector);
            return;
        }

        if (value.regex !== undefined) {
            this.handleRegexOperator(key, value.regex, selector);
            return;
        }

        if (value.startsWith !== undefined) {
            this.handleStartsWithOperator(key, value.startsWith, selector);
            return;
        }

        if (value.endsWith !== undefined) {
            this.handleEndsWithOperator(key, value.endsWith, selector);
            return;
        }

        if (value.contains !== undefined) {
            this.handleContainsOperator(key, value.contains, selector);
            return;
        }

        if (value.nthContain && typeof value.nthContain === "object") {
            this.handleNthContainOperator(key, value.nthContain, selector);
            return;
        }

        if (value.between !== undefined) {
            this.handleBetweenOperator(key, value.between, selector);
            return;
        }

        if (value.in !== undefined) {
            this.handleInOperator(key, value.in, selector);
            return;
        }

        if (value.not !== undefined) {
            if (value.not === null) {
                throw new QueryError(`"not" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
            selector[key] = { $ne: value.not };
            return;
        }

        for (const [operator, opValue] of Object.entries(value)) {
            if (operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte') {
                if (opValue === undefined || opValue === null) {
                    throw new QueryError(`"${operator}" operator value cannot be null or undefined for field "${key}"`, "D036");
                }
            }
            if (typeof opValue === 'string' && isNaN(Number(opValue))) {
                if (['gte', 'gt', 'lte', 'lt'].includes(operator)) {
                    throw new QueryError(`"${operator}" operator requires a number value for field "${key}"`, "D036");
                }
            }
            if (typeof opValue === 'object' && opValue !== null && !Array.isArray(opValue)) {
                throw new QueryError(`Invalid value type for operator "${operator}" on field "${key}"`, "D036");
            }
            switch (operator) {
                case "gte":
                    selector[key] = { $gte: opValue };
                    break;
                case "gt":
                    selector[key] = { $gt: opValue };
                    break;
                case "lte":
                    selector[key] = { $lte: opValue };
                    break;
                case "lt":
                    selector[key] = { $lt: opValue };
                    break;
                case "ne":
                    selector[key] = { $ne: opValue };
                    break;
                default:
                    selector[key] = opValue;
            }
        }
    }

    // ==================== OPERATOR HANDLERS ====================

    private handleAnyOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"any" operator requires a non-empty string subquery for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleAllSubqueryOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"all" subquery operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleDistinctOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"isDistinctFrom" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        selector[key] = { $ne: value };
    }

    private handleTextOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"text" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: this.escapeRegex(value) };
    }

    private handleIlikeOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"ilike" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: `(?i)${this.escapeRegex(value)}` };
    }

    private handleSoundexOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"soundex" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleLevenshteinOperator(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"levenshtein" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleDateDiffOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"dateDiff" operator requires an array of 2 values [date1, date2] for field "${key}"`, "D036");
        }
        const [date1, date2] = value;
        if (typeof date1 !== 'string' || typeof date2 !== 'string') {
            throw new QueryError(`"dateDiff" operator requires string values for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleModOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"mod" operator requires an array of 2 numbers [divisor, remainder] for field "${key}"`, "D036");
        }
        if (typeof value[0] !== 'number' || typeof value[1] !== 'number') {
            throw new QueryError(`"mod" operator requires number values for field "${key}"`, "D036");
        }
        if (value[0] <= 0) {
            throw new QueryError(`"mod" divisor must be greater than 0 for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleElemMatch(key: string, value: any, selector: Record<string, any>): void {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new QueryError(`"elemMatch" operator requires an object value for field "${key}"`, "D036");
        }
        if (Object.keys(value).length === 0) {
            throw new QueryError(`"elemMatch" operator requires at least one condition for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleSizeOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"size" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'number') {
            throw new QueryError(`"size" operator requires a number value for field "${key}"`, "D036");
        }
        if (value < 0) {
            throw new QueryError(`"size" operator requires a non-negative number for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleNinOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"nin" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"nin" operator requires a non-empty array for field "${key}"`, "D036");
        }
        for (const item of value) {
            if (item === undefined || item === null) {
                throw new QueryError(`"nin" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
        }
        selector[key] = { $nin: value };
    }

    private handleExistsOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"exists" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'boolean') {
            throw new QueryError(`"exists" operator requires a boolean value for field "${key}"`, "D036");
        }
        selector[key] = { $exists: value };
    }

    private handleIsNullOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"isNull" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'boolean') {
            throw new QueryError(`"isNull" operator requires a boolean value for field "${key}"`, "D036");
        }
        selector[key] = value ? { $exists: false } : { $exists: true };
    }

    private handleRegexOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"regex" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"regex" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"regex" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: value };
    }

    private handleStartsWithOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"startsWith" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"startsWith" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"startsWith" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: `^${this.escapeRegex(value)}` };
    }

    private handleEndsWithOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"endsWith" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"endsWith" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"endsWith" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: `${this.escapeRegex(value)}$` };
    }

    private handleContainsOperator(key: string, value: any, selector: Record<string, any>): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"contains" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"contains" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"contains" operator requires a non-empty string for field "${key}"`, "D036");
        }
        selector[key] = { $regex: this.escapeRegex(value) };
    }

    private handleNthContainOperator(key: string, value: any, selector: Record<string, any>): void {
        if (Object.keys(value).length === 0) {
            throw new QueryError(`"nthContain" operator requires at least one condition for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    private handleBetweenOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"between" operator requires an array of 2 values for field "${key}"`, "D036");
        }
        if (value[0] === undefined || value[0] === null || value[1] === undefined || value[1] === null) {
            throw new QueryError(`"between" operator values cannot be null or undefined for field "${key}"`, "D036");
        }
        selector[key] = { $gte: value[0], $lte: value[1] };
    }

    private handleInOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"in" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"in" operator requires a non-empty array value for field "${key}"`, "D036");
        }
        for (const item of value) {
            if (item === undefined || item === null) {
                throw new QueryError(`"in" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
        }
        selector[key] = { $in: value };
    }

    private handleAllOperator(key: string, value: any, selector: Record<string, any>): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"all" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"all" operator requires a non-empty array for field "${key}"`, "D036");
        }
        selector[key] = { $exists: true };
    }

    // ==================== UTILITY METHODS ====================

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private soundex(str: string): string {
        if (!str) return '';
        str = str.toUpperCase();
        const firstLetter = str.charAt(0);
        const letters = str.replace(/[AEIOUYHW]/g, '').slice(1);
        const codes: string[] = [];
        for (const char of letters) {
            const code = this.getSoundexCode(char);
            if (code && (codes.length === 0 || codes[codes.length - 1] !== code)) {
                codes.push(code);
            }
        }
        return firstLetter + codes.join('').padEnd(3, '0').slice(0, 3);
    }

    private getSoundexCode(char: string): string {
        const map: Record<string, string> = {
            'B': '1', 'F': '1', 'P': '1', 'V': '1',
            'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
            'D': '3', 'T': '3',
            'L': '4',
            'M': '5', 'N': '5',
            'R': '6'
        };
        return map[char] || '';
    }

    private levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // ==================== RUN ====================

    public async run(): Promise<any> {
        try {
            this.read();

            this.validateModelName();
            this.databaseName = this.getTableName();

            switch (this.operation) {
                case "create":
                    return await this.handleCreate();
                case "find":
                    return await this.handleFind();
                case "findOne":
                    return await this.handleFindOne();
                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            throw new QueryError(`CouchDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}
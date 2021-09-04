import { buildSchema } from "../src/database.js";

describe("Database functions", () => {
    it("should build schema", () => {
        const tables = {
            "Events" : {
                "id" : "BLOB",
                "msg" : "text",
                "cat" : "text",
                "coe" : "BLOB"
            }
        }
    
        const statement = buildSchema(tables);
        expect(statement).toBeDefined();
        expect(statement.Events).toBeDefined();
        expect(statement.Events).toEqual("CREATE TABLE IF NOT EXISTS ( id BLOB, msg text, cat text, coe BLOB)")
    })

})
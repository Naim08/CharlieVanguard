import { ScriptFunction } from "./utils";

export class CsvJoinableColumnsFunction extends ScriptFunction<{
  csv1: string;
  csv2: string;
}> {
  name: string = "csv_joinableColumns";
  description: string = "Determine which columns in two CSVs can be joined";
  parameters: any = {
    type: "object",
    properties: {
      csv1: {
        type: "string",
      },
      csv2: {
        type: "string",
      },
    },
    required: ["csv1", "csv2"],
    additionalProperties: false,
  };
}
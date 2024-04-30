import { ScriptFunction } from "./utils";

export class CsvSortByColumnFunction extends ScriptFunction<{
  csv: string;
  columnIndex: string;
}> {
  name: string = "csv_sortByColumn";
  description: string = "Sort a column in a CSV";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
        type: "string",
      },
      columnIndex: {
        type: "number",
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file",
      },
    },
    required: ["csv", "columnIndex"],
    additionalProperties: false,
  };
}

<script>
  import { insert } from "@meadowlark-labs/central";
  import { onMount } from "svelte";

  import { localized } from "../../bootup";
  import Table from "./Table.svelte";
  export let name = "table";
  export let columns = [];
  export let rows = [];
  export let coi;
  export let isLocalized;

  let tableQuery = `select * from ${name} join ${name}_columns on ${name}.id = ${name}_columns.table_id  where tombstone <> 1`;

  const handleLocalized = async () => {
    const colSchema = columns.reduce((acc, curr) => {
      acc[curr.key] = curr.type;
      return acc;
    }, {});
    const tableSchema = {
      [name]: {
        id: "text",
        coi: "text",
        key: "text",
      },
      [`${name}_columns`]: { ...colSchema, table_id: "text" },
    };
    console.log("dingo Localized Table Schema", tableSchema);
    const schema = { [name]: { ...tableSchema } };
    return await localized(["Table", tableSchema]);
  };

  onMount(() => {
    handleLocalized().then(async () => {
      return await rows
        .reduce(async (acc, curr) => {
          const prevAcc = await acc;
          const rec = await insert(`${name}_columns`, curr);
          console.log("dingo inserted table record", rec);
        }, Promise.resolve())
        .then((res) => console.log("dingo added all rows", res));
    });
  });
</script>

<Table {rows} {columns} />

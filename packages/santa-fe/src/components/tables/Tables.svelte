<script>
  import { localized } from "../../bootup";
  import Table from "./Table.svelte";
  export let name;
  export let columns;
  export let rows;
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
    await localized(["Table", tableSchema]);
  };

  $: if (isLocalized && columns.length && name) {
    handleLocalized();
  }
</script>

<Table {rows} {columns} />

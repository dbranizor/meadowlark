<script>
    import { Tables } from "@meadowlark-labs/santa-fe";
    import { onMount } from "svelte";
    let columnName, dataType, tableName;
    let selectedCOnstraint;
    let testUser = "John";
    let schema = false;
  
    onMount(() => console.log("dingo tables pure es6", Tables));
  
    const constraint = [
      { id: "", text: "" },
      { id: "PrimaryKey", text: "Primary Key" },
      { id: "ForeignKey", text: "Foreign Key" },
      { id: "Unique", text: "Unique" },
    ];
    const fieldType = [
      { id: "n", text: "Numeric" },
      { id: "s", text: "String" },
    ];
    let columns = [];
    let rows = [];
  
    $: databaseRows = columns.map(buildSqlTableRow);
    $: uiColumns = columns.map(buildUITableRow);
    $: uiColumns, console.log("Got UI DB Rows", uiColumns);
    $: tableSchema = databaseRows.reduce((acc, curr) => {
      acc[curr.tableName.trim()] = {
        ...acc[curr.tableName],
        [curr.key]: `${curr.type}`,
      };
      if (curr.constraint) {
        acc[curr.tableName.trim()][curr.key] = `${curr.type} ${curr.constraint}`;
      }
  
      return acc;
    }, {});
    $: databaseRows, console.log("Got SQL Table Rows", databaseRows);
    $: tableSchema, console.log("Got Database Schema", tableSchema);
  
    function buildUITableRow(tO) {
      return Object.keys(tO)
        .filter((t) => t.split("_")[0] === "ui" || t.split("_")[0] == "both")
        .reduce((acc, curr) => {
          let newField = curr.split("_")[1];
          acc[newField] = tO[curr];
          return acc;
        }, {});
    }
  
    function buildSqlTableRow(tO) {
      return Object.keys(tO)
        .filter((t) => t.split("_")[0] === "db" || t.split("_")[0] == "both")
        .reduce((acc, curr) => {
          let newField = curr.split("_")[1];
          acc[newField] = tO[curr];
          return acc;
        }, {});
    }
  
    const handleAddingColumns = () => {
      const row = {
        both_key: columnName,
        ui_title: columnName,
        ui_value: (v) => v[`${columnName}`],
        ui_sortable: true,
        db_type: dataType.text,
        db_tableName: tableName,
        db_constraint: selectedCOnstraint.text,
      };
      columns = [...columns, row];
    };
  
    const addTable = () => {
      schema = JSON.parse(JSON.stringify(tableSchema));
    };
  </script>
  
  <div class="w-full h-full flex items-center justify-center">
    <div class="max-w-md">
      <div class="flex flex-row">
        <div class="mr-auto text-large font-semibold">Table Name</div>
        <input bind:value={tableName} type="text" />
      </div>
      <div class="flex-row">
        <label for="">Field Name <span class="required">*</span> </label>
        <input bind:value={columnName} type="text" />
      </div>
      <div class="flex-row">
        <label for="">Constraint</label>
        <!-- svelte-ignore component-name-lowercase -->
        <select bind:value={dataType}>
          {#each fieldType as fieldItem}
            <option value={fieldItem}>
              {fieldItem.text}
            </option>
          {/each}
        </select>
      </div>
      <div class="flex-row">
        <label for="">Constraint</label>
        <!-- svelte-ignore component-name-lowercase -->
        <select bind:value={selectedCOnstraint}>
          {#each constraint as item}
            <option value={item}>
              {item.text}
            </option>
          {/each}
        </select>
      </div>
      <div class="flex-row flex">
        <button
          class="ml-auto px-2 py-1 bg-green-500"
          on:click={handleAddingColumns}>Add Column</button
        >
        <button class="px-2 py-1 bg-blue-500" on:click={addTable}
          >Create Table</button
        >
        <button class="px-2 py-1 bg-transparent border-red-500 border">
          Cancel
        </button>
      </div>
    </div>
  </div>
  
  <Tables name="wagon-wheel" {rows} {columns} {schema}  />
  
  <style>
  </style>
  
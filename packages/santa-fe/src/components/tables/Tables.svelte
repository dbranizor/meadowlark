<script>
  import { insert } from "@meadowlark-labs/central";
  import { onMount } from "svelte";
  import TableViewModel from "./TableViewModel.js";
  import { santaFe } from "../../bootup.js";
  import Table from "./Table.svelte";
  import { Components } from "../../enum.js";
  import TableStore from "./TableStore.js";

  export let name = "table";
  export let columns = [];
  export let rows = [];
  export let schema = {};
  export let isLocalized;
  let displayedRows = [];
  const unsubscribes = [];
  let appliedRows = [];

  $: rows, applyRows();
  $: columns, applyColumns();
  $: schema, applySchema();
  onMount(() => {
    console.log('dingo onmount in tables')
    TableViewModel.syncReady$.subscribe((r) => {
      if (r) {
        unsubscribes.push(
          TableViewModel.subscribe((t) => {
            console.log("Tables Picked Up Update. Refresh UI");
            displayedRows = t;
          }),
          TableViewModel.refresh(),
          TableStore.selected$.subscribe((v) => {
            const id = Object.keys(v)[0];
            if (v[id]) {
              console.log("dingo updated cell value", v, v[id]);
              console.log("dingo updated cell value", v, v[id]);
              TableViewModel.update(v[id], name);
            }
          })
        );
      }
    });
  });

  async function applyColumns() {
    console.log("dingo not applying schema");
  }
  async function applySchema() {
    console.log('dingo appling schema')
    await TableViewModel.updateSchema(schema);
    console.log('dingo applied schema')
  }
  async function applyRows() {
    const n = rows.filter((r) => !appliedRows.includes(r));
    try {
      await TableViewModel.addBatch(n, name);
    } catch (error) {
      throw new Error(`Error: ${error}`);
    }
    appliedRows = [...appliedRows, ...n];
  }

  let testUsers = [
    { id: "John", display: "John" },
    { id: "George", display: "George" },
    { id: "Paul", display: "Paul" },
    { id: "Ringo", display: "Rifngo" },
  ];

  let selectedUser = testUsers[1].display;

  const handleLocalized = async () => {
    return await santaFe({
      localized: [[Components.TABLES, schema]],
      user_id: selectedUser,
      sync_disabled: false,
      sync_url: "https://localhost/central-park",
      group_id: "meadowlark",
      debug: true,
      isOffline: true,
    });
  };

  onMount(() => {
    handleLocalized().then(async () => {
      return await rows
        .reduce(async (acc, curr) => {
          const prevAcc = await acc;
          const rec = await insert(`${name}_columns`, curr);
        }, Promise.resolve())
        .then((res) => console.log("dingo added all rows", res));
    });
  });
</script>

<!-- <Table rows={displayedRows} {columns} editable={true} /> -->

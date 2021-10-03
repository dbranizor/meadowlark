<script>
  import { onMount } from "svelte";
  import SvelteTable from "svelte-table";

  let dbstate = {};
  let rows = [];
  let hash = ""
  onMount(async () => {
    let response;
    try {
      response = await fetch(
        "https://localhost/central-park/dev/status?group_id=meadowlark",
        {
          method: "GET",
          mode: "cors",
          credentials: "same-origin",
        }
      );
    } catch (error) {
      throw new Error(error);
    }
    dbstate = await response.json();
    console.log("dingo database state", dbstate);
    rows = dbstate.data.messages;
    if(dbstate.data.merkle.hash){
      hash = dbstate.data.merkle.hash;
    }
    
    console.log("dingo rows", rows);
  });

  const columns = [
    {
      key: "column",
      title: "Column",
      value: (v) => v.column,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.column.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.column.charAt(0).toLowerCase(),
    },
    {
      key: "dataset",
      title: "Dataset",
      value: (v) => v.dataset,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.dataset.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.dataset.charAt(0).toLowerCase(),
    },
    {
      key: "group_id",
      title: "Group ID",
      value: (v) => v.group_id,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.group_id.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.group_id.charAt(0).toLowerCase(),
    },
    {
      key: "row",
      title: "Row",
      value: (v) => v.row,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.row.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.row.charAt(0).toLowerCase(),
    },
    {
      key: "timestamp",
      title: "TS",
      value: (v) => v.timestamp,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.timestamp.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.timestamp.charAt(0).toLowerCase(),
    },
    {
      key: "value",
      title: "Value",
      value: (v) => v.value,
      sortable: true,
      filterOptions: (rows) => {
        // use first letter of first_name to generate filter
        let letrs = {};
        rows.forEach((row) => {
          let letr = row.value.charAt(0);
          if (letrs[letr] === undefined)
            letrs[letr] = {
              name: `${letr.toUpperCase()}`,
              value: letr.toLowerCase(),
            };
        });
        // fix order
        letrs = Object.entries(letrs)
          .sort()
          .reduce((o, [k, v]) => ((o[k] = v), o), {});
        return Object.values(letrs);
      },
      filterValue: (v) => v.value.charAt(0).toLowerCase(),
    },
  ];
</script>

<main>
  <h1>Wagon Wheel {hash}</h1>
  <SvelteTable {columns} {rows} />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

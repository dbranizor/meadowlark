<script>
  import Messages from "../../santa-fe/src/components/messages/Messages.svelte";

  export let showMessages = false;
  let columnName, dataType, tableName;
</script>

<div class="w-full h-full flex items-center justify-center">
  <div class="max-w-md">
    <div class="flex flex-col">
      <div class="mr-auto text-large font-semibold">Table Name</div>
      <input type="text" />
    </div>
    <div class="flex-row">
      <label for="">Field Name <span class="required">*</span> </label>
      <input type="text" />
    </div>
    <div class="flex-row">
      <label for="">Field Data Type</label>
      <input type="text" />
    </div>
    <div class="flex-row flex">
      <button class="ml-auto px-2 py-1 bg-green-500">Add Column</button>
      <button class="px-2 py-1 bg-blue-500">Create Table</button>
      <button class="px-2 py-1 bg-transparent border-red-500 border">
        Cancel
      </button>
    </div>
  </div>
</div>

{#if showMessages}
  <Messages />
{/if}

<style>
</style>

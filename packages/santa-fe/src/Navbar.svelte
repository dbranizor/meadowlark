<script>
    export let navClass = "target";
</script>

<style>
</style>

<nav
    class="{navClass} flex justify-between items-center bg-background-ternary text-sm h-5">
    <div class="flex px-2 py-1">
        <p tabindex="0" class="text-gray-200 hover:text-gray-100">
            <slot name="name">Component</slot>
        </p>
    </div>
    <div class="flex px-2 py-1">
        <slot name="center uppercase tracking-wide font-semibold text-sm lg:text-xs w-68">Label</slot>
    </div>
    <div class="flex">
        <slot name="links">Action Buttons</slot>
    </div>
</nav>

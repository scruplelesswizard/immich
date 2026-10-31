<script lang="ts">
  import LockedGroupFormModal from '#lib/modals/LockedGroupFormModal.svelte';
  import { getLockedGroupsQuery } from '#lib/queries/locked-group.query.ts';
  import { Route } from '#lib/route.ts';
  import { Button, Switch, Text, modalManager } from '@immich/ui';
  import { mdiFolderLockOutline, mdiPlus } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    ungroupedOnly: boolean;
  };

  let { ungroupedOnly = $bindable() }: Props = $props();

  const query = createQuery(() => getLockedGroupsQuery());
  const groups = $derived(query.data ?? []);
</script>

<section class="flex flex-col gap-3 px-4 pt-2 pb-3">
  <div class="flex flex-wrap items-center gap-2">
    <Text fontWeight="medium">{$t('locked_groups')}</Text>
    {#each groups as group (group.id)}
      <Button
        href={Route.lockedGroup({ id: group.id })}
        size="small"
        variant="outline"
        color="secondary"
        leadingIcon={mdiFolderLockOutline}
      >
        {group.name} ({group.assetCount})
      </Button>
    {/each}
    <Button
      size="small"
      variant="ghost"
      leadingIcon={mdiPlus}
      onclick={() => modalManager.show(LockedGroupFormModal, {})}
    >
      {$t('new_locked_group')}
    </Button>
  </div>
  {#if groups.length === 0}
    <Text size="small" color="muted">{$t('no_locked_groups')}</Text>
  {:else}
    <label class="flex items-center gap-2">
      <Switch bind:checked={ungroupedOnly} />
      <Text size="small">{$t('ungrouped_only')}</Text>
    </label>
  {/if}
</section>

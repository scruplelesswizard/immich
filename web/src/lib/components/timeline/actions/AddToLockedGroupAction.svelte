<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleAddAssetsToLockedGroup } from '$lib/services/locked-group.service';
  import { Button } from '@immich/ui';
  import { mdiFolderPlusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
    onAdded?: (assetIds: string[]) => void;
  }

  let { menuItem = false, onAdded }: Props = $props();

  const addToGroup = async () => {
    const assetIds = assetMultiSelectManager.assets.map(({ id }) => id);
    if (await handleAddAssetsToLockedGroup(assetIds)) {
      onAdded?.(assetIds);
    }
  };
</script>

{#if menuItem}
  <MenuOption onClick={addToGroup} text={$t('add_to_locked_group')} icon={mdiFolderPlusOutline} />
{:else}
  <Button leadingIcon={mdiFolderPlusOutline} size="medium" color="secondary" variant="ghost" onclick={addToGroup}>
    {$t('add_to_locked_group')}
  </Button>
{/if}

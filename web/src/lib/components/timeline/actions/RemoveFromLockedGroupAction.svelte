<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleRemoveAssetsFromLockedGroup } from '$lib/services/locked-group.service';
  import { Button } from '@immich/ui';
  import { mdiFolderMinusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    groupId: string;
    menuItem?: boolean;
    onRemoved: (assetIds: string[]) => void;
  }

  let { groupId, menuItem = false, onRemoved }: Props = $props();

  const removeFromGroup = async () => {
    const assetIds = assetMultiSelectManager.assets.map(({ id }) => id);
    if (await handleRemoveAssetsFromLockedGroup(groupId, assetIds)) {
      onRemoved(assetIds);
    }
  };
</script>

{#if menuItem}
  <MenuOption onClick={removeFromGroup} text={$t('remove_from_locked_group')} icon={mdiFolderMinusOutline} />
{:else}
  <Button leadingIcon={mdiFolderMinusOutline} size="medium" color="secondary" variant="ghost" onclick={removeFromGroup}>
    {$t('remove_from_locked_group')}
  </Button>
{/if}

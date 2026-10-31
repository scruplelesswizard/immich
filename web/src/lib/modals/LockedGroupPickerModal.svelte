<script lang="ts">
  import type { LockedGroupResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, Stack, Text, modalManager } from '@immich/ui';
  import { mdiFolderLockOutline, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { lockedGroupManager } from '$lib/managers/locked-group-manager.svelte';
  import LockedGroupFormModal from '$lib/modals/LockedGroupFormModal.svelte';

  type Props = {
    onClose: (group?: LockedGroupResponseDto) => void;
  };

  const { onClose }: Props = $props();

  const groups = $derived(lockedGroupManager.groups);

  const handleCreate = async () => {
    const group = await modalManager.show(LockedGroupFormModal, {});
    if (group) {
      onClose(group);
    }
  };
</script>

<Modal size="small" title={$t('select_locked_group')} icon={mdiFolderLockOutline} {onClose}>
  <ModalBody>
    <Stack gap={2}>
      {#each groups as group (group.id)}
        <Button
          fullWidth
          variant="ghost"
          color="secondary"
          leadingIcon={mdiFolderLockOutline}
          onclick={() => onClose(group)}
        >
          {group.name}
          <Text size="tiny" color="muted"
            >{$t('locked_group_assets_count', { values: { count: group.assetCount } })}</Text
          >
        </Button>
      {/each}
      <Button fullWidth variant="outline" leadingIcon={mdiPlus} onclick={handleCreate}>
        {$t('new_locked_group')}
      </Button>
    </Stack>
  </ModalBody>
</Modal>

import LockedGroupFormModal from '#lib/modals/LockedGroupFormModal.svelte';
import LockedGroupPickerModal from '#lib/modals/LockedGroupPickerModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import {
  addAssetsToLockedGroupMutation,
  deleteLockedGroupMutation,
  removeAssetsFromLockedGroupMutation,
} from '#lib/queries/locked-group.query.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { BulkIdErrorReason, type LockedGroupResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const handleAddAssetsToLockedGroup = async (assetIds: string[]) => {
  const group = await modalManager.show(LockedGroupPickerModal, {});
  if (!group) {
    return false;
  }

  const $t = await getFormatter();
  return executeMutation(addAssetsToLockedGroupMutation, [{ id: group.id, bulkIdsDto: { ids: assetIds } }], {
    onSuccess: (results) => {
      const count = results.filter(({ success, error }) => success || error === BulkIdErrorReason.Duplicate).length;
      toastManager.primary($t('assets_added_to_locked_group_count', { values: { count } }));
    },
  }).then(() => true);
};

export const handleRemoveAssetsFromLockedGroup = async (groupId: string, assetIds: string[]) => {
  const $t = await getFormatter();
  let removed = false;
  await executeMutation(removeAssetsFromLockedGroupMutation, [{ id: groupId, bulkIdsDto: { ids: assetIds } }], {
    onSuccess: (results) => {
      removed = true;
      const count = results.filter(({ success }) => success).length;
      toastManager.primary($t('assets_removed_from_locked_group_count', { values: { count } }));
    },
  });
  return removed;
};

export const handleDeleteLockedGroup = async (group: LockedGroupResponseDto) => {
  const $t = await getFormatter();
  const confirmed = await modalManager.showDialog({
    title: $t('delete_locked_group'),
    prompt: $t('delete_locked_group_confirmation'),
    confirmText: $t('delete'),
    confirmColor: 'danger',
  });
  if (!confirmed) {
    return false;
  }

  let deleted = false;
  await executeMutation(deleteLockedGroupMutation, [{ id: group.id }], {
    onSuccess: () => {
      deleted = true;
    },
  });
  return deleted;
};

export const getLockedGroupActions = (
  $t: MessageFormatter,
  group: LockedGroupResponseDto,
  { onDeleted }: { onDeleted: () => void },
) => {
  const Rename: ActionItem = {
    title: $t('edit_locked_group'),
    icon: mdiPencilOutline,
    onAction: () => modalManager.show(LockedGroupFormModal, { group }),
  };

  const Delete: ActionItem = {
    title: $t('delete_locked_group'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: async () => {
      if (await handleDeleteLockedGroup(group)) {
        onDeleted();
      }
    },
  };

  return { Rename, Delete };
};

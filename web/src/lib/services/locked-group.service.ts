import {
  addAssetsToLockedGroup,
  BulkIdErrorReason,
  createLockedGroup,
  deleteLockedGroup,
  removeAssetsFromLockedGroup,
  updateLockedGroup,
  type LockedGroupResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { lockedGroupManager } from '$lib/managers/locked-group-manager.svelte';
import LockedGroupFormModal from '$lib/modals/LockedGroupFormModal.svelte';
import LockedGroupPickerModal from '$lib/modals/LockedGroupPickerModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const handleCreateLockedGroup = async (name: string) => {
  const $t = await getFormatter();
  try {
    const group = await createLockedGroup({ lockedGroupCreateDto: { name } });
    await lockedGroupManager.refresh();
    return group;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_locked_group'));
  }
};

export const handleUpdateLockedGroup = async (id: string, name: string) => {
  const $t = await getFormatter();
  try {
    const group = await updateLockedGroup({ id, lockedGroupUpdateDto: { name } });
    await lockedGroupManager.refresh();
    return group;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_locked_group'));
  }
};

export const handleAddAssetsToLockedGroup = async (assetIds: string[]) => {
  const group = await modalManager.show(LockedGroupPickerModal, {});
  if (!group) {
    return false;
  }

  const $t = await getFormatter();
  try {
    const results = await addAssetsToLockedGroup({ id: group.id, bulkIdsDto: { ids: assetIds } });
    const count = results.filter(({ success, error }) => success || error === BulkIdErrorReason.Duplicate).length;
    toastManager.primary($t('assets_added_to_locked_group_count', { values: { count } }));
    await lockedGroupManager.refresh();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_assets_to_locked_group'));
    return false;
  }
};

export const handleRemoveAssetsFromLockedGroup = async (groupId: string, assetIds: string[]) => {
  const $t = await getFormatter();
  try {
    const results = await removeAssetsFromLockedGroup({ id: groupId, bulkIdsDto: { ids: assetIds } });
    const count = results.filter(({ success }) => success).length;
    toastManager.primary($t('assets_removed_from_locked_group_count', { values: { count } }));
    await lockedGroupManager.refresh();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_assets_from_locked_group'));
    return false;
  }
};

export const handleDeleteLockedGroup = async (group: LockedGroupResponseDto) => {
  const $t = await getFormatter();
  const confirmed = await modalManager.showDialog({
    title: $t('delete_locked_group'),
    prompt: $t('delete_locked_group_confirmation'),
    confirmText: $t('delete'),
  });
  if (!confirmed) {
    return false;
  }

  try {
    await deleteLockedGroup({ id: group.id });
    await lockedGroupManager.refresh();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_locked_group'));
    return false;
  }
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

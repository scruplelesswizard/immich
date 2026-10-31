import { queryClient, asMutation } from '#lib/queries/client.ts';
import {
  addAssetsToLockedGroup,
  createLockedGroup,
  deleteLockedGroup,
  getLockedGroups,
  removeAssetsFromLockedGroup,
  updateLockedGroup,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const lockedGroupsQueryKey = ['locked-groups'];

export const getLockedGroupsQuery = () =>
  queryOptions({
    queryKey: lockedGroupsQueryKey,
    queryFn: ({ signal }) => getLockedGroups({ signal }),
  });

export const getLockedGroupQuery = (id: string) =>
  queryOptions({
    ...getLockedGroupsQuery(),
    select: (groups) => groups.find((group) => group.id === id),
  });

const invalidateLockedGroups = () => queryClient.invalidateQueries({ queryKey: lockedGroupsQueryKey });

export const createLockedGroupMutation = () =>
  asMutation(createLockedGroup, {
    onSuccess: invalidateLockedGroups,
    meta: { error: { toast: 'errors.unable_to_create_locked_group' } },
  });

export const updateLockedGroupMutation = () =>
  asMutation(updateLockedGroup, {
    onSuccess: invalidateLockedGroups,
    meta: { error: { toast: 'errors.unable_to_update_locked_group' } },
  });

export const deleteLockedGroupMutation = () =>
  asMutation(deleteLockedGroup, {
    onSuccess: invalidateLockedGroups,
    meta: { error: { toast: 'errors.unable_to_delete_locked_group' } },
  });

export const addAssetsToLockedGroupMutation = () =>
  asMutation(addAssetsToLockedGroup, {
    onSuccess: invalidateLockedGroups,
    meta: { error: { toast: 'errors.unable_to_add_assets_to_locked_group' } },
  });

export const removeAssetsFromLockedGroupMutation = () =>
  asMutation(removeAssetsFromLockedGroup, {
    onSuccess: invalidateLockedGroups,
    meta: { error: { toast: 'errors.unable_to_remove_assets_from_locked_group' } },
  });

import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { lockedGroupManager } from '$lib/managers/locked-group-manager.svelte';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  await lockedGroupManager.refresh();
  const group = lockedGroupManager.get(params.groupId);
  if (!group) {
    redirect(307, Route.locked());
  }

  return {
    groupId: group.id,
    meta: {
      title: group.name,
    },
  };
}) satisfies PageLoad;

import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { lockedGroupManager } from '$lib/managers/locked-group-manager.svelte';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  await lockedGroupManager.refresh();

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('locked_folder'),
    },
  };
}) satisfies PageLoad;

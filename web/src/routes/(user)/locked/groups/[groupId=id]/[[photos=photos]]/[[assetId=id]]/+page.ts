import { queryClient } from '#lib/queries/client.ts';
import { getLockedGroupQuery } from '#lib/queries/locked-group.query.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  const group = await queryClient.query(getLockedGroupQuery(params.groupId));
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

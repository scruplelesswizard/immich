<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '#lib/components/OnEvents.svelte';
  import ButtonContextMenu from '#lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import EmptyPlaceholder from '#lib/components/shared-components/EmptyPlaceholder.svelte';
  import ChangeDate from '#lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeLocation from '#lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DownloadAction from '#lib/components/timeline/actions/DownloadAction.svelte';
  import RemoveFromLockedGroupAction from '#lib/components/timeline/actions/RemoveFromLockedGroupAction.svelte';
  import SelectAllAssets from '#lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '#lib/components/timeline/actions/SetVisibilityAction.svelte';
  import AssetSelectControlBar from '#lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '#lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '#lib/constants.ts';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
  import { getLockedGroupQuery } from '#lib/queries/locked-group.query.ts';
  import { Route } from '#lib/route.ts';
  import { getLockedGroupActions } from '#lib/services/locked-group.service.ts';
  import { getUserActions } from '#lib/services/user.service.ts';
  import { AssetVisibility } from '@immich/sdk';
  import { mdiDotsVertical } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  const options = $derived({ visibility: AssetVisibility.Locked, lockedGroupId: data.groupId });

  const query = createQuery(() => getLockedGroupQuery(data.groupId));
  const group = $derived(query.data);

  const { LockSession } = $derived(getUserActions($t));
  const groupActions = $derived(
    group ? getLockedGroupActions($t, group, { onDeleted: () => void goto(Route.locked()) }) : null,
  );

  const handleEscape = () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
    }
  };

  const handleRemoved = (assetIds: string[]) => {
    assetMultiSelectManager.clear();
    timelineManager.removeAssets(assetIds);
  };

  const onSessionLocked = async () => {
    await goto(Route.photos());
  };
</script>

<OnEvents {onSessionLocked} />

<UserPageLayout
  title={group?.name ?? data.meta.title}
  actions={groupActions ? [groupActions.Rename, groupActions.Delete, LockSession] : [LockSession]}
  hideNavbar={assetMultiSelectManager.selectionActive}
  scrollbar={false}
>
  <Timeline
    enableRouting={true}
    bind:timelineManager
    {options}
    assetInteraction={assetMultiSelectManager}
    onEscape={handleEscape}
    removeAction={AssetAction.SET_VISIBILITY_TIMELINE}
  >
    {#snippet empty()}
      <EmptyPlaceholder
        text={$t('no_locked_group_photos_message')}
        title={$t('nothing_here_yet')}
        class="mx-auto mt-10"
      />
    {/snippet}
  </Timeline>
</UserPageLayout>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    <SelectAllAssets withText {timelineManager} assetInteraction={assetMultiSelectManager} />
    <RemoveFromLockedGroupAction groupId={data.groupId} onRemoved={handleRemoved} />
    <SetVisibilityAction unlock onVisibilitySet={handleRemoved} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

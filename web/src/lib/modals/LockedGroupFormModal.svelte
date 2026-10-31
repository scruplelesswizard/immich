<script lang="ts">
  import { createLockedGroupMutation, updateLockedGroupMutation } from '#lib/queries/locked-group.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import type { LockedGroupResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiFolderLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    group?: LockedGroupResponseDto;
    onClose: (group?: LockedGroupResponseDto) => void;
  };

  let { group, onClose }: Props = $props();

  let name = $state(group?.name ?? '');
  const disabled = $derived(name.trim().length === 0);

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (group) {
      await executeMutation(updateLockedGroupMutation, [{ id: group.id, lockedGroupUpdateDto: { name: trimmed } }], {
        onSuccess: onClose,
      });
      return;
    }

    await executeMutation(createLockedGroupMutation, [{ lockedGroupCreateDto: { name: trimmed } }], {
      onSuccess: onClose,
    });
  };
</script>

<FormModal
  size="small"
  title={group ? $t('edit_locked_group') : $t('create_locked_group')}
  submitText={group ? $t('save') : $t('create')}
  icon={mdiFolderLockOutline}
  {disabled}
  {onClose}
  {onSubmit}
>
  <Field label={$t('name')}>
    <Input bind:value={name} maxlength={100} />
  </Field>
</FormModal>

import { getLockedGroups, type LockedGroupResponseDto } from '@immich/sdk';

class LockedGroupManager {
  groups = $state<LockedGroupResponseDto[]>([]);

  async refresh() {
    this.groups = await getLockedGroups();
  }

  get(id: string) {
    return this.groups.find((group) => group.id === id);
  }
}

export const lockedGroupManager = new LockedGroupManager();
